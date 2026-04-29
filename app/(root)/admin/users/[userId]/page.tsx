import { getAdminUserProfile } from "@/actions/admin-dashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const getRoleColor = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "border-red-500 text-red-400 bg-red-500/10";
    case "TUTOR":
      return "border-purple-500 text-purple-400 bg-purple-500/10";
    case "STUDENT":
      return "border-blue-500 text-blue-400 bg-blue-500/10";
    default:
      return "border-gray-500 text-gray-400 bg-gray-500/10";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "border-green-500 text-green-400 bg-green-500/10";
    case "suspended":
      return "border-red-500 text-red-400 bg-red-500/10";
    default:
      return "border-gray-500 text-gray-400 bg-gray-500/10";
  }
};

export default async function AdminUserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const res = await getAdminUserProfile(userId);

  if ("error" in res) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 pt-24">
        <div className="container mx-auto px-6 py-8 text-gray-300">
          {res.error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 pt-24">
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">User Profile</h1>
          <p className="text-gray-400">Admin view of user details.</p>
        </div>

        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Account Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="w-16 h-16">
              <AvatarImage src={res.user.avatar ?? undefined} alt={res.user.name} />
              <AvatarFallback className="bg-gradient-to-r from-neon-blue to-neon-purple text-white text-xl">
                {res.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="text-xl font-semibold text-white">
                {res.user.name}
              </div>
              <div className="text-sm text-gray-400">{res.user.email}</div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={getRoleColor(res.user.role)}>
                  {res.user.role}
                </Badge>
                <Badge className={getStatusColor(res.user.status)}>
                  {res.user.status}
                </Badge>
                <span className="text-xs text-gray-400">
                  Joined {res.user.joinDate}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-300 text-sm">
              <div>Courses created: {res.counts.courses}</div>
              <div>Enrollments: {res.counts.enrollments}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Payout Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-300 text-sm">
              <div>Bank: {res.user.bankName ?? "Not set"}</div>
              <div>Account: {res.user.accountNumber ?? "Not set"}</div>
              <div>Recipient Code: {res.user.recipientCode ?? "Not set"}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
