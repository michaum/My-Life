"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getClassificationColor } from "../classification-colors";

type Props = {
  today: string;
  onOpenToday: () => void;
  tasks: {
    id: string;
    title: string;
    classification?: string;
    due: string;
    dueTime?: string;
    statusColor: string;
    status?: string;
  }[];
  occursOnDate: (id: string, date: string) => boolean;
  timeForDate?: (id: string, date: string) => { dueTime?: string; endTime?: string };
  onTaskClick: (id: string) => void;
};

function displayCalendarTime(value?: string) {
  if (!value) return "All day";
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  const hour = Number(match[1]);
  if (hour > 23) return value;
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
}

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
          const visibleTasks = tasks.filter(t => occursOnDate(t.id, selected));

          return visibleTasks.map(task => {
            const color = getClassificationColor(task.classification || "Task");

            return (
          <button key={task.id} type="button"
            onClick={() => onTaskClick(task.id)}
            style={{ borderLeft: `4px solid ${color}`, "--ml-calendar-pastel": color } as React.CSSProperties}>
            <strong>{task.title}</strong>
            <span className="ml-v2-dashboard-classification-tag" style={{ color }} title={`Classification: ${task.classification || "Task"}`}>
              {task.classification || "Task"}
            </span>
            <span className="ml-v2-weekly-calendar-event-time">{displayCalendarTime(timeForDate?.(task.id, selected)?.dueTime ?? task.dueTime)}</span>
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
