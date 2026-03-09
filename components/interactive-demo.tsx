"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  CheckCircle,
  Circle,
  ArrowRight,
  BookOpen,
  Clock,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { DemoCourseData } from "@/data/demo-course";
import Link from "next/link";

interface InteractiveDemoProps {
  data: DemoCourseData;
}

export function InteractiveDemo({ data }: InteractiveDemoProps) {
  const [isPlaying, setIsPlaying] = useState(false); // User must press play
  const [currentTime, setCurrentTime] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const currentLesson = data.lessons[currentLessonIndex];
  const demoDuration = currentLesson?.demoDuration || 60; // 60 seconds default

  // Calculate real progress based on lessons completed
  const totalLessonTime = data.lessons.length * 60; // Each lesson is 60 seconds
  const timeSpentOnLessons = currentLessonIndex * 60 + currentTime;
  const progress = Math.round((timeSpentOnLessons / totalLessonTime) * 100);

  // Timer effect - only increments time
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= demoDuration - 1) {
          // Stop at demoDuration, don't advance further
          return demoDuration;
        }
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, demoDuration]);

  // Lesson advancement effect - handles moving to next lesson when timer finishes
  useEffect(() => {
    if (!isPlaying || currentTime < demoDuration) return;

    // Timer reached end, advance to next lesson or show quiz
    if (currentLessonIndex < data.lessons.length - 1) {
      // Move to next lesson and reset time, but keep playing
      setCurrentLessonIndex((prevIndex) => prevIndex + 1);
      setCurrentTime(0);
    } else {
      // All lessons done, show quiz and stop
      setIsPlaying(false);
      setShowQuiz(true);
    }
  }, [currentTime, demoDuration, currentLessonIndex, data.lessons.length]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleQuizAnswer = (index: number) => {
    setSelectedAnswer(index);
    setTimeout(() => {
      setShowResult(true);
    }, 500);
  };

  const getEmbedUrl = (url: string): string => {
    // Extract video ID from various YouTube formats
    let videoId = "";

    if (url.includes("youtube.com/watch")) {
      // https://www.youtube.com/watch?v=dQw4w9WgXcQ
      const match = url.match(/v=([^&]+)/);
      videoId = match ? match[1] : "";
    } else if (url.includes("youtu.be/")) {
      // https://youtu.be/dQw4w9WgXcQ
      const match = url.match(/youtu\.be\/([^?]+)/);
      videoId = match ? match[1] : "";
    } else if (
      url.includes("youtube.com/embed") ||
      url.includes("youtube-nocookie.com/embed")
    ) {
      // Already in embed format
      return url.includes("?")
        ? `${url}&controls=0&modestbranding=1&fs=0&rel=0&disablekb=1&showinfo=0`
        : `${url}?controls=0&modestbranding=1&fs=0&rel=0&disablekb=1&showinfo=0`;
    } else if (url.match(/^[a-zA-Z0-9_-]{11}$/)) {
      // Just a video ID
      videoId = url;
    }

    // Return proper embed URL with controls disabled
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?controls=0&modestbranding=1&fs=0&rel=0&disablekb=1&showinfo=0`;
    }

    return url; // Fallback to original URL
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <section id="demo-section" className="py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-blue/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-white">Experience</span>{" "}
            <span className="text-gradient">Learning</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Take a peek inside our revolutionary learning platform. Try it
            yourself!
          </p>
        </motion.div>

        {/* Demo Interface */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Player */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="lg:col-span-2">
              <Card className="glass-card border-white/10 overflow-hidden">
                <CardContent className="p-0">
                  {/* Video Area */}
                  {currentLesson ? (
                    <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center overflow-hidden">
                      {currentLesson.videoUrl ? (
                        <>
                          {/* Render video iframe for embedded videos (YouTube, Vimeo, etc.) */}
                          {currentLesson.videoUrl.includes("youtube") ||
                          currentLesson.videoUrl.includes("youtu.be") ||
                          currentLesson.videoUrl.includes("vimeo") ? (
                            <>
                              {/* Wrapper with pointer-events-none prevents all YouTube UI interaction */}
                              <div className="absolute inset-0 pointer-events-none">
                                <iframe
                                  src={getEmbedUrl(currentLesson.videoUrl)}
                                  className="absolute inset-0 w-full h-full"
                                  allowFullScreen
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  title={currentLesson.title}
                                />
                              </div>
                            </>
                          ) : (
                            /* Render HTML5 video for direct video files */
                            <video
                              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                              controls={false}>
                              <source src={currentLesson.videoUrl} />
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </>
                      ) : (
                        /* Fallback when no video URL */
                        <>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20"
                            animate={{
                              opacity: isPlaying ? [0.2, 0.4, 0.2] : 0.2,
                            }}
                            transition={{
                              duration: 2,
                              repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
                            }}
                          />
                          <div className="relative z-10 text-center">
                            <BookOpen className="w-16 h-16 text-neon-blue/50 mx-auto mb-4" />
                            <p className="text-gray-300">Video not available</p>
                          </div>
                        </>
                      )}

                      {/* Play Button Overlay */}
                      {!isPlaying && (
                        <motion.button
                          onClick={handlePlayPause}
                          className="absolute z-20 w-20 h-20 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center hover-glow group"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}>
                          <Play className="w-8 h-8 text-white ml-1" />
                        </motion.button>
                      )}

                      {/* Pause Button Overlay (visible when playing) */}
                      {isPlaying && (
                        <motion.button
                          onClick={handlePlayPause}
                          className="absolute z-20 top-4 right-4 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}>
                          <Pause className="w-6 h-6 text-white" />
                        </motion.button>
                      )}

                      {/* Progress Bar */}
                      <div className="absolute bottom-4 left-4 right-4 z-20">
                        <Progress
                          value={(currentTime / demoDuration) * 100}
                          className="h-2 bg-white/20"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                      <p className="text-gray-400">Loading lesson...</p>
                    </div>
                  )}

                  {/* Video Controls */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {data.title}
                        </h3>
                        <p className="text-gray-400">by {data.instructor}</p>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {data.duration}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {data.studentCount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Lesson Info */}
                    {currentLesson && (
                      <div className="mb-4 p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-lg font-semibold text-white">
                              {currentLesson.title}
                            </h4>
                            <p className="text-sm text-gray-400 mt-1">
                              Demo Duration: {formatTime(currentTime)} /{" "}
                              {formatTime(demoDuration)}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-neon-blue/20 text-neon-blue">
                            Lesson {currentLessonIndex + 1} of{" "}
                            {data.lessons.length}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Course Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">
                          Course Progress
                        </span>
                        <span className="text-sm text-neon-blue font-semibold">
                          {progress}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Course Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}>
              <Card className="glass-card border-white/10 h-full">
                <CardContent className="p-6">
                  <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-neon-blue" />
                    Course Content
                  </h4>

                  <div className="space-y-3">
                    {data.lessons.map((lesson, index) => (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        onClick={() => {
                          setCurrentLessonIndex(index);
                          setCurrentTime(0);
                          setIsPlaying(false);
                        }}
                        className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                          index === currentLessonIndex
                            ? "border-neon-blue/50 bg-neon-blue/10"
                            : index < currentLessonIndex
                              ? "border-neon-green/30 bg-neon-green/5"
                              : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold mr-3 ${
                                index < currentLessonIndex
                                  ? "bg-neon-green text-white"
                                  : index === currentLessonIndex
                                    ? "bg-neon-blue text-white"
                                    : "bg-gray-600 text-white"
                              }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">
                                {lesson.title}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {lesson.duration} min
                              </p>
                            </div>
                          </div>
                          {index === currentLessonIndex && (
                            <Badge className="bg-neon-blue text-white">
                              Current
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quiz Section */}
          <AnimatePresence>
            {showQuiz && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.8 }}
                className="mt-8">
                <Card className="glass-card border-white/10 max-w-4xl mx-auto">
                  <CardContent className="p-8">
                    <h4 className="text-2xl font-bold text-white mb-6 text-center">
                      Quick Knowledge Check
                    </h4>
                    <p className="text-xl text-gray-300 mb-8 text-center">
                      {data.quiz.question}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {data.quiz.options.map((option, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleQuizAnswer(index)}
                          disabled={selectedAnswer !== null}
                          className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                            selectedAnswer === index
                              ? index === data.quiz.correct
                                ? "border-neon-green bg-neon-green/10 text-neon-green"
                                : "border-red-400 bg-red-400/10 text-red-400"
                              : selectedAnswer !== null &&
                                  index === data.quiz.correct
                                ? "border-neon-green bg-neon-green/10 text-neon-green"
                                : "border-white/20 bg-white/5 text-white hover:border-neon-blue/50 hover:bg-neon-blue/10"
                          }`}
                          whileHover={{
                            scale: selectedAnswer === null ? 1.02 : 1,
                          }}
                          whileTap={{
                            scale: selectedAnswer === null ? 0.98 : 1,
                          }}>
                          {option}
                        </motion.button>
                      ))}
                    </div>

                    {showResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center">
                        {selectedAnswer === data.quiz.correct ? (
                          <div className="text-neon-green">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-xl font-semibold">
                              Excellent! You got it right!
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                              You demonstrate a solid understanding of ethical
                              hacking principles.
                            </p>
                          </div>
                        ) : (
                          <div className="text-red-400">
                            <Circle className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-xl font-semibold">
                              Good try! The correct answer is highlighted above.
                            </p>
                          </div>
                        )}
                        <Button
                          asChild
                          className="mt-6 bg-gradient-to-r from-neon-blue to-neon-purple text-white hover-glow">
                          <Link href="/courses">
                            Enroll & Learn More
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
