import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Certificate code is required" },
      { status: 400 },
    );
  }

  const rawCode = code.trim();
  const upperCode = rawCode.toUpperCase();

  try {
    // 1. Check Volunteer Certificates (PTV- prefix, certCode, or DB ID)
    if (upperCode.startsWith("PTV-")) {
      const volunteerCert = await db.volunteerCertificate.findFirst({
        where: {
          OR: [
            { certCode: upperCode },
            { certCode: rawCode },
            { id: rawCode },
          ],
        },
      });

      if (!volunteerCert) {
        return NextResponse.json(
          { error: "Certificate not found", valid: false },
          { status: 404 },
        );
      }

      return NextResponse.json({
        valid: !volunteerCert.isRevoked,
        type: "volunteer",
        certificate: {
          certCode: volunteerCert.certCode,
          certificateId: volunteerCert.certCode,
          studentName: volunteerCert.volunteerName,
          volunteerName: volunteerCert.volunteerName,
          eventName: volunteerCert.eventName,
          title: `${volunteerCert.eventName} - ${volunteerCert.role || "Volunteer"}`,
          role: volunteerCert.role,
          description: volunteerCert.description,
          issuedAt: volunteerCert.issuedAt,
          isRevoked: volunteerCert.isRevoked,
          certificateUrl: volunteerCert.certificateUrl,
        },
      });
    }

    // 2. Query Regular Certificate:
    // Matches by:
    // - certificateId (e.g. PTQ-PRG-2026-ATMPZ7 or lowercase)
    // - id (certificate DB primary key cuid)
    // - userId (student's user cuid, e.g. cmsn9wwkf000004jpro7s1awm)
    let certificate = await db.certificate.findFirst({
      where: {
        OR: [
          { certificateId: upperCode },
          { certificateId: rawCode },
          { id: rawCode },
          { userId: rawCode },
        ],
      },
      include: {
        course: {
          select: {
            title: true,
            slug: true,
          },
        },
        program: {
          select: {
            name: true,
            slug: true,
          },
        },
        cohort: {
          select: {
            displayName: true,
          },
        },
        user: {
          select: {
            name: true,
            image: true,
            avatar: true,
          },
        },
        issuedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    // 3. Fallback check for Volunteer Certificate (if passed without PTV- prefix or by DB ID)
    if (!certificate) {
      const volunteerFallback = await db.volunteerCertificate.findFirst({
        where: {
          OR: [
            { certCode: upperCode },
            { certCode: rawCode },
            { id: rawCode },
          ],
        },
      });

      if (volunteerFallback) {
        return NextResponse.json({
          valid: !volunteerFallback.isRevoked,
          type: "volunteer",
          certificate: {
            certCode: volunteerFallback.certCode,
            certificateId: volunteerFallback.certCode,
            studentName: volunteerFallback.volunteerName,
            volunteerName: volunteerFallback.volunteerName,
            eventName: volunteerFallback.eventName,
            title: `${volunteerFallback.eventName} - ${volunteerFallback.role || "Volunteer"}`,
            role: volunteerFallback.role,
            description: volunteerFallback.description,
            issuedAt: volunteerFallback.issuedAt,
            isRevoked: volunteerFallback.isRevoked,
            certificateUrl: volunteerFallback.certificateUrl,
          },
        });
      }

      return NextResponse.json(
        { error: "Certificate not found", valid: false },
        { status: 404 },
      );
    }

    const certType = certificate.programId
      ? "program"
      : certificate.courseId
      ? "course"
      : "general";

    return NextResponse.json({
      valid: !certificate.isRevoked,
      type: certType,
      certificate: {
        certificateId: certificate.certificateId,
        title: certificate.title,
        studentName: certificate.studentName,
        programName: certificate.program?.name || null,
        cohortName: certificate.cohort?.displayName || null,
        courseName: certificate.course?.title || certificate.program?.name || certificate.title,
        courseSlug: certificate.course?.slug || certificate.program?.slug || null,
        description: certificate.description,
        grade: certificate.grade,
        score: certificate.score,
        issuedAt: certificate.issuedAt,
        isRevoked: certificate.isRevoked,
        revocationReason: certificate.revocationReason,
        certificateUrl: certificate.certificateUrl,
        holderImage: certificate.user?.image || certificate.user?.avatar || null,
        issuedByName: certificate.issuedBy?.name || null,
      },
    });
  } catch (error) {
    console.error("Certificate verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify certificate" },
      { status: 500 },
    );
  }
}
