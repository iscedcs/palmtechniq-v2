"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Video,
  Clock,
  User,
  MapPin,
  Copy,
  AlertCircle,
} from "lucide-react";
import {
  generateZoomSignature,
  extractMeetingNumberFromUrl,
  loadZoomSDK,
} from "@/lib/zoom-web-sdk";

interface SessionDetails {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledAt: Date;
  duration: number;
  price: number;
  meetingUrl: string | null;
  student: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    avatar: string | null;
  };
  tutor: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    avatar: string | null;
  };
  bookingMode: string;
  paymentStatus: string;
}

declare global {
  interface Window {
    ZoomSDK: any;
  }
}

export default function MentorshipSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionLive, setIsSessionLive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [zoomLoading, setZoomLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [userRole, setUserRole] = useState<"mentor" | "student" | null>(null);

  // Load Zoom SDK on mount
  useEffect(() => {
    const initZoomSDK = async () => {
      try {
        await loadZoomSDK();
        setSdkLoaded(true);
      } catch (err) {
        console.error("[Zoom SDK] Failed to load:", err);
        // Don't block the UI, user can still use fallback link
      }
    };

    initZoomSDK();
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch session details
        const response = await fetch(`/api/mentorship/session/${sessionId}`);
        if (!response.ok) {
          throw new Error("Failed to load session details");
        }

        const data = await response.json();
        setSession(data.session);
        setUserRole(data.userRole);

        // Check if session is live
        // Session is live if:
        // 1. Status is IN_PROGRESS (host has started the meeting), OR
        // 2. Current time is between scheduled time and end time
        const scheduledTime = new Date(data.session.scheduledAt);
        const endTime = new Date(
          scheduledTime.getTime() + data.session.duration * 60000,
        );
        const now = new Date();

        const isLiveByStatus = data.session.status === "IN_PROGRESS";
        const isLiveByTime = now >= scheduledTime && now <= endTime;
        
        setIsSessionLive(isLiveByStatus || isLiveByTime);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        toast.error("Failed to load session");
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      loadSession();
      
      // Poll for session status updates every 5 seconds
      // This allows students to see when the tutor starts the meeting
      const pollInterval = setInterval(loadSession, 5000);
      return () => clearInterval(pollInterval);
    }
  }, [sessionId]);

  const handleCopyMeetingUrl = () => {
    if (session?.meetingUrl) {
      navigator.clipboard.writeText(session.meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Meeting URL copied to clipboard");
    }
  };

  const handleJoinMeeting = async () => {
    if (!session?.meetingUrl || !sdkLoaded) {
      setError("Zoom SDK not ready. Please refresh the page.");
      return;
    }

    try {
      setZoomLoading(true);
      console.log("[Zoom Join] Preparing to join meeting...");

      const meetingNumber = extractMeetingNumberFromUrl(session.meetingUrl);
      console.log(`[Zoom Join] Meeting number: ${meetingNumber}`);

      // Host role for mentor, participant role for student
      const signature = generateZoomSignature(
        meetingNumber,
        userRole === "mentor" ? 1 : 0,
      );

      const userName =
        userRole === "mentor"
          ? `${session.tutor?.name || "Mentor"} (Host)`
          : `${session.student?.name || "Student"}`;

      const userEmail =
        userRole === "mentor"
          ? session.tutor?.email || ""
          : session.student?.email || "";

      console.log(
        `[Zoom Join] Joining as ${userRole}: ${userName} (${userEmail})`,
      );

      if (window.ZoomSDK) {
        window.ZoomSDK.init({
          leaveUrl: `/mentorship/session/${sessionId}`,
          isSupportAV: true,
          success: () => {
            console.log("[Zoom SDK] Initialized");
            window.ZoomSDK.join({
              meetingNumber: meetingNumber,
              userName: userName,
              signature: signature,
              userEmail: userEmail,
              onMeetingStatus(status: any) {
                console.log("[Zoom Event] Status:", status);
                if (status === "connected") {
                  setIsJoined(true);
                  console.log("[Zoom Event] Connected to meeting");
                } else if (status === "closed" || status === "disconnected") {
                  setIsJoined(false);
                  console.log("[Zoom Event] Disconnected from meeting");
                }
              },
              success: () => {
                console.log("[Zoom Join] Successfully joined");
                setIsJoined(true);
                toast.success("Joined meeting successfully");
              },
              error: (error: any) => {
                console.error("[Zoom Join] Error:", error);
                setError(`Failed to join meeting: ${error.message}`);
                toast.error("Failed to join meeting");
                setZoomLoading(false);
              },
            });
          },
          error: (error: any) => {
            console.error("[Zoom SDK] Init error:", error);
            setError("Failed to initialize Zoom. Using fallback link...");
            window.open(session.meetingUrl!, "_blank", "noopener,noreferrer");
            setZoomLoading(false);
          },
        });
      }
    } catch (err: any) {
      console.error("[Zoom Join] Error:", err);
      setError(`Error: ${err.message}`);
      // Fallback to external link
      if (session?.meetingUrl) {
        window.open(session.meetingUrl, "_blank", "noopener,noreferrer");
      }
      setZoomLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-6">
          <Card className="glass-card border-red-500/30 bg-red-900/10">
            <CardContent className="p-8 text-center">
              <p className="text-red-400 mb-4">
                {error || "Session not found"}
              </p>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const scheduledTime = new Date(session.scheduledAt);
  const timeUntilSession = scheduledTime.getTime() - new Date().getTime();
  const hoursUntil = Math.floor(timeUntilSession / (1000 * 60 * 60));
  const minutesUntil = Math.floor(
    (timeUntilSession % (1000 * 60 * 60)) / (1000 * 60),
  );

  const getStatusColor = (status: string) => {
    if (status === "SCHEDULED")
      return "bg-blue-900/20 text-blue-400 border-blue-500/30";
    if (status === "IN_PROGRESS")
      return "bg-green-900/20 text-green-400 border-green-500/30";
    if (status === "COMPLETED")
      return "bg-gray-900/20 text-gray-400 border-gray-500/30";
    if (status === "CANCELLED")
      return "bg-red-900/20 text-red-400 border-red-500/30";
    return "bg-white/10";
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-6 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Badge className={getStatusColor(session.status)}>
              {session.status === "IN_PROGRESS" && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>
                  Live Now
                </span>
              )}
              {session.status !== "IN_PROGRESS" && session.status}
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-2">
            {session.title}
          </h1>
          {session.description && (
            <p className="text-gray-300 text-lg">{session.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Session Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meeting Section */}
            {session.meetingUrl && session.status !== "COMPLETED" ? (
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-400" />
                    Zoom Meeting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <p className="text-sm text-gray-400 mb-2">Meeting Link</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={session.meetingUrl}
                        readOnly
                        className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm font-mono truncate"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyMeetingUrl}
                        className="border-white/20">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {isSessionLive ? (
                    <Button
                      onClick={handleJoinMeeting}
                      disabled={zoomLoading || !sdkLoaded}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold">
                      {zoomLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Join Meeting Now
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
                      <p className="text-blue-200 text-sm">
                        {hoursUntil > 0 || minutesUntil > 0 ? (
                          <>
                            Session starts in{" "}
                            {hoursUntil > 0 ? `${hoursUntil}h ` : ""}
                            {minutesUntil}m
                          </>
                        ) : (
                          "Session is upcoming"
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : session.status === "COMPLETED" ? (
              <Card className="glass-card border-green-500/30 bg-green-900/10">
                <CardContent className="p-6">
                  <p className="text-green-400 text-sm">
                    ✓ This session has been completed. Thank you for attending!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card border-yellow-500/30 bg-yellow-900/10">
                <CardContent className="p-6">
                  <p className="text-yellow-400 text-sm">
                    Meeting link is being prepared. The tutor will add the
                    meeting URL soon.
                    <br />
                    Please check back shortly.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Session Details */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-400">Scheduled</p>
                      <p className="text-white font-medium">
                        {scheduledTime.toLocaleDateString()} at{" "}
                        {scheduledTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Video className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-400">Duration</p>
                      <p className="text-white font-medium">
                        {session.duration} minutes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-400">Price</p>
                      <p className="text-white font-medium">
                        ₦{session.price.toLocaleString()}
                      </p>
                      <span className="text-xs text-gray-400">
                        Payment Status: {session.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Participants */}
          <div className="space-y-6">
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Student */}
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <img
                    src={
                      session.student.image ||
                      session.student.avatar ||
                      "/default-avatar.png"
                    }
                    alt={session.student.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400">Student</p>
                    <p className="font-medium text-white">
                      {session.student.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {session.student.email}
                    </p>
                  </div>
                </div>

                {/* Tutor */}
                <div className="flex items-center gap-3">
                  <img
                    src={
                      session.tutor.image ||
                      session.tutor.avatar ||
                      "/default-avatar.png"
                    }
                    alt={session.tutor.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400">Mentor</p>
                    <p className="font-medium text-white">
                      {session.tutor.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {session.tutor.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Info */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Booking Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-gray-400">Booking Mode</p>
                  <Badge className="mt-1">
                    {session.bookingMode === "INSTANT"
                      ? "Instant Booking"
                      : "Request Approved"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
