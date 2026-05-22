export const COURSE_INQUIRY_START = "[[course-inquiry]]";
export const COURSE_INQUIRY_END = "[[/course-inquiry]]";

export type ParsedCourseInquiry = {
  id?: string;
  title: string;
  code: string;
  category: string;
  provider: string;
  duration: string;
  fee: string;
  delivery: string;
  hrdc: string;
  language: string;
  level: string;
  location: string;
  intro: string;
};

export function parseCourseInquiryMessage(body: string): ParsedCourseInquiry | null {
  const start = body.indexOf(COURSE_INQUIRY_START);
  const end = body.indexOf(COURSE_INQUIRY_END);
  if (start === -1 || end === -1 || end <= start) return null;

  const block = body.slice(start + COURSE_INQUIRY_START.length, end).trim();
  const intro = body.slice(end + COURSE_INQUIRY_END.length).trim();

  const fields: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key) fields[key] = value;
  }

  return {
    id: fields.id,
    title: fields.title || "Course",
    code: fields.code || "—",
    category: fields.category || "—",
    provider: fields.provider || "—",
    duration: fields.duration || "—",
    fee: fields.fee || "—",
    delivery: fields.delivery || "—",
    hrdc: fields.hrdc || "—",
    language: fields.language || "—",
    level: fields.level || "—",
    location: fields.location || "—",
    intro,
  };
}

export function isCourseInquiryMessage(body: string): boolean {
  return body.includes(COURSE_INQUIRY_START) && body.includes(COURSE_INQUIRY_END);
}
