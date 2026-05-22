import path from "node:path";

import { dashScopeApiKey, dashScopeMultimodalUrl } from "../config/dashscope.js";
import { execute } from "../db/query.js";
import { TP_VERIFICATION_DIR } from "../lib/uploads.js";
import { convertCertToImage } from "./cert-to-image.js";

const isoNow = () => new Date().toISOString();

function stripCodeFences(s: string): string {
  let out = s.trim();
  out = out.replace(/^```json\s*/i, "");
  out = out.replace(/^```\s*/i, "");
  out = out.replace(/```$/i, "");
  return out.trim();
}

function resolveTpVerificationFile(publicUrl: string): string {
  const prefix = "/api/uploads/tp-verification/";
  if (!publicUrl.startsWith(prefix)) {
    throw new Error("Invalid TP verification document URL");
  }
  return path.join(TP_VERIFICATION_DIR, path.basename(publicUrl));
}

async function visionExtractJson(
  prompt: string,
  base64: string,
  mimeType: string,
): Promise<Record<string, unknown>> {
  const url = dashScopeMultimodalUrl();
  const key = dashScopeApiKey();

  const body = {
    model: "qwen-vl-max",
    input: {
      messages: [
        {
          role: "user",
          content: [
            { image: `data:${mimeType};base64,${base64}` },
            { text: prompt },
          ],
        },
      ],
    },
    parameters: { max_tokens: 800 },
  };

  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 60_000);
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "X-DashScope-SSE": "disable",
      },
      body: JSON.stringify(body),
      signal: ac.signal,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`DashScope error ${resp.status}: ${text || resp.statusText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await resp.json();
    const text =
      raw?.output?.choices?.[0]?.message?.content?.[0]?.text ??
      raw?.output?.choices?.[0]?.message?.content?.text;
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("Unexpected DashScope response shape (missing text)");
    }

    return JSON.parse(stripCodeFences(text)) as Record<string, unknown>;
  } finally {
    clearTimeout(timeout);
  }
}

const SSM_EXTRACT_PROMPT = `You are reading a Malaysia SSM (Suruhanjaya Syarikat Malaysia) company registration certificate or business profile document.
Extract the company registration number (SSM number / registration no / ROC number) exactly as printed.
Respond ONLY with valid JSON. No markdown. Use this structure:
{
  "ssmNumber": "registration number or empty string",
  "summary": "one short sentence"
}`;

const HRDC_TP_REG_PROMPT = `You are reading an HRD Corp (Human Resource Development Corporation Malaysia) Training Provider registration or approval certificate.
Extract the approval/registration date and the expiry or valid-until date exactly as printed on the document.
Respond ONLY with valid JSON. No markdown. Use this structure:
{
  "approvalDate": "date as printed or empty string",
  "expiryDate": "expiry or valid-until date as printed or empty string",
  "summary": "one short sentence"
}`;

function pickDate(...values: unknown[]): string {
  for (const v of values) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

/** Background: extract SSM number and HRDC registration dates from uploaded certs. */
export async function extractTpOrgDocuments(
  orgId: string,
  ssmCertUrl: string,
  hrdcDocUrl: string,
): Promise<void> {
  try {
    const ssmFile = resolveTpVerificationFile(ssmCertUrl);
    const hrdcFile = resolveTpVerificationFile(hrdcDocUrl);
    const ssmImg = await convertCertToImage(ssmFile);
    const hrdcImg = await convertCertToImage(hrdcFile);

    const [ssmJson, hrdcJson] = await Promise.all([
      visionExtractJson(SSM_EXTRACT_PROMPT, ssmImg.base64, ssmImg.mimeType),
      visionExtractJson(HRDC_TP_REG_PROMPT, hrdcImg.base64, hrdcImg.mimeType),
    ]);

    const ssmNumber = pickDate(ssmJson.ssmNumber, ssmJson.registrationNumber, ssmJson.regNumber);
    const hrdcRegApprovedAt = pickDate(
      hrdcJson.approvalDate,
      hrdcJson.approvedAt,
      hrdcJson.registrationDate,
      hrdcJson.issueDate,
    );
    const hrdcRegExpiresAt = pickDate(
      hrdcJson.expiryDate,
      hrdcJson.expiresAt,
      hrdcJson.validUntil,
    );

    await execute(
      `UPDATE "TpOrganization"
       SET "ssmNumber" = ?,
           "hrdcRegApprovedAt" = ?,
           "hrdcRegExpiresAt" = ?,
           "updatedAt" = ?
       WHERE "id" = ?`,
      [
        ssmNumber || "—",
        hrdcRegApprovedAt || null,
        hrdcRegExpiresAt || null,
        isoNow(),
        orgId,
      ],
    );
  } catch (err) {
    console.error("extractTpOrgDocuments failed:", orgId, err);
  }
}
