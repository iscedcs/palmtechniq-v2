"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  CertificateCategory,
  generateUniqueCredentialId,
  isCredentialIdUnique,
} from "@/lib/certificate/credential-id";
import { CertificateType } from "@prisma/client";

async function verifyAdminOrSuperior() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized. Please log in." };
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPERIOR") {
    return { ok: false, error: "Access denied. Admin or Superior privileges required." };
  }

  return { ok: true, userId: session.user.id, role };
}

export type CertificateListFilter = {
  search?: string;
  type?: "ALL" | "PROGRAM" | "COURSE" | "VOLUNTEER" | "GENERAL";
  status?: "ALL" | "ACTIVE" | "REVOKED";
  page?: number;
  pageSize?: number;
};

export async function getCertificatesList(filters: CertificateListFilter = {}) {
  const authCheck = await verifyAdminOrSuperior();
  if (!authCheck.ok) return { error: authCheck.error };

  const {
    search = "",
    type = "ALL",
    status = "ALL",
    page = 1,
    pageSize = 20,
  } = filters;

  const searchTrimmed = search.trim();

  // Query Regular Certificates
  const regularWhere: any = {};

  if (status === "ACTIVE") {
    regularWhere.isRevoked = false;
  } else if (status === "REVOKED") {
    regularWhere.isRevoked = true;
  }

  if (type === "PROGRAM") {
    regularWhere.programId = { not: null };
  } else if (type === "COURSE") {
    regularWhere.courseId = { not: null };
  } else if (type === "GENERAL") {
    regularWhere.programId = null;
    regularWhere.courseId = null;
  }

  if (searchTrimmed) {
    regularWhere.OR = [
      { certificateId: { contains: searchTrimmed, mode: "insensitive" } },
      { studentName: { contains: searchTrimmed, mode: "insensitive" } },
      { title: { contains: searchTrimmed, mode: "insensitive" } },
      { user: { email: { contains: searchTrimmed, mode: "insensitive" } } },
      { user: { name: { contains: searchTrimmed, mode: "insensitive" } } },
      { program: { name: { contains: searchTrimmed, mode: "insensitive" } } },
      { course: { title: { contains: searchTrimmed, mode: "insensitive" } } },
    ];
  }

  // Query Volunteer Certificates if applicable
  const shouldIncludeVolunteer = type === "ALL" || type === "VOLUNTEER";
  const volunteerWhere: any = {};

  if (status === "ACTIVE") {
    volunteerWhere.isRevoked = false;
  } else if (status === "REVOKED") {
    volunteerWhere.isRevoked = true;
  }

  if (searchTrimmed) {
    volunteerWhere.OR = [
      { certCode: { contains: searchTrimmed, mode: "insensitive" } },
      { volunteerName: { contains: searchTrimmed, mode: "insensitive" } },
      { eventName: { contains: searchTrimmed, mode: "insensitive" } },
      { role: { contains: searchTrimmed, mode: "insensitive" } },
    ];
  }

  try {
    const [regularCerts, regularCount, volunteerCerts, volunteerCount] = await Promise.all([
      type !== "VOLUNTEER"
        ? db.certificate.findMany({
            where: regularWhere,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  avatar: true,
                },
              },
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
              program: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              cohort: {
                select: {
                  id: true,
                  displayName: true,
                },
              },
              issuedBy: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: { issuedAt: "desc" },
          })
        : [],
      type !== "VOLUNTEER" ? db.certificate.count({ where: regularWhere }) : 0,
      shouldIncludeVolunteer
        ? db.volunteerCertificate.findMany({
            where: volunteerWhere,
            orderBy: { issuedAt: "desc" },
          })
        : [],
      shouldIncludeVolunteer ? db.volunteerCertificate.count({ where: volunteerWhere }) : 0,
    ]);

    // Format unified list
    const unified = [
      ...regularCerts.map((c: any) => ({
        id: c.id,
        credentialId: c.certificateId,
        studentName: c.studentName,
        userEmail: c.user.email,
        userImage: c.user.image || c.user.avatar,
        userId: c.userId,
        title: c.title,
        description: c.description,
        certificateUrl: c.certificateUrl,
        category: (c.programId ? "PROGRAM" : c.courseId ? "COURSE" : "GENERAL") as CertificateCategory,
        programName: c.program?.name || null,
        cohortName: c.cohort?.displayName || null,
        courseName: c.course?.title || null,
        grade: c.grade,
        score: c.score,
        issuedAt: c.issuedAt.toISOString(),
        issuedDate: c.issuedDate.toISOString(),
        isRevoked: c.isRevoked,
        revocationReason: c.revocationReason,
        revokedAt: c.revokedAt ? c.revokedAt.toISOString() : null,
        issuedByName: c.issuedBy?.name || null,
        isVolunteer: false,
      })),
      ...volunteerCerts.map((v: any) => ({
        id: v.id,
        credentialId: v.certCode,
        studentName: v.volunteerName,
        userEmail: null,
        userImage: null,
        userId: null,
        title: `${v.eventName} - ${v.role || "Volunteer"}`,
        description: v.description,
        certificateUrl: v.certificateUrl,
        category: "VOLUNTEER" as CertificateCategory,
        programName: null,
        cohortName: null,
        courseName: v.eventName,
        grade: null,
        score: null,
        issuedAt: v.issuedAt.toISOString(),
        issuedDate: v.issuedAt.toISOString(),
        isRevoked: v.isRevoked,
        revocationReason: null,
        revokedAt: null,
        issuedByName: null,
        isVolunteer: true,
      })),
    ];

    // Sort by issuedAt desc
    unified.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

    const total = regularCount + volunteerCount;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = unified.slice(startIndex, startIndex + pageSize);

    return {
      success: true,
      certificates: paginatedItems,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  } catch (error: any) {
    console.error("Error loading certificates:", error);
    return { error: error?.message || "Failed to load certificates" };
  }
}

