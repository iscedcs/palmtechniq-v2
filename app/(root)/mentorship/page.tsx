"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  beginMentorshipCheckout,
  getMentorshipMarketplaceData,
} from "@/actions/mentorship-revenue";
import { Calendar, Search, Sparkles } from "lucide-react";

type Mentor = {
  tutorUserId: string;
  name: string;
  avatar: string;
  title: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  location: string;
  timezone: string;
  bio: string;
  specialties: string[];
  sessions: number;
};

const packageOptions = [
  { label: "One-off session", value: "NONE" },
  { label: "Starter pack (3 sessions, 10% off)", value: "STARTER_3" },
  { label: "Growth pack (5 sessions, 18% off)", value: "GROWTH_5" },
] as const;

export default function MentorshipPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [topic, setTopic] = useState("Career coaching session");
  const [notes, setNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [duration, setDuration] = useState("60");
  const [packageCode, setPackageCode] = useState<"NONE" | "STARTER_3" | "GROWTH_5">("NONE");
  const [bookingMode, setBookingMode] = useState<"INSTANT" | "REQUEST">("INSTANT");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const result = await getMentorshipMarketplaceData();
      if (!mounted) return;
      setMentors(result.mentors as Mentor[]);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredMentors = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return mentors;
    return mentors.filter((mentor) =>
      [mentor.name, mentor.title, mentor.bio, ...mentor.specialties].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    );
  }, [mentors, query]);

  const handleCheckout = async (mentor: Mentor) => {
    if (!scheduledDate) {
      toast.error("Select your preferred date/time first.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await beginMentorshipCheckout({
        tutorUserId: mentor.tutorUserId,
        topic,
        description: notes,
        scheduledAtIso: scheduledDate,
        durationMinutes: Number.parseInt(duration, 10) || 60,
        bookingMode,
        packageCode,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      if (result.mode === "REQUEST") {
        toast.success("Request submitted. Mentor review is pending.");
        return;
      }

      if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="pt-32 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-15" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="text-white">Live</span>{" "}
              <span className="text-gradient">Mentorship</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Book one-off sessions or discounted mentorship packages with
              verified mentors.
            </p>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white"
                placeholder="Search mentor by skill, title, or name"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-6">
          <Tabs defaultValue="mentors" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20">
              <TabsTrigger value="mentors">Available Mentors</TabsTrigger>
              <TabsTrigger value="pricing">Pricing Model</TabsTrigger>
            </TabsList>

            <TabsContent value="mentors" className="space-y-6">
              {loading ? (
                <p className="text-gray-300">Loading mentors...</p>
              ) : filteredMentors.length === 0 ? (
                <p className="text-gray-300">No mentors found for this search.</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredMentors.map((mentor) => (
                    <Card key={mentor.tutorUserId} className="glass-card border-white/10">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <Avatar className="w-14 h-14">
                            <AvatarImage src={mentor.avatar} />
                            <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white">{mentor.name}</h3>
                            <p className="text-gray-300 text-sm">{mentor.title}</p>
                            <p className="text-gray-400 text-xs">
                              {mentor.location} · {mentor.timezone}
                            </p>
                          </div>
                          <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">
                            ₦{mentor.hourlyRate}/hr
                          </Badge>
                        </div>

                        <p className="text-gray-300 text-sm mb-4">{mentor.bio}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {mentor.specialties.slice(0, 4).map((skill) => (
                            <Badge key={skill} className="bg-white/10 border-white/20 text-gray-200">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                              <Calendar className="w-4 h-4 mr-2" />
                              Book Mentorship
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-xl bg-gray-900 border-white/20 text-white">
                            <DialogHeader>
                              <DialogTitle>Book with {mentor.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Topic</Label>
                                <Input
                                  value={topic}
                                  onChange={(e) => setTopic(e.target.value)}
                                  className="mt-1 bg-white/10 border-white/20 text-white"
                                />
                              </div>
                              <div>
                                <Label>Preferred date and time</Label>
                                <Input
                                  type="datetime-local"
                                  value={scheduledDate}
                                  onChange={(e) => setScheduledDate(e.target.value)}
                                  className="mt-1 bg-white/10 border-white/20 text-white"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Duration (minutes)</Label>
                                  <Input
                                    type="number"
                                    min={30}
                                    max={180}
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="mt-1 bg-white/10 border-white/20 text-white"
                                  />
                                </div>
                                <div>
                                  <Label>Package</Label>
                                  <select
                                    value={packageCode}
                                    onChange={(e) =>
                                      setPackageCode(
                                        e.target.value as "NONE" | "STARTER_3" | "GROWTH_5"
                                      )
                                    }
                                    className="mt-1 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white"
                                  >
                                    {packageOptions.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <Label>Booking mode</Label>
                                <select
                                  value={bookingMode}
                                  onChange={(e) => setBookingMode(e.target.value as "INSTANT" | "REQUEST")}
                                  className="mt-1 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white"
                                >
                                  <option value="INSTANT">Instant pay-and-book</option>
                                  <option value="REQUEST">Request first (mentor confirms)</option>
                                </select>
                              </div>
                              <div>
                                <Label>Notes</Label>
                                <Input
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  className="mt-1 bg-white/10 border-white/20 text-white"
                                  placeholder="What do you want to focus on?"
                                />
                              </div>
                              <Button
                                disabled={isSubmitting}
                                onClick={() => handleCheckout(mentor)}
                                className="w-full bg-gradient-to-r from-neon-green to-emerald-400 text-white"
                              >
                                {isSubmitting ? "Processing..." : "Continue"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pricing">
              <Card className="glass-card border-white/10">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-neon-blue">
                    <Sparkles className="w-4 h-4" />
                    <p className="font-medium">Revenue-focused mentorship options</p>
                  </div>
                  <p className="text-gray-300">
                    One-off sessions are ideal for urgent coaching. Package
                    plans reduce per-session cost and improve continuity.
                  </p>
                  <ul className="list-disc pl-6 text-gray-300 space-y-2">
                    <li>Starter pack: 3 sessions with 10% discount</li>
                    <li>Growth pack: 5 sessions with 18% discount</li>
                    <li>Hybrid flow: pay instantly or request-first booking</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
