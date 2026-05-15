// Run with: npx tsx server/scripts/test-qwen.ts
// Place any certificate image at server/scripts/test-cert.jpg (or .png/.pdf) before running

import { convertCertToImage } from "../src/services/cert-to-image.js";
import { verifyHrdcCertificate } from "../src/services/qwen-verify.js";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
  console.log("Testing Qwen-VL certificate verification...\n");

  if (!process.env.DASHSCOPE_API_KEY) {
    console.error("ERROR: DASHSCOPE_API_KEY not set in server/.env");
    process.exit(1);
  }

  const candidates = ["test-cert.jpg", "test-cert.png", "test-cert.pdf"].map((f) =>
    path.join(__dirname, f),
  );
  const testCertPath = candidates.find((p) => fs.existsSync(p));
  if (!testCertPath) {
    console.error(
      "ERROR: Place a certificate file at server/scripts/test-cert.jpg (or .png/.pdf) and rerun.",
    );
    process.exit(1);
  }

  console.log("Step 1: Converting certificate to image...");
  const { base64, mimeType } = await convertCertToImage(testCertPath);
  console.log(`Converted. MimeType: ${mimeType}, Base64 length: ${base64.length}\n`);

  console.log("Step 2: Calling Qwen-VL API...");
  const result = await verifyHrdcCertificate(base64, mimeType, "Test Trainer Name");

  console.log("\n=== VERIFICATION RESULT ===");
  console.log(JSON.stringify(result, null, 2));
  console.log("\n=== SUMMARY ===");
  console.log(`Passed: ${result.overallPassed}`);
  console.log(`Confidence: ${result.confidenceScore}/100`);
  console.log(`Recommendation: ${result.aiRecommendation}`);
  console.log(`Flags: ${result.flags.join(", ") || "None"}`);
}

main().catch(console.error);

