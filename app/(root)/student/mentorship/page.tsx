"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  beginMentorshipCheckout,
  getMentorshipMarketplaceData,
  getStudentMentorshipSessions,
} from "@/actions/mentorship-revenue";

export const dynamic = "force-dynamic";

type SessionItem = {
  id: string;
  title: string;
  status: string;
  scheduledAt: Date;
  duration: number;
  price: number;
  notes: string | null;
  bookingMode: string;
  paymentStatus: string;
  tutor: {
    name: string;
    image: string | null;
    avatar: string | null;
    email: string;
  };
};

type Mentor = {
  tutorUserId: string;
  name: string;
  avatar: string;
  title: string;
  hourlyRate: number;
  bio: string;
  specialties: string[];
};

export default function StudentMentorshipPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingTopic, setBookingTopic] = useState("Mentorship Session");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingDuration, setBookingDuration] = useState("60");
  const [bookingMode, setBookingMode] = useState<"INSTANT" | "REQUEST">(
    "INSTANT",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [sessionRes, mentorRes] = await Promise.all([
        getStudentMentorshipSessions(),
        getMentorshipMarketplaceData(),
      ]);
      if (!mounted) return;
      if (!("error" in sessionRes)) {
        setSessions((sessionRes.sessions || []) as SessionItem[]);
      }
      setMentors((mentorRes.mentors || []) as Mentor[]);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const upcoming = useMemo(
    () =>
      sessions.filter(
        (s) =>
          s.status !== "PENDING_MENTOR_REVIEW" &&
          s.status !== "REJECTED" &&
          new Date(s.scheduledAt).getTime() >= Date.now()
      ),
    [sessions]
  );

  const pendingApprovals = useMemo(
    () => sessions.filter((s) => s.status === "PENDING_MENTOR_REVIEW"),
    [sessions]
  );

  const rejected = useMemo(
    () => sessions.filter((s) => s.status === "REJECTED"),
    [sessions]
  );

  const history = useMemo(
    () =>
      sessions.filter(
        (s) =>
          s.status !== "PENDING_MENTOR_REVIEW" &&
          s.status !== "REJECTED" &&
          new Date(s.scheduledAt).getTime() < Date.now()
      ),
    [sessions]
  );

  const handleBook = async (mentor: Mentor) => {
    if (!bookingDate) {
      toast.error("Select a date/time to continue.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await beginMentorshipCheckout({
        tutorUserId: mentor.tutorUserId,
        topic: bookingTopic,
        scheduledAtIso: bookingDate,
        durationMinutes: Number.parseInt(bookingDuration, 10) || 60,
        bookingMode,
        packageCode: "NONE",
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      if (result.mode === "REQUEST") {
        toast.success("Mentorship request submitted.");
        return;
      }
      if (result.authorizationUrl)
        window.location.href = result.authorizationUrl;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold text-gradient mb-2">
            Student Mentorship
          </h1>
          <p className="text-gray-300">
            Track sessions and book mentors in one place.
          </p>
        </motion.div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/10 border border-white/20">
            <TabsTrigger value="pending" className="relative">
              Awaiting Approval
              {pendingApprovals.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="history">History ({history.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
            <TabsTrigger value="book">Book Mentor</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="grid gap-4">
              {loading ? (
                <p className="text-gray-300">Loading sessions...</p>
              ) : pendingApprovals.length === 0 ? (
                <p className="text-gray-300">No pending mentor approvals.</p>
              ) : (
                pendingApprovals.map((s) => (
                  <Card key={s.id} className="glass-card border-white/10">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">{s.title}</p>
                          <p className="text-gray-400 text-sm">
                            {new Date(s.scheduledAt).toLocaleString()} ·{" "}
                            {s.duration} mins
                          </p>
                          <p className="text-gray-300 text-sm mt-1">
                            Mentor: {s.tutor.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">
                            {s.status}
                          </Badge>
                          <p className="text-white mt-2">
                            ₦{s.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="grid gap-4">
              {history.length === 0 ? (
                <p className="text-gray-300">No completed sessions yet.</p>
              ) : (
                history.map((s) => (
                  <Card key={s.id} className="glass-card border-white/10">
                    <CardContent className="p-5">
                      <p className="text-white font-semibold">{s.title}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(s.scheduledAt).toLocaleString()} ·{" "}
                        {s.duration} mins
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="rejected">
            <div className="grid gap-4">
              {rejected.length === 0 ? (
                <p className="text-gray-300">No rejected requests.</p>
              ) : (
                rejected.map((s) => (
                  <Card key={s.id} className="glass-card border-red-500/30 bg-red-900/10">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">{s.title}</p>
                          <p className="text-gray-400 text-sm">
                            {new Date(s.scheduledAt).toLocaleString()} ·{" "}
                            {s.duration} mins
                          </p>
                          <p className="text-red-400 text-sm mt-1">
                            Mentor declined this request
                          </p>
                        </div>
                        <Button
                          onClick={() => setBookingMode("REQUEST")}
                          variant="outline"
                          className="border-red-500/30"
                        >
                          Request Again
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="book">
            <Card className="glass-card border-white/10 mb-6">
              <CardHeader>
                <CardTitle className="text-white">
                  Quick Booking Inputs
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <Input
                  value={bookingTopic}
                  onChange={(e) => setBookingTopic(e.target.value)}
                />
                <Input
                  type="datetime-local"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
                <Input
                  type="number"
                  min={30}
                  max={180}
                  value={bookingDuration}
                  onChange={(e) => setBookingDuration(e.target.value)}
                />
                <select
                  value={bookingMode}
                  onChange={(e) =>
                    setBookingMode(e.target.value as "INSTANT" | "REQUEST")
                  }
                  className="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white">
                  <option value="INSTANT">Instant pay-and-book</option>
                  <option value="REQUEST">Request first</option>
                </select>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {mentors.map((mentor) => (
                <Card
                  key={mentor.tutorUserId}
                  className="glass-card border-white/10">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar>
                        <AvatarImage src={mentor.avatar} />
                        <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-semibold">
                          {mentor.name}
                        </p>
                        <p className="text-gray-400 text-sm">{mentor.title}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{mentor.bio}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-white">₦{mentor.hourlyRate}/hr</p>
                      <Button
                        disabled={isSubmitting}
                        onClick={() => handleBook(mentor)}>
                        {isSubmitting ? "Processing..." : "Book Session"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
