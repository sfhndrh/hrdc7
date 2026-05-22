import type { AdminCourseDetailExtra } from "@/components/admin/admin-course-detail-content";
import type { CatalogCourse, PlatformCourseForCatalog } from "@/lib/training-courses-catalog";
import type { TrainingCourse } from "@/lib/training-providers";

export function catalogCourseFromPlatform(row: PlatformCourseForCatalog): CatalogCourse {
  return {
    title: row.title.trim(),
    category: row.category.trim(),
    providerCount: 1,
    providerNames: [row.companyName.trim() || "Training provider"],
    code: row.courseCode.trim(),
    scheme: row.skillLevel.trim(),
    claimable: row.hrdcClaimable === "Yes",
    duration: row.duration.trim(),
    fee: row.courseFee > 0 ? `RM ${row.courseFee.toLocaleString("en-MY")}` : "—",
    mode: row.deliveryMode.trim(),
    source: "platform",
    platformId: row.id,
    description: row.description,
    learningOutcomes: row.learningOutcomes,
    skillLevel: row.skillLevel,
    language: row.language,
    maxParticipants: row.maxParticipants,
    isPublished: row.isPublished,
    tpOrgStatus: row.tpStatus,
  };
}

/** HRDC / scraped directory course for admin course detail view. */
export function catalogCourseFromHrdc(
  course: TrainingCourse,
  providerName: string,
): CatalogCourse {
  const name = providerName.trim() || "Training provider";
  return {
    title: course.title.trim() || "Untitled course",
    category: course.category.trim() || "Uncategorized",
    providerCount: 1,
    providerNames: [name],
    code: course.code.trim(),
    scheme: course.scheme.trim(),
    claimable: Boolean(course.claimable),
    duration: course.duration.trim(),
    fee: course.fee.trim() || "—",
    mode: course.mode.trim(),
    source: "hrdc",
  };
}

export function platformCourseExtra(row: PlatformCourseForCatalog): AdminCourseDetailExtra {
  return {
    materialsNote: row.materialsNote,
    trainingLocation: row.trainingLocation,
    brochureUrl: row.brochureUrl ?? null,
    slidesUrl: row.slidesUrl ?? null,
    sampleMaterialsUrl: row.sampleMaterialsUrl ?? null,
    tpOrgId: row.tpOrgId,
    companyName: row.companyName,
  };
}
