import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ offeringId: string }> }
) {
  try {
    const { offeringId } = await params;

    const offering = await db.mentorshipSession.findUnique({
      where: { id: offeringId },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        price: true,
        isOffering: true,
        status: true,
        tutor: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
            location: true,
            bio: true,
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
    });

    if (!offering) {
      return NextResponse.json(
        { error: 'Offering not found' },
        { status: 404 }
      );
    }

    if (!offering.isOffering || offering.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Offering is not available for booking' },
        { status: 400 }
      );
    }

    // Transform response
    const transformedOffering = {
      id: offering.id,
      title: offering.title,
      description: offering.description,
      duration: offering.duration,
      price: offering.price,
      tutorName: offering.tutor.name,
      tutorId: offering.tutor.id,
      tutorAvatar: offering.tutor.image || offering.tutor.avatar || '',
      tutorBio: offering.tutor.bio,
      tutorLocation: offering.tutor.location,
      courseName: offering.course?.title,
      courseSlug: offering.course?.slug,
    };

    return NextResponse.json({
      offering: transformedOffering,
    });
  } catch (error) {
    console.error('Error fetching offering:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offering details' },
      { status: 500 }
    );
  }
}