export async function getCertificateStats() {
  const authCheck = await verifyAdminOrSuperior();
  if (!authCheck.ok) return { error: authCheck.error };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  try {
    const [
      totalRegular,
      totalVolunteer,
      programCount,
      courseCount,
      generalCount,
      revokedRegular,
      revokedVolunteer,
      thisMonthRegular,
      thisMonthVolunteer,
    ] = await Promise.all([
      db.certificate.count(),
      db.volunteerCertificate.count(),
      db.certificate.count({ where: { programId: { not: null } } }),
      db.certificate.count({ where: { courseId: { not: null } } }),
      db.certificate.count({ where: { programId: null, courseId: null } }),
      db.certificate.count({ where: { isRevoked: true } }),
      db.volunteerCertificate.count({ where: { isRevoked: true } }),
      db.certificate.count({ where: { issuedAt: { gte: startOfMonth } } }),
      db.volunteerCertificate.count({ where: { issuedAt: { gte: startOfMonth } } }),
    ]);

    return {
      success: true,
      stats: {
        total: totalRegular + totalVolunteer,
        programCertificates: programCount,
        courseCertificates: courseCount,
        volunteerCertificates: totalVolunteer,
        generalCertificates: generalCount,
        revoked: revokedRegular + revokedVolunteer,
        issuedThisMonth: thisMonthRegular + thisMonthVolunteer,
      },
    };
  } catch (error: any) {
    console.error("Error loading certificate stats:", error);
    return { error: error?.message || "Failed to load certificate stats" };
  }
}

export async function getEligibleStudentsAndPrograms() {
  const authCheck = await verifyAdminOrSuperior();
  if (!authCheck.ok) return { error: authCheck.error };

  try {
    const [users, programs, courses, programEnrollments] = await Promise.all([
      db.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          avatar: true,
        },
        orderBy: { name: "asc" },
        take: 300,
      }),
      db.professionalProgram.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          cohorts: {
            where: { isOpen: true },
            select: {
              id: true,
              displayName: true,
              cycleNumber: true,
            },
            orderBy: { cycleNumber: "desc" },
          },
        },
        orderBy: { name: "asc" },
      }),
      db.course.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          tutor: { select: { user: { select: { name: true } } } },
        },
        orderBy: { title: "asc" },
        take: 100,
      }),
      db.programEnrollment.findMany({
        where: {
          status: { in: ["FULLY_PAID", "COMPLETED", "ACTIVE"] },
        },
        include: {
          program: { select: { id: true, name: true } },
          cohort: { select: { id: true, displayName: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    return {
      success: true,
      students: users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        image: u.image || u.avatar,
      })),
      programs: programs.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        cohorts: p.cohorts.map((c: any) => ({
          id: c.id,
          name: c.displayName,
        })),
      })),
      courses: courses.map((c: any) => ({
        id: c.id,
        title: c.title,
        instructor: c.tutor?.user?.name || "PalmTechnIQ",
      })),
      recentEnrollments: programEnrollments.map((pe: any) => ({
        id: pe.id,
        fullName: pe.fullName,
        email: pe.email,
        userId: pe.userId,
        programId: pe.programId,
        programName: pe.program.name,
        cohortId: pe.cohortId,
        cohortName: pe.cohort.displayName,
        status: pe.status,
      })),
    };
  } catch (error: any) {
    console.error("Error loading eligible students:", error);
    return { error: error?.message || "Failed to load students and programs" };
  }
}

