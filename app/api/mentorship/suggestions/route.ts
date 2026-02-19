import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const courseId = req.nextUrl.searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    // Get all mentorship offerings linked to this course
    const suggestions = await db.mentorshipSession.findMany({
      where: {
        courseId: courseId,
        isOffering: true,
        status: 'SCHEDULED',
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        price: true,
        tutor: {
          select: {
            name: true,
            avatar: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5, // Limit to 5 suggestions
    });

    // Transform tutor name for display
    const transformedSuggestions = suggestions.map((s) => ({
      ...s,
      tutor: {
        ...s.tutor,
        name: s.tutor.name || 'Mentor',
      },
    }));

    return NextResponse.json({
      suggestions: transformedSuggestions,
      total: transformedSuggestions.length,
    });
  } catch (error) {
    console.error('Error fetching mentorship suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentorship suggestions' },
      { status: 500 }
    );
  }
}
