import "../load-env.js";
import express from "express";
import path from "node:path";
import fs from "node:fs";

import { resolveHrdcCertPath } from "../lib/uploads.js";
import { execute, queryOne, withTransaction } from "../db/query.js";
import { newId } from "../db/ids.js";
import { convertCertToImage } from "../services/cert-to-image.js";
import { verifyHrdcCertificate } from "../services/qwen-verify.js";
import { notifyAdminVerification } from "../services/notify-admin.js";

const router = express.Router();

router.post("/verify", async (req, res) => {
  const { trainerId, force } = (req.body ?? {}) as {
    trainerId?: string;
    force?: boolean;
  };

  if (!trainerId) {
    res.status(400).json({ error: "trainerId is required" });
    return;
  }

  const trainer = await queryOne<Record<string, unknown>>(
    `SELECT * FROM "Trainer" WHERE "id" = ?`,
    [trainerId],
  );

  if (!trainer) {
    res.status(404).json({ error: "Trainer not found" });
    return;
  }

  if (!force && trainer.status !== "PENDING") {
    res.status(200).json({ message: "Already processed" });
    return;
  }

  await execute(`UPDATE "Trainer" SET "status" = 'UNDER_REVIEW' WHERE "id" = ?`, [
    trainerId,
  ]);

  try {
    const certFileUrl = String(trainer.certFileUrl ?? "");
    if (!certFileUrl) throw new Error("Certificate file not found");

    const filename = path.basename(certFileUrl);
    const certPath = resolveHrdcCertPath(filename);

    if (!fs.existsSync(certPath)) {
      throw new Error("Certificate file not found");
    }

    const { base64, mimeType } = await convertCertToImage(certPath);
    const result = await verifyHrdcCertificate(
      base64,
      mimeType,
      String(trainer.fullName ?? ""),
    );

    await withTransaction(async (client) => {
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM ai_verification WHERE trainer_id = ?`,
        [trainerId],
        client,
      );

      const verificationData = {
        overallPassed: result.overallPassed,
        confidenceScore: result.confidenceScore,
        flags: JSON.stringify(result.flags),
        certIsHrdc: result.certCheck.isHrdcCertificate,
        certName: result.certCheck.nameOnCert,
        certNumber: result.certCheck.certNumber,
        certIssueDate: result.certCheck.issueDate,
        certExpiryDate: result.certCheck.expiryDate,
        certDomain: result.certCheck.trainingDomain,
        certExpired: result.certCheck.isExpired,
        certHasSeal: result.certCheck.hasOfficialSeal,
        certTampered: result.certCheck.suspectedTampered,
        nameMatchesReg: result.nameMatchesRegistration,
        aiRecommendation: result.aiRecommendation,
        summary: result.summary,
        rawResponse: JSON.stringify(result.rawResponse),
      };

      if (existing) {
        await execute(
          `
          UPDATE ai_verification SET
            overall_passed=?, confidence_score=?, flags=?, cert_is_hrdc=?,
            cert_name=?, cert_number=?, cert_issue_date=?, cert_expiry_date=?,
            cert_domain=?, cert_expired=?, cert_has_seal=?, cert_tampered=?,
            name_matches_reg=?, ai_recommendation=?, summary=?, raw_response=?
          WHERE trainer_id=?
        `,
          [
            verificationData.overallPassed,
            verificationData.confidenceScore,
            verificationData.flags,
            verificationData.certIsHrdc,
            verificationData.certName,
            verificationData.certNumber,
            verificationData.certIssueDate,
            verificationData.certExpiryDate,
            verificationData.certDomain,
            verificationData.certExpired,
            verificationData.certHasSeal,
            verificationData.certTampered,
            verificationData.nameMatchesReg,
            verificationData.aiRecommendation,
            verificationData.summary,
            verificationData.rawResponse,
            trainerId,
          ],
          client,
        );
      } else {
        await execute(
          `
          INSERT INTO ai_verification (
            id, trainer_id, overall_passed, confidence_score, flags, cert_is_hrdc,
            cert_name, cert_number, cert_issue_date, cert_expiry_date, cert_domain,
            cert_expired, cert_has_seal, cert_tampered, name_matches_reg,
            ai_recommendation, summary, raw_response
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `,
          [
            newId(),
            trainerId,
            verificationData.overallPassed,
            verificationData.confidenceScore,
            verificationData.flags,
            verificationData.certIsHrdc,
            verificationData.certName,
            verificationData.certNumber,
            verificationData.certIssueDate,
            verificationData.certExpiryDate,
            verificationData.certDomain,
            verificationData.certExpired,
            verificationData.certHasSeal,
            verificationData.certTampered,
            verificationData.nameMatchesReg,
            verificationData.aiRecommendation,
            verificationData.summary,
            verificationData.rawResponse,
          ],
          client,
        );
      }

      await execute(`UPDATE "Trainer" SET "ai_recommendation" = ? WHERE "id" = ?`, [
        result.aiRecommendation,
        trainerId,
      ], client);
    });

    await notifyAdminVerification(trainerId, String(trainer.fullName ?? ""), result);

    res.status(200).json({
      success: true,
      aiRecommendation: result.aiRecommendation,
      confidenceScore: result.confidenceScore,
      flagsFound: result.flags,
    });
  } catch (err) {
    console.error("Verification failed:", err);
    await execute(`UPDATE "Trainer" SET "status" = 'PENDING' WHERE "id" = ?`, [trainerId]);
    const msg = err instanceof Error ? err.message : "Verification failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
