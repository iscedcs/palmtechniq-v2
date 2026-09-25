import "server-only";

import { db } from "@/lib/db";
import { creditWallet, debitWallet } from "@/lib/payments/wallet";
import { computeGroupCashbackEarned } from "@/lib/payments/revenue";
import { notifyTutorOfGroupCompletion } from "@/lib/tutor-notifications";

/**
 * Joining a group purchase.
 *
 * Moved out of actions/group-purchase.ts so it can be exercised without a
 * login session (the same split the exam center uses: logic here, auth in the
 * action), and so the race below could be fixed and then proved fixed.
 *
 * THE RACE THIS CLOSES
 *
 * The group used to be read BEFORE the transaction, and the new member count
 * was computed from that stale read. When the last two seats were taken at the
 * same moment, both requests saw the same count, both concluded "I am the seat
 * that fills the group", and both ran the completion: the tutor was debited
 * the group's cashback twice and the creator credited twice, for one group.
 *
 * The update below is now conditional on the count we read. Of two simultaneous
 * joiners, exactly one matches; the other matches nothing, rolls back its
 * membership, and is told to try again. That single winner is also the only
 * one who notifies the tutor.
 */

export type JoinGroupResult =
  | { ok: true; alreadyMember: boolean; completed: boolean }
  | { ok: false; error: string };

/** The group moved between our read and our write. Retryable. */
class GroupChangedError extends Error {}

/** The cashback cannot be released, so the group cannot complete. */
class GroupCompletionError extends Error {}

