/** Delimiters for course-inquiry attachments embedded in chat message bodies. */
export const COURSE_INQUIRY_START = "[[course-inquiry]]";
export const COURSE_INQUIRY_END = "[[/course-inquiry]]";

export type CourseInquiryFields = {
  id: string;
  title: string;
  courseCode: string;
  category: string;
  providerName: string;
  duration: string;
  deliveryMode: string;
  hrdcClaimable: string;
  courseFee: number;
  language: string;
  skillLevel: string;
  trainingLocation: string | null;
};

export function buildCourseInquiryMessage(
  course: CourseInquiryFields,
  intro = "Hi, I'd like to ask about this course.",
): string {
  const fee =
    course.courseFee > 0
      ? `RM ${course.courseFee.toLocaleString("en-MY")}`
      : "Contact for pricing";
  const lines = [
    COURSE_INQUIRY_START,
    `id: ${course.id}`,
    `title: ${course.title}`,
    `code: ${course.courseCode || "—"}`,
    `category: ${course.category || "—"}`,
    `provider: ${course.providerName}`,
    `duration: ${course.duration || "—"}`,
    `fee: ${fee}`,
    `delivery: ${course.deliveryMode || "—"}`,
    `hrdc: ${course.hrdcClaimable || "—"}`,
    `language: ${course.language || "—"}`,
    `level: ${course.skillLevel || "—"}`,
    `location: ${course.trainingLocation || "—"}`,
    COURSE_INQUIRY_END,
    "",
    intro.trim(),
  ];
  return lines.join("\n");
}
