import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { TrainerPageHeader } from "@/components/dashboard/trainer-page-header";
import { TrainerNavIconCalendar } from "@/components/dashboard/trainer-sidebar-icons";

// ---------------------------------------------------------------------------
// Types + constants
// ---------------------------------------------------------------------------

type EventType = "training" | "meeting" | "preparation";

type ReminderOption = "none" | "15m" | "30m" | "1h" | "1d";
type ViewMode = "month" | "week";

type CalendarEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h) — may be empty
  endTime: string; // HH:mm (24h) — may be empty
  type: EventType;
  description: string;
  reminder: ReminderOption;
  createdAt: string; // ISO
};

const STORAGE_KEY = "trainer_calendar_events";
const FIRED_KEY = "trainer_calendar_fired_reminders";

const EVENT_TYPE_META: Record<
  EventType,
  {
    label: string;
    chip: string; // chip background + text
    dot: string; // small colored dot
    border: string; // accent border on event row
  }
> = {
  training: {
    label: "Training Session",
    chip: "bg-blue-100 text-blue-900",
    dot: "bg-blue-500",
    border: "border-l-blue-500",
  },
  meeting: {
    label: "Meeting",
    chip: "bg-purple-100 text-purple-900",
    dot: "bg-purple-500",
    border: "border-l-purple-500",
  },
  preparation: {
    label: "Preparation",
    chip: "bg-yellow-100 text-yellow-900",
    dot: "bg-yellow-500",
    border: "border-l-yellow-500",
  },
};

const REMINDER_OPTIONS: Array<{
  value: ReminderOption;
  label: string;
  ms: number;
}> = [
  { value: "none", label: "None", ms: 0 },
  { value: "15m", label: "15 min before", ms: 15 * 60 * 1000 },
  { value: "30m", label: "30 min before", ms: 30 * 60 * 1000 },
  { value: "1h", label: "1 hour before", ms: 60 * 60 * 1000 },
  { value: "1d", label: "1 day before", ms: 24 * 60 * 60 * 1000 },
];

// ---------------------------------------------------------------------------
// Date utils (no external library)
// ---------------------------------------------------------------------------

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDateKey(key: string): Date {
  const [y, m, dd] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, dd ?? 1);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function startOfWeek(d: Date) {
  return addDays(d, -d.getDay());
}

