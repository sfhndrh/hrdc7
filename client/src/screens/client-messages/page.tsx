import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { Button } from "@/components/ui/button";

type StartTrainerState = {
  startTrainer?: {
    id: string;
    name: string;
    title?: string | null;
  };
};

type ChatRole = "client" | "trainer";

type ChatMessage = {
  id: string;
  role: ChatRole;
  body: string;
  sentAt: string;
};

type Conversation = {
  id: string;
  trainerName: string;
  trainerTitle: string;
  messages: ChatMessage[];
};

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return (p[0]?.slice(0, 2) ?? "?").toUpperCase();
}

function lastMessage(conv: Conversation): ChatMessage | undefined {
  return conv.messages[conv.messages.length - 1];
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

export default function ClientMessagesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const previousSelectedIdRef = useRef<string>("");

  // Open or focus a draft conversation when arriving from a trainer profile.
  useEffect(() => {
    const state = (location.state ?? null) as StartTrainerState | null;
    const start = state?.startTrainer;
    if (!start) return;
    const draftId = `trainer-${start.id}`;
    setConversations((prev) =>
      prev.some((c) => c.id === draftId)
        ? prev
        : [
            ...prev,
            {
              id: draftId,
              trainerName: start.name,
              trainerTitle: start.title ?? "Trainer",
              messages: [],
            },
          ],
    );
    setSelectedId(draftId);
    setMobileThreadOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  // Drop empty drafts when the user moves to another conversation.
  useEffect(() => {
    const previous = previousSelectedIdRef.current;
    previousSelectedIdRef.current = selectedId;
    if (!previous || previous === selectedId) return;
    setConversations((prev) =>
      prev.filter((c) => c.id !== previous || c.messages.length > 0),
    );
  }, [selectedId]);

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

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text || !selectedId) return;
    const now = new Date().toISOString();
    const newMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "client",
      body: text,
      sentAt: now,
    };
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, messages: [...c.messages, newMsg] } : c)),
    );
    setDraft("");
  }, [draft, selectedId]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Messages" icon={<InboxIcon />} />
      <div className="flex h-[min(720px,calc(100vh-9.5rem))] min-h-[380px] flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm md:h-[calc(100vh-10.25rem)]">
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Conversation list */}
          <aside
            className={`flex w-full shrink-0 flex-col border-[color:var(--border)] md:w-[min(100%,320px)] md:border-r ${
              mobileThreadOpen ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="border-b border-[color:var(--border)] px-4 py-3">
              <p className="text-sm font-bold text-[color:var(--text)]">Chat</p>
            </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {sortedConversations.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[color:var(--text-muted)]">
                No conversations yet.
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
                    {initials(conv.trainerName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[color:var(--text)]">
                        {conv.trainerName}
                      </span>
                      {last ? (
                        <span className="shrink-0 text-[11px] text-[color:var(--text-muted)]">
                          {formatListTime(last.sentAt)}
                        </span>
                      ) : null}
                    </div>
                    {last ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-[color:var(--text-muted)]">{last.body}</p>
                    ) : (
                      <p className="mt-0.5 text-xs italic text-[color:var(--text-muted)]">No messages yet</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Thread */}
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
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#818cf8] to-[var(--primary)] text-xs font-semibold text-white md:hidden">
                  {initials(selected.trainerName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[color:var(--text)]">{selected.trainerName}</div>
                  <div className="text-[11px] text-[color:var(--text-muted)]">{selected.trainerTitle}</div>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 md:px-5">
                {selected.messages.map((msg, idx) => {
                  const prev = selected.messages[idx - 1];
                  const showDay =
                    !prev || formatDayLabel(prev.sentAt) !== formatDayLabel(msg.sentAt);
                  const isClient = msg.role === "client";
                  return (
                    <div key={msg.id}>
                      {showDay ? (
                        <div className="mb-3 flex justify-center">
                          <span className="rounded-full bg-[color:var(--border)]/60 px-3 py-1 text-[11px] font-medium text-[color:var(--text-muted)]">
                            {formatDayLabel(msg.sentAt)}
                          </span>
                        </div>
                      ) : null}
                      <div className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[min(100%,420px)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                            isClient
                              ? "rounded-br-md bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                              : "rounded-bl-md border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)]"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                          <div
                            className={`mt-1 text-[10px] ${
                              isClient ? "text-white/80" : "text-[color:var(--text-muted)]"
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
                        send();
                      }
                    }}
                    rows={2}
                    placeholder="Write a message…"
                    className="min-h-[44px] flex-1 resize-none rounded-xl border border-[color:var(--border)] bg-[color:var(--topbar-input-bg)] px-3 py-2.5 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    aria-label="Message text"
                  />
                  <Button type="button" variant="primary" className="self-end shrink-0" onClick={send}>
                    Send
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-[color:var(--text-muted)]">
                  Demo preview — messages are stored in this session only until chat is connected to the server.
                </p>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[color:var(--text-muted)]">
              <p className="font-medium text-[color:var(--text)]">No conversation selected</p>
            </div>
          )}
        </section>
        </div>
      </div>
    </div>
  );
}

function InboxIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v10l-3 3H7l-3-3V4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h4l2 3h4l2-3h4" />
    </svg>
  );
}
