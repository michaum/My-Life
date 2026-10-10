"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  today: string;
  onOpenToday: () => void;
  tasks: {
    id: string;
    title: string;
    due: string;
    dueTime?: string;
    statusColor: string;
    status?: string;
  }[];
  occursOnDate: (id: string, date: string) => boolean;
  timeForDate?: (id: string, date: string) => { dueTime?: string; endTime?: string };
  onTaskClick: (id: string) => void;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// STEP 18F.23I.43I-P24 - Stable pastel accent per task.
const TASK_PASTEL_COLORS = [
  "#F4A9C6", // pink
  "#B9A5F5", // lavender
  "#9BD9E8", // sky blue
  "#F7CD91", // peach
  "#A8DFC1", // mint
  "#F4B5A6", // coral
  "#D7B5E9", // lilac
  "#A4D8D1", // seafoam
] as const;

function pastelColorForTask(taskId: string): string {
  let hash = 0;

  for (let index = 0; index < taskId.length; index += 1) {
    hash = (Math.imul(hash, 31) + taskId.charCodeAt(index)) | 0;
  }

  return TASK_PASTEL_COLORS[(hash >>> 0) % TASK_PASTEL_COLORS.length];
}

export function WeeklyCalendar({ today, tasks, occursOnDate, timeForDate, onTaskClick, onOpenToday }: Props) {
  const [selected, setSelected] = useState(today);
  const [year, month, day] = selected.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const start = addDays(date, -date.getDay());
  const week = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <section className="ml-v2-weekly-calendar">
      <header className="ml-v2-weekly-calendar-heading">
        <span>
          <CalendarDays size={18} />
          {date.toLocaleDateString("en-CA", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <nav aria-label="Calendar navigation">
          <button type="button" aria-label="Previous week"
            onClick={() => setSelected(dateKey(addDays(date, -7)))}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label="Next week"
            onClick={() => setSelected(dateKey(addDays(date, 7)))}>
            <ChevronRight size={18} />
          </button>
          <button type="button" onClick={() => { setSelected(today); onOpenToday(); }}>
            Today
          </button>
        </nav>
      </header>
      <div className="ml-v2-weekly-calendar-days">
        {week.map((item) => (
          <button key={dateKey(item)} type="button"
            aria-pressed={dateKey(item) === selected}
            onClick={() => setSelected(dateKey(item))}>
            <span>
              {item.toLocaleDateString("en-CA", { weekday: "short" })}
            </span>
            <strong>{item.getDate()}</strong>
          </button>
        ))}
      </div>
      <div className="ml-v2-weekly-calendar-events">
        {(() => {
          // STEP 18F.23I.43I-P25A - Stable, nonrepeating pastel sequence.
          const visibleTasks = tasks.filter(t => occursOnDate(t.id, selected));
          let previousColor = "";

          return visibleTasks.map(task => {
            const preferredColor = pastelColorForTask(task.id);
            const preferredIndex = TASK_PASTEL_COLORS.indexOf(
              preferredColor as (typeof TASK_PASTEL_COLORS)[number],
            );

            const color = preferredColor === previousColor
              ? TASK_PASTEL_COLORS[(preferredIndex + 1) % TASK_PASTEL_COLORS.length]
              : preferredColor;

            previousColor = color;

            return (
          <button key={task.id} type="button"
            onClick={() => onTaskClick(task.id)}
            style={{ borderLeft: `4px solid ${color}` }}>
            <span>{timeForDate?.(task.id, selected)?.dueTime ?? task.dueTime ?? "All day"}</span>
            <strong>{task.title}</strong>
            {task.status === "Done" && (
              <span className="ml-v2-calendar-task-done">
                <span aria-hidden="true">✓</span> Task Done
              </span>
            )}
          </button>
            );
          });
        })()}
      </div>
    </section>
  );
}
