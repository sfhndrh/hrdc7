"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatMessageBody } from "@/components/messaging/course-inquiry-message";
import { apiFetch } from "@/lib/api";
import { isCourseInquiryMessage } from "@/lib/course-message-attachment";
import { Button } from "@/components/ui/button";

type ViewerRole = "tp" | "trainer" | "client";

type ApiMessage = {
  id: string;
  senderRole: "TP" | "TRAINER" | "CLIENT";
  body: string;
  sentAt: string;
};

type ApiConversation = {
  id: string;
  channel?: "trainer" | "client";
  trainerId?: string;
  trainerName?: string;
  trainerTitle?: string;
  clientId?: string;
  clientCompanyName?: string;
  clientContactName?: string;
  tpOrgId?: string;
  tpCompanyName?: string;
  lastMessage?: ApiMessage | null;
  updatedAt: string;
};

type UiConversation = {
  id: string;
  peerName: string;
  peerSubtitle: string;
  messages: ApiMessage[];
  preview?: ApiMessage | null;
};

export type StartPeerState = {
  id: string;
  name: string;
  subtitle?: string;
  /** Opens chat with training provider and attaches course details. */
  courseId?: string;
  intro?: string;
};

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return (p[0]?.slice(0, 2) ?? "?").toUpperCase();
}

function formatListTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDayLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) return "Today";
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  const yesterday =
    d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate();
  if (yesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function apiBase(viewer: ViewerRole) {
  if (viewer === "tp") return "/api/tp/messages";
  if (viewer === "client") return "/api/client/messages";
  return "/api/trainer/messages";
}

function mapListItem(viewer: ViewerRole, row: ApiConversation): UiConversation {
  if (viewer === "tp") {
    const isEmployer = row.channel === "client";
    return {
      id: row.id,
      peerName: isEmployer
        ? (row.clientCompanyName ?? row.clientContactName ?? "Employer")
        : (row.trainerName ?? "Trainer"),
      peerSubtitle: isEmployer ? "Employer" : (row.trainerTitle ?? "Certified trainer"),
      messages: [],
      preview: row.lastMessage ?? null,
    };
  }
  return {
    id: row.id,
    peerName: row.tpCompanyName ?? "Training provider",
    peerSubtitle: "Training provider",
    messages: [],
    preview: row.lastMessage ?? null,
  };
}

function previewText(body: string) {
  if (isCourseInquiryMessage(body)) return "Course details attached";
  return body;
}

function lastMessage(conv: UiConversation): ApiMessage | undefined {
  const fromThread = conv.messages[conv.messages.length - 1];
  return fromThread ?? conv.preview ?? undefined;
}

export function TpTrainerMessagesPanel({
  viewer,
  startPeer,
  onStartPeerHandled,
}: {
  viewer: ViewerRole;
  startPeer?: StartPeerState | null;
  onStartPeerHandled?: () => void;
}) {
  const [conversations, setConversations] = useState<UiConversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startHandledRef = useRef(false);

  const mySenderRole: ApiMessage["senderRole"] =
    viewer === "tp" ? "TP" : viewer === "client" ? "CLIENT" : "TRAINER";

  const loadList = useCallback(() => {
    setLoadingList(true);
    setError(null);
    void apiFetch(apiBase(viewer), { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? `Failed to load (${r.status})`);
        }
        return (await r.json()) as { conversations: ApiConversation[] };
      })
      .then((d) => {
        setConversations((d.conversations ?? []).map((c) => mapListItem(viewer, c)));
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load messages.");
        setConversations([]);
      })
      .finally(() => setLoadingList(false));
  }, [viewer]);

  const loadThread = useCallback(
    (conversationId: string) => {
      setLoadingThread(true);
      setError(null);
      void apiFetch(`${apiBase(viewer)}/${encodeURIComponent(conversationId)}`, {
        credentials: "include",
      })
        .then(async (r) => {
          if (!r.ok) {
            const j = (await r.json().catch(() => ({}))) as { error?: string };
            throw new Error(j.error ?? `Failed to load (${r.status})`);
          }
          return (await r.json()) as { messages: ApiMessage[] };
        })
        .then((d) => {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId ? { ...c, messages: d.messages ?? [] } : c,
            ),
          );
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Failed to load conversation.");
        })
        .finally(() => setLoadingThread(false));
    },
    [viewer],
  );

  const openWithPeer = useCallback(
    async (peer: StartPeerState) => {
      setError(null);
      const payload =
        viewer === "tp"
          ? { trainerId: peer.id }
          : {
              tpOrgId: peer.id,
              ...(peer.courseId ? { courseId: peer.courseId } : {}),
              ...(peer.intro ? { intro: peer.intro } : {}),
            };
      const body = JSON.stringify(payload);
      const r = await apiFetch(`${apiBase(viewer)}/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body,
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Could not start conversation.");
      }
      const d = (await r.json()) as {
        conversation: { id: string };
        messages: ApiMessage[];
      };
      const ui: UiConversation = {
        id: d.conversation.id,
        peerName: peer.name,
        peerSubtitle:
          peer.subtitle ??
          (viewer === "tp"
            ? "Certified trainer"
            : viewer === "client"
              ? "Training provider"
              : "Training provider"),
        messages: d.messages ?? [],
        preview: d.messages?.[d.messages.length - 1] ?? null,
      };
      setConversations((prev) => {
        const rest = prev.filter((c) => c.id !== ui.id);
        return [ui, ...rest];
      });
      setSelectedId(ui.id);
      setMobileThreadOpen(true);
      void loadList();
    },
    [viewer, loadList],
  );

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (!startPeer || startHandledRef.current) return;
    startHandledRef.current = true;
    void openWithPeer(startPeer)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not open conversation.");
      })
      .finally(() => onStartPeerHandled?.());
  }, [startPeer, openWithPeer, onStartPeerHandled]);

  useEffect(() => {
    if (!selectedId) return;
    const conv = conversations.find((c) => c.id === selectedId);
    if (conv && conv.messages.length === 0) {
      loadThread(selectedId);
    }
  }, [selectedId, conversations, loadThread]);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const ta = new Date(lastMessage(a)?.sentAt ?? 0).getTime();
      const tb = new Date(lastMessage(b)?.sentAt ?? 0).getTime();
      return tb - ta;
    });
  }, [conversations]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || !selectedId) return;
    setSending(true);
    setError(null);
    try {
      const r = await apiFetch(
        `${apiBase(viewer)}/${encodeURIComponent(selectedId)}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ body: text }),
        },
      );
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Send failed");
      }
      const d = (await r.json()) as { message: ApiMessage };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, messages: [...c.messages, d.message], preview: d.message }
            : c,
        ),
      );
      setDraft("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setSending(false);
    }
  }, [draft, selectedId, viewer]);

  const peerRoleLabel =
    viewer === "tp"
      ? selected?.peerSubtitle === "Employer"
        ? "Employer"
        : "Trainer"
      : "Training provider";

  return (
    <div className="flex h-[min(720px,calc(100vh-9.5rem))] min-h-[380px] flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm md:h-[calc(100vh-10.25rem)]">
      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          className={`flex w-full shrink-0 flex-col border-[color:var(--border)] md:w-[min(100%,320px)] md:border-r ${
            mobileThreadOpen ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="border-b border-[color:var(--border)] px-4 py-3">
            <p className="text-sm font-bold text-[color:var(--text)]">Chats</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="px-4 py-8 text-center text-xs text-[color:var(--text-muted)]">Loading…</div>
            ) : sortedConversations.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[color:var(--text-muted)]">
                {viewer === "client"
                  ? "No conversations yet. Contact a training provider from a course page."
                  : viewer === "tp"
                    ? "No conversations yet. Message a trainer or employer will appear here."
                    : "No conversations yet. Message a training provider from the Courses page."}
              </div>
            ) : null}
            {sortedConversations.map((conv) => {
              const last = lastMessage(conv);
              const active = conv.id === selectedId;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(conv.id);
                    setMobileThreadOpen(true);
                  }}
                  className={`flex w-full gap-3 border-b border-[color:var(--border)] px-4 py-3 text-left transition-colors hover:bg-[color:var(--surface-muted)] ${
                    active ? "bg-[color:var(--surface-muted)]" : ""
                  }`}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#818cf8] to-[var(--primary)] text-xs font-semibold text-white">
                    {initials(conv.peerName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[color:var(--text)]">
                        {conv.peerName}
                      </span>
                      {last ? (
                        <span className="shrink-0 text-[11px] text-[color:var(--text-muted)]">
                          {formatListTime(last.sentAt)}
                        </span>
                      ) : null}
                    </div>
                    {last ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-[color:var(--text-muted)]">
                        {previewText(last.body)}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs italic text-[color:var(--text-muted)]">No messages yet</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section
          className={`flex min-h-0 min-w-0 flex-1 flex-col bg-[color:var(--chat-pane-bg)] ${
            mobileThreadOpen ? "flex" : "hidden md:flex"
          }`}
        >
          {selected ? (
            <>
              <header className="flex shrink-0 items-center gap-3 border-b border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-3 md:px-4">
                <button
                  type="button"
                  className="rounded-lg p-2 text-[color:var(--text-muted)] hover:bg-[color:var(--surface-muted)] md:hidden"
                  aria-label="Back to conversations"
                  onClick={() => setMobileThreadOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[color:var(--text)]">{selected.peerName}</div>
                  <div className="text-[11px] text-[color:var(--text-muted)]">{peerRoleLabel}</div>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 md:px-5">
                {loadingThread ? (
                  <p className="text-center text-xs text-[color:var(--text-muted)]">Loading messages…</p>
                ) : null}
                {selected.messages.map((msg, idx) => {
                  const prev = selected.messages[idx - 1];
                  const showDay =
                    !prev || formatDayLabel(prev.sentAt) !== formatDayLabel(msg.sentAt);
                  const isMine = msg.senderRole === mySenderRole;
                  return (
                    <div key={msg.id}>
                      {showDay ? (
                        <div className="mb-3 flex justify-center">
                          <span className="rounded-full bg-[color:var(--border)]/60 px-3 py-1 text-[11px] font-medium text-[color:var(--text-muted)]">
                            {formatDayLabel(msg.sentAt)}
                          </span>
                        </div>
                      ) : null}
                      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[min(100%,420px)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                            isMine
                              ? "rounded-br-md bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                              : "rounded-bl-md border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)]"
                          }`}
                        >
                          <ChatMessageBody body={msg.body} isMine={isMine} />
                          <div
                            className={`mt-1 text-[10px] ${
                              isMine ? "text-white/80" : "text-[color:var(--text-muted)]"
                            }`}
                          >
                            {formatListTime(msg.sentAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <footer className="shrink-0 border-t border-[color:var(--border)] bg-[color:var(--surface)] p-3 md:p-4">
                <div className="flex gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    rows={2}
                    placeholder="Write a message…"
                    disabled={sending}
                    className="min-h-[44px] flex-1 resize-none rounded-xl border border-[color:var(--border)] bg-[color:var(--topbar-input-bg)] px-3 py-2.5 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    aria-label="Message text"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    className="self-end shrink-0"
                    disabled={sending}
                    onClick={() => void send()}
                  >
                    {sending ? "Sending…" : "Send"}
                  </Button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[color:var(--text-muted)]">
              <p className="font-medium text-[color:var(--text)]">No conversation selected</p>
              <p className="text-xs">
                {viewer === "client"
                  ? "Choose a chat or contact a provider from a course."
                  : viewer === "tp"
                    ? "Choose a chat from your list."
                    : "Choose a chat or start one from the Courses page."}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
