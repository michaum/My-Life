"use client";

import {
  CheckCheck,
  ChevronRight,
} from "lucide-react";
import type { CSSProperties } from "react";

export type DashboardUpcomingTask = {
  id: string;
  title: string;
  due: string;
  statusColor: string;
  textStyle?: CSSProperties;
};

export type ComingUpWidgetProps = {
  tasks: DashboardUpcomingTask[];
  today: string;
  formatDate: (date: string) => string;
  onTaskClick: (id: string) => void;
};

export function ComingUpWidget({
  tasks,
  today,
  formatDate,
  onTaskClick,
}: ComingUpWidgetProps) {
  return (
    <div className="ml-v2-coming-up">
      <div className="ml-v2-widget-copy">
        <span>YOUR NEXT SMALL STEPS</span>
        <p>
          The next unfinished tasks that need your attention.
        </p>
      </div>

      {tasks.length ? (
        <div className="ml-v2-coming-up-list">
          {tasks.map((task) => {
            const late = Boolean(
              task.due &&
                task.due < today,
            );

            return (
              <button
                key={task.id}
                type="button"
                className="ml-v2-coming-up-row"
                onClick={() => onTaskClick(task.id)}
              >
                <span
                  className="ml-v2-coming-up-dot"
                  style={{
                    background: task.statusColor,
                  }}
                />

                <span
                  className="ml-v2-coming-up-title"
                  style={task.textStyle}
                >
                  {task.title}
                </span>

                <span
                  className={
                    late
                      ? "ml-v2-coming-up-date is-late"
                      : "ml-v2-coming-up-date"
                  }
                >
                  {formatDate(task.due)}
                </span>

                <ChevronRight
                  className="ml-v2-coming-up-chevron"
                  size={15}
                />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="ml-v2-dashboard-empty">
          <CheckCheck size={24} />
          <strong>You’re all caught up.</strong>
          <span>
            Add something new when you’re ready.
          </span>
        </div>
      )}
    </div>
  );
}
