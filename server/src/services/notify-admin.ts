import nodemailer from "nodemailer";
import { Resend } from "resend";

import { execute } from "../db/query.js";
import { newId } from "../db/ids.js";
import type { VerificationResult } from "../db/types.js";

const isoNow = () => new Date().toISOString();

async function sendAdminEmail(subject: string, text: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) return;

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const resend = new Resend(resendKey);
    const from =
      process.env.RESEND_FROM?.trim() || "HRDC Trainer <onboarding@resend.dev>";
    await resend.emails.send({ from, to: adminEmail, subject, text });
    return;
  }

  const smtpHost = process.env.SMTP_HOST?.trim();
  if (!smtpHost) return;

  const smtpPort = Number(process.env.SMTP_PORT ?? 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  });

  await transporter.sendMail({
    from: smtpUser ? smtpUser : "no-reply@hrdctrainer.local",
    to: adminEmail,
    subject,
    text,
  });
}

export async function notifyAdminVerification(
  trainerId: string,
  trainerName: string,
  result: VerificationResult,
): Promise<void> {
  try {
    const title =
      result.aiRecommendation === "APPROVE"
        ? "✅ Certificate verified — ready to approve"
        : result.aiRecommendation === "REJECT"
          ? "❌ Certificate verification failed — action required"
          : "⚠️ Certificate needs manual review";

    const body = `Trainer: ${trainerName}
ID: ${trainerId}
Confidence: ${result.confidenceScore}/100
AI Recommendation: ${result.aiRecommendation}
Flags: ${result.flags.length ? result.flags.join(", ") : "None"}
AI Analysis:
${result.summary}
Review this trainer:
/admin/trainers/${trainerId}/review`;

    await execute(
      `
      INSERT INTO notifications (id, type, title, body, trainer_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, false, ?)
    `,
      [newId(), "VERIFICATION_COMPLETE", title, body, trainerId, isoNow()],
    );

    try {
      await sendAdminEmail(title, body);
    } catch (err) {
      console.error("Admin email notification failed:", err);
    }
  } catch (err) {
    console.error("notifyAdminVerification failed:", err);
  }
}
