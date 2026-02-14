"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Zap, X, MessageCircle, Play, Loader2, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateRandomAvatar } from "@/lib/utils";
import { isYoutubeUrl, toYoutubeEmbedUrl } from "@/lib/youtube";
import Link from "next/link";

// Live Activity Ticker
export function LiveActivityTicker() {
  const [activities, setActivities] = useState([
    {
      name: "Sarah M.",
      action: "enrolled in React Masterclass",
      time: "2 min ago",
      location: "San Francisco",
    },
    {
      name: "Mike K.",
      action: "completed Python Bootcamp",
      time: "5 min ago",
      location: "New York",
    },
    {
      name: "Lisa R.",
      action: "started AI Interview Prep",
      time: "8 min ago",
      location: "London",
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activities.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-50 max-w-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.5 }}>
          <Card className="glass-card border-neon-green/30 bg-neon-green/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    <span className="text-neon-green">
                      {activities[currentIndex].name}
                    </span>{" "}
                    {activities[currentIndex].action}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {activities[currentIndex].time} •{" "}
                    {activities[currentIndex].location}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// Countdown Timer for Flash Sales
export function FlashSaleTimer({ endTime }: { endTime: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          hours: Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div className="flex items-center space-x-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg px-3 py-2">
      <Zap className="w-4 h-4 text-red-400" />
      <span className="text-red-400 text-sm font-semibold">
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}

// Course Preview Modal
export function CoursePreviewModal({
  isOpen,
  onClose,
  courseTitle,
  previewUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  previewUrl?: string;
}) {
  if (!isOpen) return null;
  const isYoutube = previewUrl ? isYoutubeUrl(previewUrl) : false;
  const previewSrc = previewUrl ? toYoutubeEmbedUrl(previewUrl) : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-gray-900 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">
            Preview: {courseTitle}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="aspect-video bg-black">
          {previewUrl ? (
            isYoutube ? (
              <iframe
                src={`${previewSrc}?autoplay=1`}
                title={`Preview: ${courseTitle}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <video
                src={previewUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Play className="w-16 h-16 text-neon-blue mx-auto mb-4" />
              <p className="text-gray-300">No preview available</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Trust Signals Component
export function TrustSignals() {
  const companies = [
    "Google",
    "Apple",
    "Netflix",
    "Microsoft",
    "Amazon",
    "Meta",
  ];

  return (
    <div className="text-center py-8">
      <p className="text-gray-400 text-sm mb-4">
        Trusted by professionals from
      </p>
      <div className="flex flex-wrap justify-center items-center gap-6 opacity-60">
        {companies.map((company) => (
          <div key={company} className="text-white font-semibold text-lg">
            {company}
          </div>
        ))}
      </div>
    </div>
  );
}

// Success Story Popup
export function SuccessStoryPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10000); // Show after 10 seconds
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: 100 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className="fixed bottom-6 right-6 z-50 max-w-sm">
      <Card className="glass-card border-neon-blue/30 bg-neon-blue/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">
              Success Story
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={() => setIsVisible(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={generateRandomAvatar()} />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold text-sm">John Doe</p>
              <p className="text-gray-400 text-xs">
                Software Engineer at Google
              </p>
            </div>
          </div>
          <p className="text-gray-300 text-sm mb-3">
            "Got promoted to Senior Engineer after completing the React
            Masterclass. 40% salary increase!"
          </p>
          <div className="flex items-center text-yellow-400 text-sm">
            <Star className="w-4 h-4 fill-current mr-1" />
            <span>5.0 rating</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Live Chat Widget
export function LiveChatWidget() {
  const createBrowserSessionToken = () =>
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
      .replace(/[^a-zA-Z0-9_-]/g, "");

  const [isOpen, setIsOpen] = useState(false);
  const [advisorSessionToken, setAdvisorSessionToken] = useState("");
  const [latestAdvisorTurnId, setLatestAdvisorTurnId] = useState<string | null>(
    null
  );
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadNote, setLeadNote] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  type RecommendedCourse = {
    id: string;
    reason: string;
    title: string;
    level: string;
    price: number;
    categoryName: string;
  };

  type RecommendedCategory = {
    id: string;
    name: string;
    reason: string;
  };

  type ChatMessage = {
    id: string;
    role: "assistant" | "user";
    content: string;
    recommendedCourses?: RecommendedCourse[];
    recommendedCategories?: RecommendedCategory[];
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I am your PalmTechnIQ course advisor. Tell me your goal, current level, and time availability, and I will recommend the best-fit courses.",
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    const existingToken =
      typeof window !== "undefined"
        ? window.localStorage.getItem("advisor-session-token")
        : null;
    if (existingToken) {
      setAdvisorSessionToken(existingToken);
      return;
    }
    const freshToken = createBrowserSessionToken();
    setAdvisorSessionToken(freshToken);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("advisor-session-token", freshToken);
    }
  }, []);

  const starterPrompts = [
    "I am a beginner in web development. What should I take first?",
    "I want to switch to data/AI roles in 3 months.",
    "Recommend budget-friendly courses for intermediate learners.",
  ];

  async function sendMessage(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || isSending) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: message,
    };
    setMessages((prev) => [...prev, userMessage]);
    setMessageInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          sessionToken: advisorSessionToken || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Unable to get advisor response right now.");
      }

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content:
          typeof data.answer === "string" && data.answer
            ? data.answer
            : "I can help you compare courses. Tell me your goal and current level.",
        recommendedCourses: Array.isArray(data.recommendedCourses)
          ? data.recommendedCourses
          : [],
        recommendedCategories: Array.isArray(data.recommendedCategories)
          ? data.recommendedCategories
          : [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (typeof data.sessionToken === "string" && data.sessionToken) {
        setAdvisorSessionToken(data.sessionToken);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("advisor-session-token", data.sessionToken);
        }
      }
      if (typeof data.advisorTurnId === "string" && data.advisorTurnId) {
        setLatestAdvisorTurnId(data.advisorTurnId);
      }
      if (data.shouldOfferHumanFollowUp) {
        setShowLeadCapture(true);
      }
    } catch (error) {
      console.error("Course advisor request failed:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-fallback-${Date.now()}`,
          role: "assistant",
          content:
            "I could not respond right now. Please try again in a moment, or request a human advisor and we will contact you.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function submitLead() {
    if (!leadName.trim() || !leadEmail.trim() || isSubmittingLead) return;

    setIsSubmittingLead(true);
    try {
      const res = await fetch("/api/advisor/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName.trim(),
          email: leadEmail.trim(),
          note: leadNote.trim(),
          sessionToken: advisorSessionToken || createBrowserSessionToken(),
          advisorTurnId: latestAdvisorTurnId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit follow-up request.");
      }

      setLeadSubmitted(true);
      setShowLeadCapture(false);
      setLeadName("");
      setLeadEmail("");
      setLeadNote("");
    } catch (error) {
      console.error("Course advisor lead submission failed:", error);
    } finally {
      setIsSubmittingLead(false);
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center shadow-2xl hover-glow z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}>
        <MessageCircle className="w-6 h-6 text-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 w-[22rem] max-w-[calc(100vw-3rem)] h-[32rem] z-50">
            <Card className="glass-card border-white/10 h-full">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Course Advisor</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Personalized guidance using PalmTechnIQ course catalog
                  </p>
                </div>

                <div className="flex-1 min-h-0 p-3 overflow-y-auto space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className="space-y-2">
                      <div
                        className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                          message.role === "user"
                            ? "ml-auto bg-neon-blue/20 border border-neon-blue/40 text-white"
                            : "bg-white/5 border border-white/10 text-gray-100"
                        }`}>
                        {message.content}
                      </div>

                      {message.role === "assistant" &&
                        Array.isArray(message.recommendedCourses) &&
                        message.recommendedCourses.length > 0 && (
                          <div className="space-y-2">
                            {message.recommendedCourses.map((course) => (
                              <Link
                                key={course.id}
                                href={`/courses/${course.id}`}
                                className="block rounded-lg border border-white/15 bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors">
                                <p className="text-white text-sm font-medium">
                                  {course.title}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {course.level} • {course.categoryName} • ₦
                                  {Math.round(course.price).toLocaleString()}
                                </p>
                                <p className="text-gray-300 text-xs mt-1">
                                  {course.reason}
                                </p>
                              </Link>
                            ))}
                          </div>
                        )}

                      {message.role === "assistant" &&
                        Array.isArray(message.recommendedCategories) &&
                        message.recommendedCategories.length > 0 && (
                          <div className="space-y-2">
                            {message.recommendedCategories.map((category) => (
                              <div
                                key={category.id}
                                className="rounded-lg border border-neon-purple/40 bg-neon-purple/10 px-3 py-2">
                                <p className="text-xs text-gray-100 font-medium">
                                  {category.name}
                                </p>
                                <p className="text-[11px] text-gray-300 mt-1">
                                  {category.reason}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}

                  {isSending && (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-300">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Thinking...
                    </div>
                  )}

                  {showLeadCapture && !leadSubmitted && (
                    <div className="rounded-xl border border-white/15 bg-white/5 p-3 space-y-2">
                      <p className="text-sm text-white font-medium">
                        Need a human advisor?
                      </p>
                      <input
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        placeholder="Your name"
                        className="w-full rounded-md bg-black/20 border border-white/15 px-3 py-2 text-sm text-white outline-none focus:border-neon-blue/50"
                      />
                      <input
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        placeholder="Your email"
                        type="email"
                        className="w-full rounded-md bg-black/20 border border-white/15 px-3 py-2 text-sm text-white outline-none focus:border-neon-blue/50"
                      />
                      <textarea
                        value={leadNote}
                        onChange={(e) => setLeadNote(e.target.value)}
                        placeholder="Optional note about your goals"
                        rows={2}
                        className="w-full rounded-md bg-black/20 border border-white/15 px-3 py-2 text-sm text-white outline-none focus:border-neon-blue/50 resize-none"
                      />
                      <Button
                        onClick={submitLead}
                        disabled={isSubmittingLead}
                        className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                        {isSubmittingLead ? "Submitting..." : "Request Follow-up"}
                      </Button>
                    </div>
                  )}

                  {leadSubmitted && (
                    <p className="text-xs text-green-300 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                      Thanks, our team will reach out shortly.
                    </p>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-white/10 space-y-2">
                  <div className="flex gap-2">
                    {starterPrompts.slice(0, 2).map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        disabled={isSending}
                        className="text-[11px] px-2 py-1 rounded-full border border-white/20 text-gray-300 hover:bg-white/10 disabled:opacity-60">
                        {prompt.length > 34 ? `${prompt.slice(0, 34)}...` : prompt}
                      </button>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void sendMessage(messageInput);
                    }}
                    className="flex items-center gap-2">
                    <input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Ask about goals, level, or budget..."
                      maxLength={1200}
                      className="flex-1 rounded-lg bg-black/20 border border-white/15 px-3 py-2 text-sm text-white outline-none focus:border-neon-blue/50"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isSending || !messageInput.trim()}
                      className="bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>

                  {!showLeadCapture && !leadSubmitted && (
                    <button
                      onClick={() => setShowLeadCapture(true)}
                      className="text-xs text-neon-blue hover:text-neon-purple transition-colors">
                      Prefer a human advisor? Request follow-up
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
