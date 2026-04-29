import { getGroupPurchaseByInvite } from "@/actions/group-purchase";
import GroupJoinClient from "@/components/pages/group/group-join-client";

export default async function GroupJoinPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const { group } = await getGroupPurchaseByInvite(inviteCode);

  return <GroupJoinClient inviteCode={inviteCode} group={group} />;
}
