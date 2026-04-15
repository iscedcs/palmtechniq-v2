import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Certificate code is required" },
      { status: 400 }
    );
  }

  try {
    // Check if it's a volunteer certificate (PTV- prefix)
    if (code.startsWith("PTV-")) {
      const volunteerCert = await db.volunteerCertificate.findUnique({
        where: { certCode: code },
      });

      if (!volunteerCert) {
        return NextResponse.json(
          { error: "Certificate not found", valid: false },
          { status: 404 }
        );
      }

      return NextResponse.json({
        valid: !volunteerCert.isRevoked,
        type: "volunteer",
        certificate: {
          certCode: volunteerCert.certCode,
          volunteerName: volunteerCert.volunteerName,
          eventName: volunteerCert.eventName,
          role: volunteerCert.role,
          description: volunteerCert.description,
          issuedAt: volunteerCert.issuedAt,
          isRevoked: volunteerCert.isRevoked,
          certificateUrl: volunteerCert.certificateUrl,
        },
      });
    }

    // Otherwise, treat as a course certificate
    const certificate = await db.certificate.findUnique({
      where: { certificateId: code },
      include: {
        course: {
          select: {
            title: true,
            slug: true,
          },
        },
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found", valid: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: !certificate.isRevoked,
      type: "course",
      certificate: {
        certificateId: certificate.certificateId,
        title: certificate.title,
        studentName: certificate.studentName,
        courseName: certificate.course.title,
        courseSlug: certificate.course.slug,
        description: certificate.description,
        issuedAt: certificate.issuedAt,
        isRevoked: certificate.isRevoked,
        certificateUrl: certificate.certificateUrl,
        holderImage: certificate.user.image,
      },
    });
  } catch (error) {
    console.error("Certificate verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify certificate" },
      { status: 500 }
    );
  }
}
