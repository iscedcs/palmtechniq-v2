"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: string;
  isTyping?: boolean;
}

interface LessonAIAssistantProps {
  lessonId: string;
  lessonTitle: string;
  lessonContent?: string;
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

export function LessonAIAssistant({
  lessonId,
  lessonTitle,
  lessonContent,
  isOpen,
  onClose,
  onMinimize,
  isMinimized = false,
}: LessonAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: `Hi! I'm your AI learning assistant for "${lessonTitle}". I'm here to help you understand the concepts, answer questions, and provide additional insights. What would you like to know?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: generateAIResponse(inputValue, lessonTitle),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (question: string, lesson: string): string => {
    // This would be replaced with actual AI API call
    const responses = [
      `Great question about ${lesson}! Let me break this down for you...`,
      `That's an excellent point to clarify in ${lesson}. Here's what you need to know...`,
      `I can see why that might be confusing in ${lesson}. Let me explain it differently...`,
      `Perfect! This is a key concept in ${lesson}. Here's the detailed explanation...`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const quickQuestions = [
    "Explain this concept simply",
    "Give me an example",
    "What are the key points?",
    "How does this apply in practice?",
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          height: isMinimized ? 60 : 600,
        }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`fixed bottom-6 right-6 z-50 w-96 ₦{isMinimized ? "h-16" : "h-[600px]"} transition-all duration-300`}>
        <Card className="glass-card border-neon-blue/30 shadow-2xl shadow-neon-blue/20 h-full">
          {/* Header */}
          <CardHeader className="pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple">
                    <AvatarFallback className="bg-transparent">
                      <Bot className="w-4 h-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    AI Assistant
                  </h3>
                  <p className="text-gray-400 text-xs truncate max-w-48">
                    {lessonTitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {onMinimize && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMinimize}
                    className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10">
                    {isMinimized ? (
                      <Maximize2 className="w-4 h-4" />
                    ) : (
                      <Minimize2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ₦{message.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ₦{
                          message.type === "user"
                            ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white"
                            : "bg-white/10 text-gray-100 border border-white/20"
                        }`}>
                        <p className="text-sm leading-relaxed">
                          {message.content}
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start">
                      <div className="bg-white/10 border border-white/20 p-3 rounded-2xl">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce delay-200" />
                          </div>
                          <span className="text-gray-400 text-xs">
                            AI is thinking...
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Quick Questions */}
              <div className="px-4 py-2 border-t border-white/10">
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputValue(question)}
                      className="text-xs bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white">
                      {question}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Ask me anything about this lesson..."
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400 pr-10"
                      disabled={isLoading}
                    />
                    <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neon-blue" />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-gradient-to-r from-neon-blue to-neon-purple text-white p-2 w-10 h-10">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
