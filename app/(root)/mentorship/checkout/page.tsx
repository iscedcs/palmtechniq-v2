"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
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
import { Clock, DollarSign, MapPin, CalendarClock } from "lucide-react";
import { beginOfferingCheckout } from "@/actions/mentorship-revenue";
import Link from "next/link";
import { NairaIcon } from "@/components/shared/nairaicon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OfferingDetails {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  price: number;
  tutorName: string;
  tutorId: string;
  tutorAvatar: string;
  tutorLocation: string | null;
  courseName: string | null;
}

export default function MentorshipCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offeringId = searchParams?.get("offeringId");

  const [offering, setOffering] = useState<OfferingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingMode, setBookingMode] = useState<"INSTANT" | "REQUEST">(
    "INSTANT",
  );
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");
  const [showTimeError, setShowTimeError] = useState(false);

  useEffect(() => {
    if (!offeringId) {
      toast.error("No offering selected");
      router.push("/mentorship");
      return;
    }

    const fetchOffering = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/mentorship/offerings/${offeringId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch offering details");
        }
        const data = await response.json();
        setOffering(data.offering);
      } catch (error) {
        console.error("Error fetching offering:", error);
        toast.error("Failed to load offering details");
        router.push("/mentorship");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffering();
  }, [offeringId, router]);

  const handleBookAndPay = async () => {
    if (!offering) return;

    // Validate time selection for INSTANT mode
    if (bookingMode === "INSTANT" && !selectedDateTime) {
      setShowTimeError(true);
      toast.error("Please select a date and time for your session");
      return;
    }

    try {
      setIsProcessing(true);

      // Call server action to book and initialize payment
      const result = await beginOfferingCheckout(
        offering.id,
        bookingMode,
        selectedDateTime,
      );

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      if (result.mode === "REQUEST") {
        // For REQUEST mode, show success and redirect
        toast.success(
          "Mentorship request submitted! Awaiting mentor approval.",
        );
        router.push(`/student/mentorship`);
        return;
      }

      // For INSTANT mode, redirect to Paystack
      if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      }
    } catch (error) {
      console.error("Error processing booking:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process booking",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-12">
        <div className="container mx-auto px-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Loading offering details...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!offering) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-12">
        <div className="container mx-auto px-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">Offering not found</p>
              <Link href="/mentorship">
                <Button>Back to Mentorship</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-12">
      <div className="container mx-auto px-6 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Confirm Your Booking</h1>

        <div className="grid gap-6">
          {/* Offering Details */}
          <Card>
            <CardHeader>
              <CardTitle>{offering.title}</CardTitle>
              {offering.courseName && (
                <Badge variant="secondary">{offering.courseName}</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {offering.description && (
                <div>
                  <p className="text-sm text-secondary">
                    {offering.description}
                  </p>
                </div>
              )}

              {/* Tutor Information */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={offering.tutorAvatar}
                    alt={offering.tutorName}
                  />
                  <AvatarFallback>
                    {offering.tutorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{offering.tutorName}</p>
                  {offering.tutorLocation && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {offering.tutorLocation}
                    </p>
                  )}
                </div>
              </div>

              {/* Session Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold">{offering.duration} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  {/* <NairaIcon className="h-4 w-4 text-muted-foreground" /> */}
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-semibold">
                      ₦{offering.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Slot Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Select Your Session Time
              </CardTitle>
              <CardDescription>
                Choose when you'd like to start this {offering.duration}-minute
                session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label
                  htmlFor="sessionDateTime"
                  className="text-sm font-medium">
                  Date & Time
                </Label>
                <Input
                  id="sessionDateTime"
                  type="datetime-local"
                  value={selectedDateTime}
                  onChange={(e) => {
                    setSelectedDateTime(e.target.value);
                    setShowTimeError(false);
                  }}
                  className={`mt-2 ${showTimeError && !selectedDateTime ? "border-red-500" : ""}`}
                  min={new Date().toISOString().slice(0, 16)}
                />
                {showTimeError && !selectedDateTime && (
                  <p className="text-red-500 text-sm mt-1">
                    Please select a date and time
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
                <p className="text-xs text-blue-200">
                  💡 <strong>Tip:</strong> Your session will end automatically
                  after {offering.duration} minutes from your selected start
                  time.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Booking Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                How would you like to book?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer  transition-colors"
                onClick={() => setBookingMode("INSTANT")}>
                <input
                  type="radio"
                  name="bookingMode"
                  value="INSTANT"
                  checked={bookingMode === "INSTANT"}
                  onChange={(e) =>
                    setBookingMode(e.target.value as "INSTANT" | "REQUEST")
                  }
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-semibold">Book & Pay Now</p>
                  <p className="text-sm text-secondary">
                    Instant booking - session confirmed immediately after
                    payment
                  </p>
                </div>
              </label>

              <label
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer  transition-colors"
                onClick={() => setBookingMode("REQUEST")}>
                <input
                  type="radio"
                  name="bookingMode"
                  value="REQUEST"
                  checked={bookingMode === "REQUEST"}
                  onChange={(e) =>
                    setBookingMode(e.target.value as "INSTANT" | "REQUEST")
                  }
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-semibold">Request First</p>
                  <p className="text-sm text-secondary">
                    Mentor reviews your request before you pay (recommended if
                    first time)
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session price</span>
                <span className="font-semibold">
                  ₦{offering.price.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₦{offering.price.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link href="/mentorship" className="flex-1">
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button
              onClick={handleBookAndPay}
              disabled={isProcessing}
              className="flex-1">
              {isProcessing ? (
                <>
                  <span className="inline-block mr-2">⏳</span>
                  Processing...
                </>
              ) : bookingMode === "REQUEST" ? (
                "Submit Request"
              ) : (
                "Continue to Payment"
              )}
            </Button>
          </div>

          {/* Info */}
          <p className="text-xs text-secondary text-center">
            {bookingMode === "REQUEST"
              ? "Your request will be reviewed by the mentor within 24-48 hours"
              : "You will be redirected to Paystack to complete payment"}
          </p>
        </div>
      </div>
    </div>
  );
}
