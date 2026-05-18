function stripCodeFences(s: string): string {
  let out = s.trim();
  out = out.replace(/^```json\s*/i, "");
  out = out.replace(/^```\s*/i, "");
  out = out.replace(/```$/i, "");
  return out.trim();
}

function dashScopeBaseUrl(): string {
  return (
    process.env.DASHSCOPE_COMPAT_URL?.trim() ||
    "https://dashscope.aliyuncs.com/compatible-mode/v1"
  ).replace(/\/$/, "");
}

function qwenModel(): string {
  return process.env.QWEN_MODEL?.trim() || "qwen-plus-latest";
}

export async function qwenJsonCompletion<T>(prompt: string): Promise<T> {
  const key = process.env.DASHSCOPE_API_KEY?.trim();
  if (!key) throw new Error("DASHSCOPE_API_KEY not set");

  const url = `${dashScopeBaseUrl()}/chat/completions`;
  const body = {
    model: qwenModel(),
    temperature: 0.1,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 120_000);
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: ac.signal,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`DashScope error ${resp.status}: ${text || resp.statusText}`);
    }

    const raw = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = raw?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("Unexpected DashScope response (missing message content)");
    }

    const cleaned = stripCodeFences(text);
    return JSON.parse(cleaned) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export { qwenModel };
