"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { joinGroupPurchase } from "@/actions/group-purchase";
import { formatToNaira, generateRandomAvatar } from "@/lib/utils";
import { toast } from "sonner";

type GroupMember = {
  user: { name: string; avatar: string | null };
};

type GroupTier = {
  size: number;
  groupPrice: number;
  cashbackPercent: number;
};

type GroupPurchase = {
  id: string;
  inviteCode: string;
  memberCount: number;
  memberLimit: number;
  status: string;
  course: { id: string; title: string; thumbnail: string | null };
  tier: GroupTier;
  members: GroupMember[];
};

export default function GroupJoinClient({
  inviteCode,
  group,
}: {
  inviteCode: string;
  group: GroupPurchase | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [joined, setJoined] = useState(false);

  const progress = group
    ? Math.min(100, (group.memberCount / group.memberLimit) * 100)
    : 0;

  const handleJoin = () => {
    startTransition(async () => {
      const result = await joinGroupPurchase(inviteCode);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setJoined(true);
      toast.success("You joined the group!");
    });
  };

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-card border-white/10 max-w-lg w-full">
          <CardContent className="p-8 text-center text-gray-300">
            This group link is invalid or expired.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-6 max-w-3xl">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <h1 className="text-2xl font-semibold text-white">
                Join Group Learning
              </h1>
              <p className="text-gray-400">
                {group.course.title} — group size {group.memberLimit}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-400">Group price</p>
                  <p className="text-white font-semibold">
                    {formatToNaira(group.tier.groupPrice)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-400">Cashback</p>
                  <p className="text-white font-semibold">
                    {Math.round(group.tier.cashbackPercent * 100)}%
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">
                    {group.memberCount} / {group.memberLimit} members
                  </span>
                  <span className="text-yellow-300">{group.status}</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-semibold">Members</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {group.members.map((member, index) => (
                    <div
                      key={`${member.user.name}-${index}`}
                      className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={member.user.avatar || generateRandomAvatar()}
                          alt={member.user.name}
                        />
                        <AvatarFallback className="text-xs">
                          {member.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-gray-200 text-sm">
                        {member.user.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleJoin}
                disabled={isPending || joined || group.status !== "ACTIVE"}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold">
                {joined ? "Joined" : "Join Group"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
