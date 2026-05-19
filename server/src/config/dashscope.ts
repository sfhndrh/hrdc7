/** DashScope / Qwen API hosts (Alibaba Model Studio). */
export function dashScopeApiKey(): string {
  const key = process.env.DASHSCOPE_API_KEY?.trim();
  if (!key) throw new Error("DASHSCOPE_API_KEY not set");
  return key;
}

/** OpenAI-compatible chat (text JSON) — training provider scraper. */
export function dashScopeCompatBaseUrl(): string {
  return (
    process.env.DASHSCOPE_COMPAT_URL?.trim() ||
    defaultDashScopeOrigin() + "/compatible-mode/v1"
  ).replace(/\/$/, "");
}

/**
 * Native multimodal API (qwen-vl-max) — HRDC certificate vision verification.
 * Override with DASHSCOPE_API_URL if needed.
 */
export function dashScopeMultimodalUrl(): string {
  const explicit = process.env.DASHSCOPE_API_URL?.trim();
  if (explicit) return explicit;
  return `${defaultDashScopeOrigin()}/api/v1/services/aigc/multimodal-generation/generation`;
}

function defaultDashScopeOrigin(): string {
  const base = process.env.DASHSCOPE_BASE_URL?.trim();
  if (base) return base.replace(/\/$/, "");
  // intl keys (common outside mainland China) vs cn endpoint
  if (process.env.DASHSCOPE_REGION?.trim().toLowerCase() === "cn") {
    return "https://dashscope.aliyuncs.com";
  }
  return "https://dashscope-intl.aliyuncs.com";
}
