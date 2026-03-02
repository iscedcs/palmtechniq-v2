"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, DollarSign, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface MentorshipOffering {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  price: number;
  tutorName: string;
  tutorId: string;
  tutorAvatar: string;
  tutorBio: string | null;
  tutorLocation: string | null;
  tutorTimezone: string | null;
  courseName: string | null;
  courseSlug: string | null;
  createdAt: string;
}

export default function MentorshipOfferingsGrid() {
  const [offerings, setOfferings] = useState<MentorshipOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPrice, setFilterPrice] = useState("all");

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/mentorship/offerings");
        if (!response.ok) {
          throw new Error("Failed to fetch offerings");
        }
        const data = await response.json();
        setOfferings(data.offerings || []);
      } catch (error) {
        console.error("Error fetching offerings:", error);
        toast.error("Failed to load mentorship offerings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfferings();
  }, []);

  const filteredOfferings = offerings.filter((offering) => {
    // Search filter
    const matchesSearch =
      offering.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offering.tutorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offering.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Price filter
    if (filterPrice !== "all") {
      const [min, max] = filterPrice.split("-").map(Number);
      if (max && (offering.price < min || offering.price > max)) {
        return false;
      } else if (!max && offering.price < min) {
        return false;
      }
    }

    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">
          Available Mentorship Sessions
        </h2>
        <p className="text-muted-foreground">
          Book 1-on-1 mentorship from experienced professionals
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <Input
          placeholder="Search by mentor name, topic, or title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={filterPrice === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterPrice("all")}>
            All Prices
          </Badge>
          <Badge
            variant={filterPrice === "0-5000" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterPrice("0-5000")}>
            Under ₦5000
          </Badge>
          <Badge
            variant={filterPrice === "5000-10000" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterPrice("5000-10000")}>
            ₦5000 - ₦10000
          </Badge>
          <Badge
            variant={filterPrice === "10000-999999" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterPrice("10000-999999")}>
            Above ₦10000
          </Badge>
        </div>
      </div>

      {/* Offerings Grid */}
      {filteredOfferings.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground mb-4">
              {offerings.length === 0
                ? "No mentorship offerings available yet"
                : "No offerings match your search"}
            </p>
            {offerings.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterPrice("all");
                }}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOfferings.map((offering) => (
            <OfferingCard key={offering.id} offering={offering} />
          ))}
        </div>
      )}

      {/* Summary */}
      <p className="text-sm text-muted-foreground text-center">
        Showing {filteredOfferings.length} of {offerings.length} available
        sessions
      </p>
    </div>
  );
}

function OfferingCard({ offering }: { offering: MentorshipOffering }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">
              {offering.title}
            </CardTitle>
            {offering.courseName && (
              <Badge variant="secondary" className="mt-2">
                {offering.courseName}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="line-clamp-2 text-secondary">
          {offering.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Tutor Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
          <Avatar className="h-10 w-10">
            <AvatarImage src={offering.tutorAvatar} alt={offering.tutorName} />
            <AvatarFallback>{offering.tutorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{offering.tutorName}</p>
            {offering.tutorLocation && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {offering.tutorLocation}
              </p>
            )}
          </div>
        </div>

        {/* Session Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-secondary" />
            <span className="text-sm">{offering.duration} mins</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              ₦{offering.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Bio Preview */}
        {offering.tutorBio && (
          <p className="text-sm text-secondary line-clamp-2">
            {offering.tutorBio}
          </p>
        )}
      </CardContent>

      {/* Book Button */}
      <div className="p-4 border-t">
        <BookOfferingButton offering={offering} />
      </div>
    </Card>
  );
}

function BookOfferingButton({ offering }: { offering: MentorshipOffering }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleBook = async () => {
    try {
      setIsLoading(true);
      // Redirect to checkout with offering ID
      // In a real implementation, you'd either:
      // 1. Call bookMentorshipOffering action and proceed to payment
      // 2. Redirect to a checkout page with offering details
      window.location.href = `/mentorship/checkout?offeringId=${offering.id}`;
    } catch (error) {
      console.error("Error booking offering:", error);
      toast.error("Failed to book offering");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleBook} disabled={isLoading} className="w-full">
      {isLoading ? "Booking..." : "Book Session"}
    </Button>
  );
}
