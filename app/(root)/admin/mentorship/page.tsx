import {
  getMentorshipAdminOverview,
  updateAdminMentorshipSessionStatus,
} from "@/actions/mentorship-revenue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminMentorshipPage() {
  const result = await getMentorshipAdminOverview();
  if ("error" in result) {
    return (
      <div className="min-h-screen bg-background pt-24 px-6">
        <p className="text-red-400">{result.error}</p>
      </div>
    );
  }

  async function updateSession(formData: FormData) {
    "use server";
    const sessionId = formData.get("sessionId")?.toString() || "";
    const status = formData.get("status")?.toString() as
      | "SCHEDULED"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "CANCELLED"
      | "NO_SHOW";
    const note = formData.get("note")?.toString() || "";
    await updateAdminMentorshipSessionStatus({
      mentorshipSessionId: sessionId,
      status,
      note,
    });
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-10">
      <div className="container mx-auto px-6 space-y-6">
        <h1 className="text-4xl font-bold text-gradient">
          Admin Mentorship Ops
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-white">
                {result.stats.totalSessions}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-white">
                {result.stats.pendingSessions}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-white">
                {result.stats.completedSessions}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">
                Mentorship Tx
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-white">
                {result.stats.mentorshipTransactions}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-white">
                ₦{result.stats.mentorshipRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {result.sessions.map((session) => (
            <Card key={session.id} className="glass-card border-white/10">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{session.title}</p>
                    <p className="text-gray-400 text-sm">
                      Student: {session.student.name} · Mentor:{" "}
                      {session.tutor.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {new Date(session.scheduledAt).toLocaleString()} · ₦
                      {session.price.toLocaleString()}
                    </p>
                  </div>
                  <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">
                    {session.status}
                  </Badge>
                </div>

                <form
                  action={updateSession}
                  className="grid gap-3 md:grid-cols-4">
                  <input type="hidden" name="sessionId" value={session.id} />
                  <select
                    name="status"
                    defaultValue={session.status}
                    className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white">
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="NO_SHOW">NO_SHOW</option>
                  </select>
                  <input
                    name="note"
                    placeholder="Admin note"
                    className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white md:col-span-2"
                  />
                  <Button type="submit">Update</Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
