export function serperApiKey(): string {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) throw new Error("SERPER_API_KEY is not configured");
  return key;
}

export function serperConfigured(): boolean {
  return Boolean(process.env.SERPER_API_KEY?.trim());
}
