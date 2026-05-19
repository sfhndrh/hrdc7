import { dashScopeApiKey, dashScopeMultimodalUrl } from "../config/dashscope.js";
import type { VerificationResult } from "../db/types.js";

function stripCodeFences(s: string): string {
  let out = s.trim();
  out = out.replace(/^```json\s*/i, "");
  out = out.replace(/^```\s*/i, "");
  out = out.replace(/```$/i, "");
  return out.trim();
}

function recommendationFrom(overallPassed: boolean, confidenceScore: number): VerificationResult["aiRecommendation"] {
  if (confidenceScore >= 85 && overallPassed) return "APPROVE";
  if (confidenceScore >= 60) return "MANUAL_REVIEW";
  return "REJECT";
}

export async function verifyHrdcCertificate(
  certBase64: string,
  certMimeType: string,
  registeredName: string,
): Promise<VerificationResult> {
  const fallback = (err: unknown): VerificationResult => {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      overallPassed: false,
      confidenceScore: 0,
      flags: ["verification_service_error"],
      certCheck: {
        isHrdcCertificate: false,
        nameOnCert: "",
        certNumber: "",
        issueDate: "",
        expiryDate: "",
        trainingDomain: "",
        isExpired: false,
        hasOfficialSeal: false,
        suspectedTampered: false,
      },
      nameMatchesRegistration: false,
      aiRecommendation: "MANUAL_REVIEW",
      summary: `Verification error: ${msg}. Admin must review manually.`,
      rawResponse: { error: msg },
    };
  };

  try {
    const url = dashScopeMultimodalUrl();
    const key = dashScopeApiKey();

    const prompt = `You are verifying an HRDC (Human Resource Development Corporation Malaysia)
trainer certificate. HRDC is a Malaysian government-linked agency that certifies
workplace trainers. Their certificates are official documents with specific
formatting, logos, and seals.
Trainer registered name: ${registeredName}
Examine the certificate image carefully and respond ONLY with a valid JSON object.
No explanation, no markdown, no code fences. Raw JSON only.
Use this exact structure:
{
"overallPassed": boolean,
"confidenceScore": number 0-100,
"flags": [],
"certCheck": {
"isHrdcCertificate": boolean,
"nameOnCert": "name exactly as printed",
"certNumber": "certificate number or empty string",
"issueDate": "date or empty string",
"expiryDate": "date or empty string",
"trainingDomain": "domain or empty string",
"isExpired": boolean,
"hasOfficialSeal": boolean,
"suspectedTampered": boolean
},
"nameMatchesRegistration": boolean,
"summary": "2-3 sentences describing the result in plain English"
}
Allowed flags:

"not_hrdc_certificate"
"cert_expired"
"name_mismatch"
"no_official_seal"
"suspected_tampered"
"low_image_quality"
"missing_key_fields"
"wrong_document_type"

Set overallPassed true only when ALL are true:
isHrdcCertificate, NOT isExpired, NOT suspectedTampered,
nameMatchesRegistration, hasOfficialSeal
Confidence scoring:
85-100: clear readable certificate, all fields visible and verified
60-84: likely valid but some fields unclear or minor concern
0-59: significant problems or unreadable`;

    const body = {
      model: "qwen-vl-max",
      input: {
        messages: [
          {
            role: "user",
            content: [
              { image: `data:${certMimeType};base64,${certBase64}` },
              { text: prompt },
            ],
          },
        ],
      },
      parameters: { max_tokens: 1000 },
    };

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 60_000);
    let raw: any;
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

      raw = await resp.json();
    } finally {
      clearTimeout(timeout);
    }

    if (process.env.NODE_ENV !== "production") {
      // Helpful for prompt/format debugging during development only.
      console.log("Qwen raw response:", JSON.stringify(raw, null, 2));
    }

    const text =
      raw?.output?.choices?.[0]?.message?.content?.[0]?.text ??
      raw?.output?.choices?.[0]?.message?.content?.text;
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("Unexpected DashScope response shape (missing text)");
    }

    const cleaned = stripCodeFences(text);
    const parsed = JSON.parse(cleaned) as Omit<VerificationResult, "aiRecommendation" | "rawResponse"> & {
      rawResponse?: object;
    };

    const overallPassed = Boolean((parsed as any).overallPassed);
    const confidenceScore = Number((parsed as any).confidenceScore ?? 0);
    const flags = Array.isArray((parsed as any).flags) ? (parsed as any).flags.map(String) : [];
    const certCheck = (parsed as any).certCheck ?? {};

    const result: VerificationResult = {
      overallPassed,
      confidenceScore: Number.isFinite(confidenceScore) ? confidenceScore : 0,
      flags,
      certCheck: {
        isHrdcCertificate: Boolean(certCheck.isHrdcCertificate),
        nameOnCert: String(certCheck.nameOnCert ?? ""),
        certNumber: String(certCheck.certNumber ?? ""),
        issueDate: String(certCheck.issueDate ?? ""),
        expiryDate: String(certCheck.expiryDate ?? ""),
        trainingDomain: String(certCheck.trainingDomain ?? ""),
        isExpired: Boolean(certCheck.isExpired),
        hasOfficialSeal: Boolean(certCheck.hasOfficialSeal),
        suspectedTampered: Boolean(certCheck.suspectedTampered),
      },
      nameMatchesRegistration: Boolean((parsed as any).nameMatchesRegistration),
      aiRecommendation: recommendationFrom(overallPassed, confidenceScore),
      summary: String((parsed as any).summary ?? ""),
      rawResponse: raw,
    };

    return result;
  } catch (err) {
    return fallback(err);
  }
}