function getMonthGridDays(cursor: Date): Date[] {
  // 6-row × 7-col grid starting from the Sunday on/before the 1st
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function getWeekDays(cursor: Date): Date[] {
  const start = startOfWeek(cursor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function formatTime12(time: string) {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time)) return "";
  const [hStr, m] = time.split(":");
  const h = Number(hStr);
  if (Number.isNaN(h)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

function eventStartMs(event: CalendarEvent): number {
  const d = parseDateKey(event.date);
  if (event.startTime) {
    const [h, m] = event.startTime.split(":").map(Number);
    d.setHours(h, m, 0, 0);
  } else {
    // Default to 9am when no start time was provided
    d.setHours(9, 0, 0, 0);
  }
  return d.getTime();
}

function reminderFireMs(event: CalendarEvent): number | null {
  if (event.reminder === "none") return null;
  const opt = REMINDER_OPTIONS.find((r) => r.value === event.reminder);
  if (!opt) return null;
  return eventStartMs(event) - opt.ms;
}

function weekRangeLabel(d: Date) {
  const start = startOfWeek(d);
  const end = addDays(start, 6);
  const sm = MONTHS[start.getMonth()];
  const em = MONTHS[end.getMonth()];
  const sy = start.getFullYear();
  const ey = end.getFullYear();
  if (sy === ey && start.getMonth() === end.getMonth()) {
    return `${sm} ${start.getDate()}–${end.getDate()}, ${sy}`;
  }
  if (sy === ey) {
    return `${sm} ${start.getDate()} – ${em} ${end.getDate()}, ${sy}`;
  }
  return `${sm} ${start.getDate()}, ${sy} – ${em} ${end.getDate()}, ${ey}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type ModalState =
  | { mode: "add"; date?: string }
  | { mode: "edit"; event: CalendarEvent };

type ToastItem = { id: string; title: string; body: string };

export default function TrainerCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [cursorDate, setCursorDate] = useState<Date>(() => new Date());
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const firedRef = useRef<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // Load events + fired reminder set from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CalendarEvent[];
        if (Array.isArray(parsed)) setEvents(parsed);
      }
    } catch {
      // ignore malformed
    }
    try {
      const raw = localStorage.getItem(FIRED_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        if (Array.isArray(arr)) firedRef.current = new Set(arr);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const persistEvents = useCallback((next: CalendarEvent[]) => {
    setEvents(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // quota / disabled storage — fine to ignore
    }
  }, []);

  const persistFired = useCallback(() => {
    try {
      localStorage.setItem(
        FIRED_KEY,
        JSON.stringify(Array.from(firedRef.current)),
      );
    } catch {
      // ignore
    }
  }, []);

  const pushToast = useCallback((title: string, body: string) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, title, body }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 8000);
  }, []);

  // Reminder loop — check every 30s
  useEffect(() => {
    if (!hydrated) return;
    function check() {
      const now = Date.now();
      let dirty = false;
      for (const ev of events) {
        if (firedRef.current.has(ev.id)) continue;
        const fireAt = reminderFireMs(ev);
        if (fireAt === null) continue;
        if (now < fireAt) continue;
        const start = eventStartMs(ev);
        // Skip reminders for events already more than an hour in the past
        if (now > start + 60 * 60 * 1000) {
          firedRef.current.add(ev.id);
          dirty = true;
          continue;
        }
        firedRef.current.add(ev.id);
        dirty = true;
        const when = ev.startTime ? formatTime12(ev.startTime) : "today";
        const body = `${EVENT_TYPE_META[ev.type].label} • ${when}${
          ev.description ? ` — ${ev.description}` : ""
        }`;
        pushToast(ev.title, body);
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          try {
            new Notification(ev.title, { body });
          } catch {
            // ignore browsers that throw on construction
          }
        }
      }
      if (dirty) persistFired();
    }
    check();
    const interval = setInterval(check, 30 * 1000);
    return () => clearInterval(interval);
  }, [events, hydrated, persistFired, pushToast]);

  const requestNotifPermission = useCallback(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission().catch(() => {
        // ignore
      });
    }
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) =>
        (a.startTime || "99:99").localeCompare(b.startTime || "99:99"),
      );
    }
    return map;
  }, [events]);

  const handleSave = useCallback(
    (draft: EventDraft) => {
      const payload = {
        title: draft.title,
        date: draft.date,
        startTime: draft.startTime,
        endTime: draft.endTime,
        type: draft.type,
        description: draft.description,
        reminder: draft.reminder,
      };
      if (draft.id) {
        // Reset fired-state on edit so an updated reminder can re-fire
        firedRef.current.delete(draft.id);
        persistFired();
        const next = events.map((e) =>
          e.id === draft.id ? { ...e, ...payload } : e,
        );
        persistEvents(next);
      } else {
        const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const newEv: CalendarEvent = {
          id,
          createdAt: new Date().toISOString(),
          ...payload,
        };
        persistEvents([...events, newEv]);
      }
      if (draft.reminder !== "none") {
        requestNotifPermission();
      }
      setModal(null);
    },
    [events, persistEvents, persistFired, requestNotifPermission],
  );

  const handleDelete = useCallback(
    (id: string) => {
      persistEvents(events.filter((e) => e.id !== id));
      firedRef.current.delete(id);
      persistFired();
      setModal(null);
    },
    [events, persistEvents, persistFired],
  );

  const todayKey = toDateKey(new Date());
  const headerLabel =
    viewMode === "month"
      ? `${MONTHS[cursorDate.getMonth()]} ${cursorDate.getFullYear()}`
      : weekRangeLabel(cursorDate);

  function handlePrev() {
    setCursorDate((d) =>
      viewMode === "month" ? addMonths(d, -1) : addDays(d, -7),
    );
  }
  function handleNext() {
    setCursorDate((d) =>
      viewMode === "month" ? addMonths(d, 1) : addDays(d, 7),
    );
  }
  function handleToday() {
    setCursorDate(new Date());
  }

  return (
    <div className="space-y-6 p-6">
      <TrainerPageHeader
        title="Training calendar"
        icon={<TrainerNavIconCalendar />}
        description="Plan training sessions, meetings, and preparation in one view."
        right={
          <Button
            onClick={() => setModal({ mode: "add", date: todayKey })}
            className="gap-1.5"
          >
            <PlusIcon className="h-4 w-4" />
            Add activity
          </Button>
        }
      />

      <Legend />

      <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] px-3 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous"
              className="grid h-9 w-9 place-items-center rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next"
              className="grid h-9 w-9 place-items-center rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]"
            >
              <ChevronRightIcon />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="h-9 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm font-medium text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]"
            >
              Today
            </button>
            <h2 className="ml-1 text-base font-semibold text-[color:var(--text)] sm:ml-3 sm:text-xl">
              {headerLabel}
            </h2>
          </div>

          <div className="inline-flex rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded px-3 py-1.5 font-medium transition-colors ${
                viewMode === "month"
                  ? "bg-[color:var(--primary)] text-white"
                  : "text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`rounded px-3 py-1.5 font-medium transition-colors ${
                viewMode === "week"
                  ? "bg-[color:var(--primary)] text-white"
                  : "text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {viewMode === "month" ? (
          <MonthView
            cursorDate={cursorDate}
            eventsByDate={eventsByDate}
            onDayClick={(key) => setModal({ mode: "add", date: key })}
            onEventClick={(ev) => setModal({ mode: "edit", event: ev })}
          />
        ) : (
          <WeekView
            cursorDate={cursorDate}
            eventsByDate={eventsByDate}
            onDayClick={(key) => setModal({ mode: "add", date: key })}
            onEventClick={(ev) => setModal({ mode: "edit", event: ev })}
          />
        )}
      </div>

      {modal ? (
        <EventModal
          state={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ) : null}

      <ToastStack
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((t) => t.filter((x) => x.id !== id))
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Month view
// ---------------------------------------------------------------------------

function MonthView(props: {
  cursorDate: Date;
  eventsByDate: Map<string, CalendarEvent[]>;
  onDayClick: (key: string) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const days = getMonthGridDays(props.cursorDate);
  const today = new Date();
  const cursorMonth = props.cursorDate.getMonth();

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-[color:var(--border)] bg-[color:var(--surface-muted)] text-center text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-1 py-2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const key = toDateKey(d);
          const dayEvents = props.eventsByDate.get(key) ?? [];
          return (
            <DayCell
              key={key + "-" + i}
              date={d}
              isToday={isSameDay(d, today)}
              isCurrentMonth={d.getMonth() === cursorMonth}
              events={dayEvents}
              onCellClick={() => props.onDayClick(key)}
              onEventClick={props.onEventClick}
              isLastCol={(i + 1) % 7 === 0}
              isLastRow={i >= 35}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayCell(props: {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
  onCellClick: () => void;
  onEventClick: (e: CalendarEvent) => void;
  isLastCol: boolean;
  isLastRow: boolean;
}) {
  const dim = props.isCurrentMonth
    ? "bg-[color:var(--surface)]"
    : "bg-[color:var(--surface-muted)]/40";
  const textTone = props.isCurrentMonth
    ? "text-[color:var(--text)]"
    : "text-[color:var(--text-muted)]/60";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={props.onCellClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          props.onCellClick();
        }
      }}
      className={`group relative flex min-h-[84px] cursor-pointer flex-col gap-1 p-1 transition-colors hover:bg-[color:var(--surface-muted)] focus:outline-none focus-visible:bg-[color:var(--surface-muted)] sm:min-h-[120px] sm:p-2 ${dim} ${
        props.isLastRow ? "" : "border-b border-[color:var(--border)]"
      } ${props.isLastCol ? "" : "border-r border-[color:var(--border)]"}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm ${
            props.isToday
              ? "bg-[color:var(--primary)] text-white"
              : textTone
          }`}
        >
          {props.date.getDate()}
        </span>
        {props.events.length > 0 ? (
          <span className="hidden text-[10px] font-semibold text-[color:var(--text-muted)] sm:inline">
            {props.events.length}
          </span>
        ) : null}
      </div>

      {/* Mobile: compact color dots row. Desktop: full chips. */}
      <div className="flex min-w-0 flex-wrap items-center gap-1 sm:hidden">
        {props.events.slice(0, 4).map((ev) => (
          <span
            key={ev.id}
            role="button"
            tabIndex={0}
            aria-label={`Open ${ev.title}`}
            onClick={(e) => {
              e.stopPropagation();
              props.onEventClick(ev);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                props.onEventClick(ev);
              }
            }}
            className={`h-2 w-2 rounded-full ${EVENT_TYPE_META[ev.type].dot}`}
          />
        ))}
        {props.events.length > 4 ? (
          <span className="text-[10px] font-semibold text-[color:var(--text-muted)]">
            +{props.events.length - 4}
          </span>
        ) : null}
      </div>
      <div className="hidden min-w-0 flex-col gap-0.5 sm:flex">
        {props.events.slice(0, 3).map((ev) => (
          <EventChip
            key={ev.id}
            event={ev}
            onClick={() => props.onEventClick(ev)}
          />
        ))}
        {props.events.length > 3 ? (
          <span className="px-1 text-[10px] font-medium text-[color:var(--text-muted)]">
            +{props.events.length - 3} more
          </span>
        ) : null}
      </div>
    </div>
  );
}

function EventChip(props: {
  event: CalendarEvent;
  onClick: () => void;
  showTime?: boolean;
}) {
  const meta = EVENT_TYPE_META[props.event.type];
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          props.onClick();
        }
      }}
      className={`flex min-w-0 cursor-pointer items-center gap-1 truncate rounded px-1.5 py-0.5 text-[11px] font-semibold transition-opacity hover:opacity-90 ${meta.chip}`}
    >
      {props.event.reminder !== "none" ? (
        <BellIcon className="h-3 w-3 shrink-0" />
      ) : null}
      <span className="truncate">
        {props.showTime && props.event.startTime
          ? `${formatTime12(props.event.startTime)} `
          : ""}
        {props.event.title}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Week view
// ---------------------------------------------------------------------------

function WeekView(props: {
  cursorDate: Date;
  eventsByDate: Map<string, CalendarEvent[]>;
  onDayClick: (key: string) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const days = getWeekDays(props.cursorDate);
  const today = new Date();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7">
      {days.map((d, i) => {
        const key = toDateKey(d);
        const dayEvents = props.eventsByDate.get(key) ?? [];
        const isToday = isSameDay(d, today);
        const isLastCol = (i + 1) % 7 === 0;
        const isLastRow = i === days.length - 1;
        return (
          <div
            key={key}
            className={`flex flex-col ${
              isLastRow ? "" : "border-b border-[color:var(--border)]"
            } sm:border-b-0 ${
              isLastCol ? "" : "sm:border-r sm:border-[color:var(--border)]"
            }`}
          >
            <div className="flex items-center justify-between bg-[color:var(--surface-muted)] px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                  {WEEKDAYS[d.getDay()]}
                </span>
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                    isToday
                      ? "bg-[color:var(--primary)] text-white"
                      : "text-[color:var(--text)]"
                  }`}
                >
                  {d.getDate()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => props.onDayClick(key)}
                aria-label="Add activity"
                title="Add activity"
                className="grid h-7 w-7 place-items-center rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--hover-subtle)]"
              >
                <PlusIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => props.onDayClick(key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  props.onDayClick(key);
                }
              }}
              className="flex min-h-[160px] flex-1 cursor-pointer flex-col gap-1.5 p-2 text-left hover:bg-[color:var(--surface-muted)] focus:outline-none focus-visible:bg-[color:var(--surface-muted)]"
            >
              {dayEvents.length === 0 ? (
                <span className="text-xs text-[color:var(--text-muted)]/70">
                  No activities
                </span>
              ) : (
                dayEvents.map((ev) => (
                  <EventRow
                    key={ev.id}
                    event={ev}
                    onClick={() => props.onEventClick(ev)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EventRow(props: { event: CalendarEvent; onClick: () => void }) {
  const meta = EVENT_TYPE_META[props.event.type];
  const time = props.event.startTime
    ? `${formatTime12(props.event.startTime)}${
        props.event.endTime ? ` – ${formatTime12(props.event.endTime)}` : ""
      }`
    : "All day";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        props.onClick();
      }}
      className={`flex w-full flex-col items-start gap-0.5 rounded-md border-l-4 bg-[color:var(--surface)] px-2 py-1.5 text-left shadow-sm hover:bg-[color:var(--surface-muted)] ${meta.border}`}
    >
      <span className="flex w-full items-center gap-1.5">
        {props.event.reminder !== "none" ? (
          <BellIcon className="h-3 w-3 shrink-0 text-[color:var(--text-muted)]" />
        ) : null}
        <span className="truncate text-xs font-semibold text-[color:var(--text)]">
          {props.event.title}
        </span>
      </span>
      <span className="flex items-center gap-2 text-[11px] text-[color:var(--text-muted)]">
        <span
          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${meta.chip}`}
        >
          {meta.label}
        </span>
        <span>{time}</span>
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-xs text-[color:var(--text-muted)] shadow-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text)]">
        Legend
      </span>
      {(Object.keys(EVENT_TYPE_META) as EventType[]).map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${EVENT_TYPE_META[t].dot}`}
          />
          <span className="text-[color:var(--text)]">
            {EVENT_TYPE_META[t].label}
          </span>
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 sm:ml-auto">
        <BellIcon className="h-3.5 w-3.5" />
        <span>= reminder enabled</span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

type EventDraft = {
  id?: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: EventType;
  description: string;
  reminder: ReminderOption;
};

function EventModal(props: {
  state: ModalState;
  onClose: () => void;
  onSave: (draft: EventDraft) => void;
  onDelete: (id: string) => void;
}) {
  const initial: EventDraft =
    props.state.mode === "edit"
      ? {
          id: props.state.event.id,
          title: props.state.event.title,
          date: props.state.event.date,
          startTime: props.state.event.startTime,
          endTime: props.state.event.endTime,
          type: props.state.event.type,
          description: props.state.event.description,
          reminder: props.state.event.reminder,
        }
      : {
          title: "",
          date: props.state.date ?? toDateKey(new Date()),
          startTime: "",
          endTime: "",
          type: "training",
          description: "",
          reminder: "none",
        };

  const [draft, setDraft] = useState<EventDraft>(initial);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof EventDraft>(k: K, v: EventDraft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
    if (error) setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!draft.date) {
      setError("Date is required.");
      return;
    }
    if (draft.startTime && draft.endTime && draft.endTime < draft.startTime) {
      setError("End time must be after start time.");
      return;
    }
    props.onSave({ ...draft, title: draft.title.trim() });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") props.onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props]);

  const isEdit = props.state.mode === "edit";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={props.onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="flex w-full max-w-lg flex-col rounded-t-2xl bg-[color:var(--surface)] shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-[color:var(--border)] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[color:var(--text)]">
              {isEdit ? "Edit activity" : "New activity"}
            </h2>
            <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
              {isEdit
                ? "Update the details or remove this activity."
                : "Add a new entry to your training calendar."}
            </p>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-md text-[color:var(--text-muted)] hover:bg-[color:var(--surface-muted)]"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          <Field label="Title" required>
            <input
              type="text"
              required
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Leadership workshop with Acme"
              className={inputCls}
            />
          </Field>

          <Field label="Date" required>
            <input
              type="date"
              required
              value={draft.date}
              onChange={(e) => update("date", e.target.value)}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time">
              <input
                type="time"
                value={draft.startTime}
                onChange={(e) => update("startTime", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="End time">
              <input
                type="time"
                value={draft.endTime}
                onChange={(e) => update("endTime", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Type">
            <select
              value={draft.type}
              onChange={(e) => update("type", e.target.value as EventType)}
              className={inputCls}
            >
              {(Object.keys(EVENT_TYPE_META) as EventType[]).map((t) => (
                <option key={t} value={t}>
                  {EVENT_TYPE_META[t].label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Description">
            <textarea
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Optional notes about this activity…"
              className={inputCls}
            />
          </Field>

          <Field label="Reminder">
            <select
              value={draft.reminder}
              onChange={(e) =>
                update("reminder", e.target.value as ReminderOption)
              }
              className={inputCls}
            >
              {REMINDER_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {draft.reminder !== "none" ? (
              <p className="mt-1.5 text-xs text-[color:var(--text-muted)]">
                You'll receive an in-app toast and a browser notification (if
                permitted).
              </p>
            ) : null}
          </Field>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[color:var(--border)] bg-[color:var(--surface-muted)]/60 px-5 py-3 sm:rounded-b-2xl">
          {isEdit ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (
                  window.confirm(
                    "Delete this activity? This action cannot be undone.",
                  )
                ) {
                  props.onDelete((props.state as { event: CalendarEvent }).event.id);
                }
              }}
              className="mr-auto"
            >
              Delete
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={props.onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {isEdit ? "Save changes" : "Add activity"}
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "block w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]";

function Field(props: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-[color:var(--text)]">
        {props.label}
        {props.required ? (
          <span className="ml-0.5 text-[color:var(--danger)]">*</span>
        ) : null}
      </span>
      {props.children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

function ToastStack(props: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (props.toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {props.toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 shadow-lg"
        >
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-white">
            <BellIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-[color:var(--text)]">
              {t.title}
            </div>
            <div className="text-xs text-[color:var(--text-muted)]">
              {t.body}
            </div>
          </div>
          <button
            type="button"
            onClick={() => props.onDismiss(t.id)}
            aria-label="Dismiss"
            className="grid h-6 w-6 place-items-center rounded text-[color:var(--text-muted)] hover:bg-[color:var(--surface-muted)]"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ChevronLeftIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CloseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}

function BellIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0"
      />
    </svg>
  );
}

function PlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}
