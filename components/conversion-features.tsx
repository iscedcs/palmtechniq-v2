"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Zap, X, MessageCircle, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateRandomAvatar } from "@/lib/utils";
import { isYoutubeUrl, toYoutubeEmbedUrl } from "@/lib/youtube";

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
  const [isOpen, setIsOpen] = useState(false);

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
            className="fixed bottom-24 right-6 w-80 h-96 z-50">
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
                    Get instant help choosing the right course
                  </p>
                </div>
                <div className="flex-1 p-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-300 text-sm">
                      Chat with our course advisors
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Average response time: 2 minutes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
