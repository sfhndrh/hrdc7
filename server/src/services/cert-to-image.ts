/**
 * PDF → image via pdf2pic (GraphicsMagick/ImageMagick) + Ghostscript.
 *
 * Railway: install Ghostscript (see server/nixpacks.toml). Without `gs` on PATH,
 * PDF verification fails — users can upload PNG/JPEG certificates instead.
 * Future: replace with a pure-JS PDF renderer or an external conversion API.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fromPath } from "pdf2pic";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export async function convertCertToImage(
  filePath: string,
): Promise<{ base64: string; mimeType: string }> {
  try {
    const ext = path.extname(filePath).toLowerCase();

    if (IMAGE_EXTS.has(ext)) {
      const buf = await fs.promises.readFile(filePath);
      const mimeType =
        ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
      return { base64: buf.toString("base64"), mimeType };
    }

    if (ext === ".pdf") {
      const tempDir = path.join(os.tmpdir(), "cert-convert");
      await fs.promises.mkdir(tempDir, { recursive: true });

      const convert = fromPath(filePath, {
        density: 200,
        format: "png",
        width: 1200,
        height: 1600,
        saveFilename: "cert-temp",
        savePath: tempDir,
      });

      const result = await convert(1);
      const outPath = (result as { path?: string }).path;
      if (!outPath) {
        throw new Error("PDF conversion did not produce an output file");
      }

      const outBuf = await fs.promises.readFile(outPath);
      await fs.promises.rm(outPath, { force: true });

      return { base64: outBuf.toString("base64"), mimeType: "image/png" };
    }

    throw new Error(`Unsupported certificate file type: ${ext || "(no extension)"}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to convert certificate: ${msg}`);
  }
}

