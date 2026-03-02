import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Fetch all active mentorship offerings
    // Offerings stay available even if booked - they're templates/listings
    const offerings = await db.mentorshipSession.findMany({
      where: {
        isOffering: true,
        status: "SCHEDULED",
      },
      include: {
        tutor: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
            bio: true,
            location: true,
            timezone: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // For each offering, get paid bookings separately
    const offeringIds = offerings.map((o) => o.id);

    // Fetch all paid bookings related to those offerings
    const paidBookings = await db.mentorshipSession.findMany({
      where: {
        // The offeringSessionId is not null (i.e., it's a booking)
        offeringSessionId: { in: offeringIds },
        // And the payment status is PAID
        paymentStatus: "PAID",
      },
      select: {
        id: true,
        studentId: true,
        offeringSessionId: true,
      },
    });

    // Create a map of offerings to their paid bookings
    const bookingsByOfferingId = new Map<string, any[]>();
    paidBookings.forEach((booking) => {
      if (!bookingsByOfferingId.has(booking.offeringSessionId!)) {
        bookingsByOfferingId.set(booking.offeringSessionId!, []);
      }
      bookingsByOfferingId.get(booking.offeringSessionId!)!.push(booking);
    });

    // Transform offerings into a format suitable for display
    const transformedOfferings = offerings.map((offering: any) => {
      const bookings = bookingsByOfferingId.get(offering.id) || [];
      const currentUserHasBooked = currentUserId
        ? bookings.some((b: any) => b.studentId === currentUserId)
        : false;

      return {
        id: offering.id,
        title: offering.title,
        description: offering.description,
        duration: offering.duration,
        price: offering.price,
        tutorName: offering.tutor.name,
        tutorId: offering.tutor.id,
        tutorAvatar: offering.tutor.image || offering.tutor.avatar || "",
        tutorBio: offering.tutor.bio,
        tutorLocation: offering.tutor.location,
        tutorTimezone: offering.tutor.timezone,
        courseId: offering.course?.id,
        courseName: offering.course?.title,
        courseSlug: offering.course?.slug,
        courseThumbnail: offering.course?.thumbnail,
        createdAt: offering.createdAt,
        bookingCount: bookings.length, // Show how many people booked
        userHasBooked: currentUserHasBooked, // Flag to show "You already booked this"
      };
    });

    return NextResponse.json({
      offerings: transformedOfferings,
      total: transformedOfferings.length,
    });
  } catch (error) {
    console.error("Error fetching mentorship offerings:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentorship offerings" },
      { status: 500 },
    );
  }
}
