import "server-only";

import { db } from "@/lib/db";
import {
  computeEarningAvailableAt,
  computeGroupCashbackEarned,
} from "@/lib/payments/revenue";
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
          // Deliberately NOT released here. See the note below.
          cashbackReleased: group.cashbackReleased,
          // Dated on completion, paid by the release sweep once the refund
          // window on the group's own sales has closed.
          cashbackAvailableAt:
            shouldComplete && group.cashbackTotal > 0
              ? computeEarningAvailableAt(new Date())
              : group.cashbackAvailableAt,
        },
      });
      // Throwing rolls back the membership row inserted above.
      if (advanced.count === 0) throw new GroupChangedError();

      // NO WALLET MOVEMENT AT COMPLETION.
      //
      // The cashback is funded by the tutor out of their share of this group's
      // own sales, and that share is now held until its refund window closes.
      // Paying the creator the moment the group filled therefore asked the
      // tutor for money they did not have yet: the debit found an empty wallet
      // and refused, which failed the whole join and left a full group stuck
      // at ACTIVE.
      //
      // So the obligation is recorded with a date instead and settled by
      // `releaseDueGroupCashback`, on the same timetable as the earnings that
      // fund it. Nobody, tutor or student, is paid inside the window in which
      // the sale can still be reversed.
      //
      // Completion can no longer fail for funding reasons, which is the point:
      // whether a student gets access must not depend on their tutor's wallet.

      return { shouldComplete };
    }));
  } catch (error) {
    if (error instanceof GroupChangedError) {
      return {
        ok: false,
        error: "This group just changed. Please try joining again.",
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
