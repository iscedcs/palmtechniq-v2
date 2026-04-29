"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Users, Gift, Share2, Copy, Crown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { formatToNaira, generateRandomAvatar } from "@/lib/utils";
import { toast } from "sonner";

type GroupTier = {
  id: string;
  size: number;
  groupPrice: number;
  cashbackPercent: number;
  isActive: boolean;
};

type GroupMember = {
  user: { name: string; avatar: string | null };
  role: "CREATOR" | "MEMBER";
};

type ActiveGroup = {
  id: string;
  inviteCode: string;
  memberCount: number;
  memberLimit: number;
  cashbackTotal: number;
  cashbackEarned: number;
  status: string;
  tier: GroupTier;
  members: GroupMember[];
};

export function GroupBuyingWidget({
  courseId,
  courseTitle,
  tiers,
  activeGroup,
}: {
  courseId: string;
  courseTitle: string;
  tiers: GroupTier[];
  activeGroup?: ActiveGroup | null;
}) {
  const inviteUrl = useMemo(() => {
    if (!activeGroup?.inviteCode) return "";
    if (typeof window === "undefined") return `/group/${activeGroup.inviteCode}`;
    return `${window.location.origin}/group/${activeGroup.inviteCode}`;
  }, [activeGroup?.inviteCode]);

  const progress = activeGroup
    ? Math.min(100, (activeGroup.memberCount / activeGroup.memberLimit) * 100)
    : 0;

  const activeTiers = tiers.filter((tier) => tier.isActive);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied");
  };

  const handleShare = async () => {
    if (!inviteUrl) return;
    if (navigator.share) {
      await navigator.share({
        title: `Join my group for ${courseTitle}`,
        text: "Join my group to unlock this course together.",
        url: inviteUrl,
      });
      return;
    }
    await handleCopy();
  };

  return (
    <Card className="glass-card border-white/10 bg-white/5 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Group Learning</h3>
              <p className="text-gray-400 text-sm">
                Start a group and unlock lifetime access together.
              </p>
              <Badge className="bg-white/10 text-gray-300 border-white/10 w-fit">
                {courseTitle}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {activeGroup ? (
          <>
            {activeGroup.status === "PENDING_PAYMENT" ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-gray-300">
                Your payment is pending. Complete payment to activate the group.
              </div>
            ) : null}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold">
                  {activeGroup.memberCount} / {activeGroup.memberLimit} members
                </span>
                <span className="text-neon-blue font-bold">
                  {Math.round(activeGroup.tier.cashbackPercent * 100)}% cashback
                </span>
              </div>
              <Progress value={progress} className="h-3 mb-2" />
              <p className="text-gray-400 text-sm">
                {activeGroup.memberLimit - activeGroup.memberCount > 0
                  ? `${activeGroup.memberLimit - activeGroup.memberCount} more member(s) needed to unlock access`
                  : "Group completed. Access is unlocked!"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-gray-400">Group price</p>
                <p className="text-white font-semibold">
                  {formatToNaira(activeGroup.tier.groupPrice)}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-gray-400">Cashback earned</p>
                <p className="text-white font-semibold">
                  {formatToNaira(activeGroup.cashbackEarned)} /{" "}
                  {formatToNaira(activeGroup.cashbackTotal)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Group Members</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {activeGroup.members.map((member, index) => (
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
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">
                        {member.user.name}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {member.role === "CREATOR" ? "Group creator" : "Member"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-semibold">Invite Friends</h4>
              <div className="flex items-center space-x-2">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="bg-white/10 border-white/20 text-sm text-white"
                />
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className="bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:opacity-90">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  onClick={handleShare}
                  className="bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:opacity-90">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className="bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:opacity-90">
                  <Gift className="w-4 h-4 mr-2" />
                  Copy link
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <h4 className="text-white font-semibold">Group Tiers</h4>
              {activeTiers.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No group tiers available yet.
                </p>
              ) : (
                activeTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                    <div className="flex items-center space-x-3">
                      <Crown className="w-4 h-4 text-neon-blue" />
                      <div>
                        <p className="text-white text-sm font-medium">
                          {tier.size} members
                        </p>
                        <p className="text-gray-400 text-xs">
                          Cashback {Math.round(tier.cashbackPercent * 100)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">
                        {formatToNaira(tier.groupPrice)}
                      </div>
                      <div className="text-gray-400 text-xs">
                        Creator pays
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {activeTiers.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTiers.map((tier) => (
                  <Button
                    key={tier.id}
                    asChild
                    className="bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold">
                    <Link
                      href={`/courses/${courseId}/checkout?groupTierId=${tier.id}`}>
                      Start group ({tier.size})
                    </Link>
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