export async function generateNextCredentialId(
  type: CertificateCategory = "PROGRAM",
) {
  const authCheck = await verifyAdminOrSuperior();
  if (!authCheck.ok) return { error: authCheck.error };

  try {
    const credentialId = await generateUniqueCredentialId(type);
    return { success: true, credentialId };
  } catch (error: any) {
    return { error: error?.message || "Failed to generate credential ID" };
  }
}

export type IssueCertificateInput = {
  userId: string;
  studentName: string;
  category: "PROGRAM" | "COURSE" | "GENERAL";
  programId?: string;
  cohortId?: string;
  courseId?: string;
  title: string;
  description?: string;
  credentialId?: string;
  certificateUrl?: string;
  grade?: string;
  score?: number;
  issuedDate?: string;
  certificateType?: CertificateType;
};

export async function issueCertificate(input: IssueCertificateInput) {
  const authCheck = await verifyAdminOrSuperior();
  if (!authCheck.ok) return { error: authCheck.error };

  const {
    userId,
    studentName,
    category,
    programId,
    cohortId,
    courseId,
    title,
    description,
    credentialId,
    certificateUrl = "",
    grade,
    score,
    issuedDate,
    certificateType = "CertificateOfCompletion",
  } = input;

  if (!userId) return { error: "User is required." };
  if (!studentName?.trim()) return { error: "Student name is required." };
  if (!title?.trim()) return { error: "Certificate title is required." };

  try {
    // Generate or validate credential ID
    let finalId = credentialId?.trim().toUpperCase();
    if (!finalId) {
      finalId = await generateUniqueCredentialId(category);
    } else {
      const isUnique = await isCredentialIdUnique(finalId);
      if (!isUnique) {
        return { error: `Credential ID "${finalId}" is already in use. Please generate another one.` };
      }
    }

    const issueTimestamp = issuedDate ? new Date(issuedDate) : new Date();

    const created = await db.certificate.create({
      data: {
        certificateId: finalId,
        studentName: studentName.trim(),
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        certificateUrl: certificateUrl?.trim() || "",
        type: certificateType,
        programId: category === "PROGRAM" && programId ? programId : null,
        cohortId: category === "PROGRAM" && cohortId ? cohortId : null,
        courseId: category === "COURSE" && courseId ? courseId : null,
        grade: grade?.trim() || null,
        score: typeof score === "number" ? score : null,
        issuedById: authCheck.userId,
        issuedAt: issueTimestamp,
        issuedDate: issueTimestamp,
      },
    });

    // If course certificate, mark Enrollment.certificateIssued = true if enrollment exists
    if (category === "COURSE" && courseId) {
      await db.enrollment.updateMany({
        where: { userId, courseId },
        data: { certificateIssued: true },
      });
    }

    // Create a progress milestone / achievement for the student
    try {
      await db.progressMilestone.create({
        data: {
          userId,
          type: "COURSE_COMPLETED",
          description: `Earned certificate: ${title} (${finalId})`,
          achievedAt: issueTimestamp,
        },
      });
    } catch {
      // Non-blocking milestone log
    }

    revalidatePath("/admin/certificates");
    revalidatePath("/admin/enrollments");
    revalidatePath("/student/programs");
    revalidatePath("/student/courses");
    revalidatePath("/student/achievements");
    revalidatePath("/verify-certificate");

    return {
      success: true,
      certificate: {
        id: created.id,
        credentialId: created.certificateId,
      },
    };
  } catch (error: any) {
    console.error("Error issuing certificate:", error);
    return { error: error?.message || "Failed to issue certificate" };
  }
}

export type IssueVolunteerCertificateInput = {
  volunteerName: string;
  eventName: string;
  role?: string;
  description?: string;
  certCode?: string;
  certificateUrl?: string;
  issuedAt?: string;
};

