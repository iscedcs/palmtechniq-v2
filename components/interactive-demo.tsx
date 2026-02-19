"use client";

import { useState } from "react";
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

const demoContent = {
  title: "React Hooks Mastery",
  instructor: "Pheobe Princess ",
  duration: "2h 30m",
  students: "12,450",
  lessons: [
    {
      id: 1,
      title: "Introduction to Hooks",
      duration: "8:30",
      completed: true,
    },
    {
      id: 2,
      title: "useState Deep Dive",
      duration: "12:45",
      completed: true,
    },
    {
      id: 3,
      title: "useEffect Mastery",
      duration: "15:20",
      completed: false,
      current: true,
    },
    {
      id: 4,
      title: "Custom Hooks",
      duration: "18:10",
      completed: false,
    },
  ],
  quiz: {
    question: "What is the primary purpose of useEffect?",
    options: [
      "To manage component state",
      "To handle side effects in functional components",
      "To create custom hooks",
      "To optimize performance",
    ],
    correct: 1,
  },
};

export function InteractiveDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const progress = 65; // Demo progress

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      // Simulate video progress
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsPlaying(false);
            setShowQuiz(true);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
    }
  };

  const handleQuizAnswer = (index: number) => {
    setSelectedAnswer(index);
    setTimeout(() => {
      setShowResult(true);
    }, 500);
  };

  return (
    <section className="py-32 relative overflow-hidden">
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
                  <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
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

                    {/* Play Button */}
                    <motion.button
                      onClick={handlePlayPause}
                      className="w-20 h-20 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center hover-glow group"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}>
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-white" />
                      ) : (
                        <Play className="w-8 h-8 text-white ml-1" />
                      )}
                    </motion.button>

                    {/* Progress Bar */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <Progress
                        value={currentTime}
                        className="h-2 bg-white/20"
                      />
                    </div>
                  </div>

                  {/* Video Controls */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {demoContent.title}
                        </h3>
                        <p className="text-gray-400">
                          by {demoContent.instructor}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {demoContent.duration}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {demoContent.students}
                        </div>
                      </div>
                    </div>

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
                    {demoContent.lessons.map((lesson, index) => (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ₦{
                          lesson.current
                            ? "border-neon-blue/50 bg-neon-blue/10"
                            : lesson.completed
                              ? "border-neon-green/30 bg-neon-green/5"
                              : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {lesson.completed ? (
                              <CheckCircle className="w-5 h-5 text-neon-green mr-3" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 mr-3" />
                            )}
                            <div>
                              <p className="text-white font-medium">
                                {lesson.title}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {lesson.duration}
                              </p>
                            </div>
                          </div>
                          {lesson.current && (
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
                      {demoContent.quiz.question}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {demoContent.quiz.options.map((option, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleQuizAnswer(index)}
                          disabled={selectedAnswer !== null}
                          className={`p-4 rounded-xl border text-left transition-all duration-300 ₦{
                            selectedAnswer === index
                              ? index === demoContent.quiz.correct
                                ? "border-neon-green bg-neon-green/20 text-neon-green"
                                : "border-red-400 bg-red-400/20 text-red-400"
                              : selectedAnswer !== null && index === demoContent.quiz.correct
                                ? "border-neon-green bg-neon-green/20 text-neon-green"
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
                        {selectedAnswer === demoContent.quiz.correct ? (
                          <div className="text-neon-green">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-xl font-semibold">
                              Excellent! You got it right!
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
                        <Button className="mt-6 bg-gradient-to-r from-neon-blue to-neon-purple text-white hover-glow">
                          Continue Learning
                          <ArrowRight className="w-4 h-4 ml-2" />
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
