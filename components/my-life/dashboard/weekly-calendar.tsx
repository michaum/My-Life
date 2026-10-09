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
        {tasks.filter(t => occursOnDate(t.id, selected)).map(task => (
          <button key={task.id} type="button"
            onClick={() => onTaskClick(task.id)}
            style={{ borderLeft: `4px solid ${task.statusColor || "#7045d9"}` }}>
            <span>{timeForDate?.(task.id, selected)?.dueTime ?? task.dueTime ?? "All day"}</span>
            <strong>{task.title}</strong>
            {task.status === "Done" && (
              <span className="ml-v2-calendar-task-done">
                <span aria-hidden="true">✓</span> Task Done
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
