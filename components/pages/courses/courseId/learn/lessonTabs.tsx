"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, LinkIcon, Video, ThumbsUp } from "lucide-react";
import { useState } from "react";

interface Resource {
  id: string;
  title: string;
  type: "PDF" | "VIDEO" | "LINK" | "CODE" | "DOCUMENT";
  url: string;
  size?: string;
}

interface Review {
  id: string;
  user: { name: string; avatar?: string };
  comment: string;
  likes: number;
  timeAgo: string;
}

export default function LessonTabs({
  description,
  lessonResources = [],
  moduleResources = [],
  reviews = [],
}: {
  description: string;
  lessonResources?: Resource[];
  moduleResources?: Resource[];
  reviews?: Review[];
}) {
  const [activeTab, setActiveTab] = useState("overview");

  const renderResourceIcon = (type: string) => {
    switch (type) {
      case "PDF":
      case "DOCUMENT":
        return <FileText className="w-4 h-4 text-red-400" />;
      case "VIDEO":
        return <Video className="w-4 h-4 text-blue-400" />;
      case "LINK":
      case "CODE":
        return <LinkIcon className="w-4 h-4 text-green-400" />;
      default:
        return <Download className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <Card className="glass-card border-white/10 mt-6">
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 text-white bg-white/5 border-b border-white/10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Lesson Overview
            </h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {description || "No description provided."}
            </p>
          </TabsContent>

          {/* Resources */}
          <TabsContent value="resources" className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Learning Resources
            </h3>

            {lessonResources.length === 0 && moduleResources.length === 0 ? (
              <p className="text-gray-400 italic">
                No resources available for this lesson yet.
              </p>
            ) : (
              <>
                {/* Lesson resources */}
                {lessonResources.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-neon-blue mb-2">
                      Lesson Resources
                    </h4>
                    <div className="space-y-2">
                      {lessonResources.map((res) => (
                        <a
                          key={res.id}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-3 rounded-md text-sm text-gray-200 transition">
                          {renderResourceIcon(res.type)}
                          <span>
                            {res.title}{" "}
                            <span className="text-xs text-gray-400">
                              ({res.type})
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Module resources */}
                {moduleResources.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-neon-purple mb-2">
                      Module Resources
                    </h4>
                    <div className="space-y-2">
                      {moduleResources.map((res) => (
                        <a
                          key={res.id}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-3 rounded-md text-sm text-gray-200 transition">
                          {renderResourceIcon(res.type)}
                          <span>
                            {res.title}{" "}
                            <span className="text-xs text-gray-400">
                              ({res.type})
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Discussion */}
          <TabsContent value="discussion" className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Discussion
            </h3>
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={review.user.avatar || "/placeholder.svg"}
                        />
                        <AvatarFallback>
                          {review.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white font-medium">
                            {review.user.name}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {review.timeAgo}
                          </span>
                        </div>
                        <p className="text-gray-300">{review.comment}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white">
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            {review.likes}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white">
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">
                  No discussion yet. Be the first!
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
