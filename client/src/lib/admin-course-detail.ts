import type { AdminCourseDetailExtra } from "@/components/admin/admin-course-detail-content";
import type { CatalogCourse, PlatformCourseForCatalog } from "@/lib/training-courses-catalog";

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
