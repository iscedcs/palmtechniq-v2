'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { db } from '@/lib/db';

interface MentorshipSuggestion {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  price: number;
  tutor: {
    name: string;
    avatar: string | null;
  };
}

interface CourseMentorshipSuggestionsProps {
  courseId: string;
  studentId?: string;
}

export default function CourseMentorshipSuggestions({
  courseId,
  studentId,
}: CourseMentorshipSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<MentorshipSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        setIsLoading(true);

        // Fetch mentorship offerings linked to the course
        const response = await fetch(
          `/api/mentorship/suggestions?courseId=${courseId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch mentorship suggestions');
        }

        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error('Error loading mentorship suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSuggestions();
  }, [courseId]);

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Loading mentorship suggestions...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0 || isDismissed) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">Master This Course</CardTitle>
              <CardDescription>
                Personalized 1:1 mentorship to deepen your mastery
              </CardDescription>
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You've completed this course! Take your skills to the next level with personalized
          mentorship from experienced instructors.
        </p>

        <div className="space-y-3">
          {suggestions.map((mentorship) => (
            <div
              key={mentorship.id}
              className="flex items-start justify-between rounded-lg border border-blue-200 bg-white p-3"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{mentorship.title}</h3>
                {mentorship.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {mentorship.description.substring(0, 80)}
                    {mentorship.description.length > 80 ? '...' : ''}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>👤 {mentorship.tutor.name}</span>
                  <span>⏱️ {mentorship.duration} mins</span>
                  <span className="font-semibold text-blue-600">
                    ₦{mentorship.price.toLocaleString()}
                  </span>
                </div>
              </div>
              <Link href={`/mentorship/${mentorship.id}/book`}>
                <Button size="sm" variant="outline" className="ml-3">
                  Book <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Link href={`/mentorship?courseId=${courseId}`} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              View All Mentors
            </Button>
          </Link>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsDismissed(true)}
          >
            Maybe Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