export async function issueVolunteerCertificate(input: IssueVolunteerCertificateInput) {
  const authCheck = await verifyAdminOrSuperior();
  if (!authCheck.ok) return { error: authCheck.error };

  const {
    volunteerName,
    eventName,
    role,
    description,
    certCode,
    certificateUrl = "",
    issuedAt,
  } = input;

  if (!volunteerName?.trim()) return { error: "Volunteer name is required." };
  if (!eventName?.trim()) return { error: "Event name is required." };

  try {
    let finalCode = certCode?.trim().toUpperCase();
    if (!finalCode) {
      finalCode = await generateUniqueCredentialId("VOLUNTEER");
    } else {
      const isUnique = await isCredentialIdUnique(finalCode);
      if (!isUnique) {
        return { error: `Cert code "${finalCode}" is already in use. Please generate another one.` };
      }
    }

    const timestamp = issuedAt ? new Date(issuedAt) : new Date();

    const created = await db.volunteerCertificate.create({
      data: {
        certCode: finalCode,
        volunteerName: volunteerName.trim(),
        eventName: eventName.trim(),
        role: role?.trim() || null,
        description: description?.trim() || null,
        certificateUrl: certificateUrl?.trim() || "",
        issuedAt: timestamp,
      },
    });

    revalidatePath("/admin/certificates");
    revalidatePath("/verify-certificate");

    return {
      success: true,
      certificate: {
        id: created.id,
        certCode: created.certCode,
      },
    };
  } catch (error: any) {
    console.error("Error issuing volunteer certificate:", error);
    return { error: error?.message || "Failed to issue volunteer certificate" };
  }
}

export type UpdateCertificateInput = {
  id: string;
  isVolunteer?: boolean;
  studentName?: string;
  title?: string;
  description?: string;
  certificateUrl?: string;
  grade?: string;
  score?: number;
  issuedDate?: string;
};

export async function updateCertificate(input: UpdateCertificateInput) {
  const authCheck = await verifyAdminOrSuperior();
  if (!authCheck.ok) return { error: authCheck.error };

  const {
    id,
    isVolunteer,
    studentName,
    title,
    description,
    certificateUrl,
    grade,
    score,
    issuedDate,
  } = input;

  if (!id) return { error: "Certificate ID is required." };

  try {
    if (isVolunteer) {
      await db.volunteerCertificate.update({
        where: { id },
        data: {
          ...(studentName && { volunteerName: studentName.trim() }),
          ...(title && { eventName: title.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(certificateUrl !== undefined && { certificateUrl: certificateUrl.trim() }),
          ...(issuedDate && { issuedAt: new Date(issuedDate) }),
        },
      });
    } else {
      await db.certificate.update({
        where: { id },
        data: {
          ...(studentName && { studentName: studentName.trim() }),
          ...(title && { title: title.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(certificateUrl !== undefined && { certificateUrl: certificateUrl.trim() }),
          ...(grade !== undefined && { grade: grade?.trim() || null }),
          ...(score !== undefined && { score: typeof score === "number" ? score : null }),
          ...(issuedDate && {
            issuedDate: new Date(issuedDate),
            issuedAt: new Date(issuedDate),
          }),
        },
      });
    }

    revalidatePath("/admin/certificates");
    revalidatePath("/student/programs");
    revalidatePath("/student/courses");
    revalidatePath("/verify-certificate");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating certificate:", error);
    return { error: error?.message || "Failed to update certificate" };
  }
}

export async function toggleCertificateRevocation(
  id: string,
  options: { isRevoked: boolean; reason?: string; isVolunteer?: boolean },
) {
  const authCheck = await verifyAdminOrSuperior();
  if (!authCheck.ok) return { error: authCheck.error };

  const { isRevoked, reason, isVolunteer } = options;

  try {
    if (isVolunteer) {
      await db.volunteerCertificate.update({
        where: { id },
        data: {
          isRevoked,
        },
      });
    } else {
      await db.certificate.update({
        where: { id },
        data: {
          isRevoked,
          revocationReason: isRevoked ? reason?.trim() || "Revoked by administration" : null,
          revokedAt: isRevoked ? new Date() : null,
        },
      });
    }

    revalidatePath("/admin/certificates");
    revalidatePath("/verify-certificate");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating certificate status:", error);
    return { error: error?.message || "Failed to update revocation status" };
  }
}

export async function deleteCertificate(id: string, isVolunteer: boolean = false) {
  const authCheck = await verifyAdminOrSuperior();
  if (!authCheck.ok) return { error: authCheck.error };

  try {
    if (isVolunteer) {
      await db.volunteerCertificate.delete({ where: { id } });
    } else {
      await db.certificate.delete({ where: { id } });
    }

    revalidatePath("/admin/certificates");
    revalidatePath("/verify-certificate");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting certificate:", error);
    return { error: error?.message || "Failed to delete certificate" };
  }
}
