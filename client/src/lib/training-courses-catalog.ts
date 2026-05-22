import type { TrainingCourse, TrainingProvider } from "@/lib/training-providers";

export type CatalogCourse = {
  title: string;
  category: string;
  providerCount: number;
  providerNames: string[];
  code: string;
  scheme: string;
  claimable: boolean;
  duration: string;
  fee: string;
  mode: string;
  /** HRDC scraped catalog vs platform training provider */
  source?: "hrdc" | "platform";
  platformId?: string;
  description?: string;
  learningOutcomes?: string;
  skillLevel?: string;
  language?: string;
  maxParticipants?: number;
  isPublished?: boolean;
  tpOrgStatus?: string;
};

export type PlatformCourseForCatalog = {
  id: string;
  title: string;
  courseCode: string;
  category: string;
  description: string;
  learningOutcomes: string;
  duration: string;
  deliveryMode: string;
  hrdcClaimable: string;
  courseFee: number;
  maxParticipants: number;
  language: string;
  skillLevel: string;
  trainingLocation: string | null;
  isPublished: boolean;
  companyName: string;
  tpStatus?: string;
  tpOrgId?: string;
  materialsNote?: string | null;
  trainingLocation?: string | null;
  brochureUrl?: string | null;
  slidesUrl?: string | null;
  sampleMaterialsUrl?: string | null;
};

export type CatalogCategory = {
  name: string;
  courses: CatalogCourse[];
};

function normalizeCategory(category: string): string {
  const trimmed = category.trim();
  return trimmed || "Uncategorized";
}

function providerKey(provider: TrainingProvider): string {
  return provider.registrationNo.trim() || provider.name.trim();
}

export function buildCoursesCatalog(providers: TrainingProvider[]): CatalogCategory[] {
  const byCategory = new Map<
    string,
    Map<
      string,
      {
        course: TrainingCourse;
        providers: Map<string, string>;
      }
    >
  >();

  for (const provider of providers) {
    const key = providerKey(provider);
    if (!key) continue;

    for (const course of provider.courses) {
      const title = course.title.trim();
      if (!title) continue;

      const category = normalizeCategory(course.category);
      let byTitle = byCategory.get(category);
      if (!byTitle) {
        byTitle = new Map();
        byCategory.set(category, byTitle);
      }

      let entry = byTitle.get(title);
      if (!entry) {
        entry = { course, providers: new Map() };
        byTitle.set(title, entry);
      }
      entry.providers.set(key, provider.name.trim() || key);
    }
  }

  const categories: CatalogCategory[] = [];

  for (const [name, byTitle] of byCategory) {
    const courses: CatalogCourse[] = [...byTitle.entries()]
      .map(([title, entry]) => ({
        title,
        category: name,
        providerCount: entry.providers.size,
        providerNames: [...entry.providers.values()].sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" }),
        ),
        code: entry.course.code,
        scheme: entry.course.scheme,
        claimable: entry.course.claimable,
        duration: entry.course.duration,
        fee: entry.course.fee,
        mode: entry.course.mode,
        source: "hrdc",
      }))
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));

    categories.push({ name, courses });
  }

  categories.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return categories;
}

export function buildPlatformCoursesCatalog(courses: PlatformCourseForCatalog[]): CatalogCategory[] {
  const byCategory = new Map<string, CatalogCourse[]>();

  for (const c of courses) {
    const category = normalizeCategory(c.category);
    const list = byCategory.get(category) ?? [];
    list.push({
      title: c.title.trim(),
      category,
      providerCount: 1,
      providerNames: [c.companyName.trim() || "Training provider"],
      code: c.courseCode.trim(),
      scheme: c.skillLevel.trim(),
      claimable: c.hrdcClaimable === "Yes",
      duration: c.duration.trim(),
      fee: c.courseFee > 0 ? `RM ${c.courseFee.toLocaleString("en-MY")}` : "—",
      mode: c.deliveryMode.trim(),
      source: "platform",
      platformId: c.id,
      description: c.description,
      learningOutcomes: c.learningOutcomes,
      skillLevel: c.skillLevel,
      language: c.language,
      maxParticipants: c.maxParticipants,
      isPublished: c.isPublished,
      tpOrgStatus: c.tpStatus,
    });
    byCategory.set(category, list);
  }

  const categories: CatalogCategory[] = [];
  for (const [name, catCourses] of byCategory) {
    catCourses.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );
    categories.push({ name, courses: catCourses });
  }
  categories.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return categories;
}

export function mergeCourseCatalogs(
  hrdc: CatalogCategory[],
  platform: CatalogCategory[],
): CatalogCategory[] {
  const map = new Map<string, CatalogCourse[]>();

  for (const cat of hrdc) {
    const prev = map.get(cat.name) ?? [];
    map.set(cat.name, [...prev, ...cat.courses]);
  }
  for (const cat of platform) {
    const prev = map.get(cat.name) ?? [];
    map.set(cat.name, [...prev, ...cat.courses]);
  }

  const categories: CatalogCategory[] = [];
  for (const [name, courses] of map) {
    courses.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
    categories.push({ name, courses });
  }
  categories.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return categories;
}

export function filterCoursesCatalog(
  categories: CatalogCategory[],
  query: string,
): CatalogCategory[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return categories;

  return categories
    .map((category) => ({
      ...category,
      courses: category.courses.filter((course) => {
        const hay = `${course.title} ${course.category} ${course.code} ${course.scheme} ${course.providerNames.join(" ")}`.toLowerCase();
        return hay.includes(needle);
      }),
    }))
    .filter((category) => category.courses.length > 0);
}