export async function executeJoinGroup(params: {
  userId: string;
  inviteCode: string;
}): Promise<JoinGroupResult> {
  const { userId, inviteCode } = params;

  const group = await db.groupPurchase.findUnique({
    where: { inviteCode },
    include: {
      tier: true,
      members: true,
    },
  });

  if (!group) return { ok: false, error: "Group not found" };
  if (group.status !== "ACTIVE") {
    return { ok: false, error: "This group is not open for joining yet" };
  }
  if (group.memberCount >= group.memberLimit) {
    return { ok: false, error: "This group is already full" };
  }

  const alreadyMember = group.members.some(
    (member: any) => member.userId === userId,
  );
  if (alreadyMember) return { ok: true, alreadyMember: true, completed: false };

  const alreadyEnrolled = await db.enrollment.findFirst({
    where: {
      userId,
      courseId: group.courseId,
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    select: { id: true },
  });
  if (alreadyEnrolled) {
    return { ok: false, error: "You are already enrolled in this course" };
  }

  let shouldComplete: boolean;
  try {
    ({ shouldComplete } = await db.$transaction(async (tx: any) => {
      await tx.groupMember.create({
        data: {
          groupPurchaseId: group.id,
          userId,
          role: "MEMBER",
        },
      });

      const nextMemberCount = group.memberCount + 1;
      const nextCashbackEarned = computeGroupCashbackEarned({
        cashbackTotal: group.cashbackTotal,
        cashbackPerMember: group.cashbackPerMember,
        memberCount: nextMemberCount,
      });

      const shouldComplete = nextMemberCount >= group.memberLimit;

      // Conditional on the state we read. This is the claim: see the note at
      // the top of the file.
      const advanced = await tx.groupPurchase.updateMany({
        where: {
          id: group.id,
          status: "ACTIVE",
          memberCount: group.memberCount,
        },
        data: {
          memberCount: nextMemberCount,
          cashbackEarned: nextCashbackEarned,
          status: shouldComplete ? "COMPLETED" : group.status,
          completedAt: shouldComplete ? new Date() : null,
          cashbackReleased: shouldComplete ? true : group.cashbackReleased,
        },
      });
      // Throwing rolls back the membership row inserted above.
      if (advanced.count === 0) throw new GroupChangedError();

      if (shouldComplete && group.cashbackTotal > 0) {
        // Cashback is funded by the tutor, so the credit and the debit are two
        // halves of one movement. Resolve the funder FIRST: if we cannot, the
        // credit must not happen either. Previously the credit ran
        // unconditionally and the debit was skipped when the tutor could not be
        // resolved, which created money out of nothing.
        const course = await tx.course.findUnique({
          where: { id: group.courseId },
          select: { tutor: { select: { userId: true } } },
        });
        const funderId = course?.tutor?.userId;

        if (!funderId) {
          throw new GroupCompletionError(
            `Group ${group.id}: cannot release cashback, course ${group.courseId} has no tutor to fund it`,
          );
        }

        // The tutor must actually have the money. Without this the debit can
        // drive a wallet negative, letting the platform pay out cashback the
        // tutor never earned.
        const funder = await tx.user.findUnique({
          where: { id: funderId },
          select: { walletBalance: true },
        });
        if (!funder || funder.walletBalance < group.cashbackTotal) {
          throw new GroupCompletionError(
            `Group ${group.id}: tutor ${funderId} has ${funder?.walletBalance ?? 0} but cashback needs ${group.cashbackTotal}`,
          );
        }

        await debitWallet(tx, {
          userId: funderId,
          amount: group.cashbackTotal,
          type: "GROUP_CASHBACK_DEBIT",
          groupPurchaseId: group.id,
          description: "Funded group cashback",
        });

        await creditWallet(tx, {
          userId: group.creatorId,
          amount: group.cashbackTotal,
          type: "GROUP_CASHBACK_CREDIT",
          groupPurchaseId: group.id,
          description: "Group purchase cashback",
        });
      }

      return { shouldComplete };
    }));
  } catch (error) {
    if (error instanceof GroupChangedError) {
      return {
        ok: false,
        error: "This group just changed. Please try joining again.",
      };
    }
    if (error instanceof GroupCompletionError) {
      // Rolled back, so this member is not in the group. Logged for whoever
      // has to explain to the tutor why the group could not fill.
      console.error("[group-purchase] cannot complete group:", error.message);
      return {
        ok: false,
        error:
          "This group can't be completed right now. Please try again shortly or contact support.",
      };
    }
    throw error;
  }

  if (shouldComplete) {
    const members = await db.groupMember.findMany({
      where: { groupPurchaseId: group.id },
      select: { userId: true },
    });
    const memberIds = members.map((m: any) => m.userId);

    const users = await db.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, role: true },
    });
    const userIdsToUpgrade = users
      .filter((user: any) => user.role === "USER")
      .map((user: any) => user.id);

    // Three statements in one transaction, with the settlement transaction's
    // timeout. This used to be one upsert per member plus one per role upgrade,
    // sent as a batch under Prisma's 5-second default. Each statement is a
    // round trip, and from a serverless region far from the database a larger
    // group ran out of time AFTER the group had been marked complete and the
    // cashback had moved — leaving members who had joined with no enrolment.
    // createMany with skipDuplicates is the same create-if-missing an upsert
    // with an empty update gave, in a single statement; finalizePaystack
    // already does exactly this for the same reason.
    await db.$transaction(
      async (tx: any) => {
        await tx.enrollment.createMany({
          data: memberIds.map((memberId: string) => ({
            userId: memberId,
            courseId: group.courseId,
            status: "ACTIVE",
            groupPurchaseId: group.id,
            enrolledAt: new Date(),
          })),
          skipDuplicates: true,
        });

        if (userIdsToUpgrade.length > 0) {
          await tx.user.updateMany({
            where: { id: { in: userIdsToUpgrade } },
            data: { role: "STUDENT" },
          });
          await tx.student.createMany({
            data: userIdsToUpgrade.map((upgradeId: string) => ({
              userId: upgradeId,
              interests: [],
              goals: [],
            })),
            skipDuplicates: true,
          });
        }
      },
      { timeout: 30_000, maxWait: 15_000 },
    );

    // Only the join that won the conditional update above gets here, so the
    // tutor hears about the deduction exactly once.
    await notifyTutorOfGroupCompletion(group.id);
  }

  return { ok: true, alreadyMember: false, completed: shouldComplete };
}
