"use client";

import { useState } from "react";
import { Check, CheckCheck, ChevronRight, Clock3 } from "lucide-react";
import type { CSSProperties } from "react";
import { PeopleProfileHoverCard } from "../people-profile-hover-card";
import { getClassificationColor } from "../classification-colors";

export type DashboardUpcomingTask = {
  id: string;
  title: string;
  classification?: string;
  due: string;
  dueTime?: string;
  assignee?: string;
  avatarData?: string | null;
  assigneePersonId?: string;
  assigneeDisplayStyle?: "name" | "avatar";
  statusColor: string;
  textStyle?: CSSProperties;
};

export type ComingUpWidgetProps = {
  tasks: DashboardUpcomingTask[];
  today: string;
  formatDate: (date: string) => string;
  onTaskClick: (id: string) => void;
  onCompleteTask: (id: string) => Promise<void>;
  onEditAssigneeProfile?: (personId: string) => void;
  onViewAssigneeProfile?: (personId: string) => void;
};

function displayTime(value?: string) {
  if (!value) return "All day";
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const hour = Number(match[1]);
  if (hour > 23) return value;
  const minute = match[2];
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

export function ComingUpWidget({
  tasks,
  onTaskClick,
  onCompleteTask,
  onEditAssigneeProfile,
  onViewAssigneeProfile,
}: ComingUpWidgetProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const selected = tasks.find((task) => task.id === confirmId);

  async function confirmComplete() {
    if (!confirmId || saving) return;
    setSaving(true);
    try {
      await onCompleteTask(confirmId);
      setConfirmId(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ml-v2-coming-up">
      {tasks.length ? (
        <div className="ml-v2-coming-up-list">
          {tasks.map((task) => (
            <div className="ml-v2-today-task-row" key={task.id}>
              <button
                type="button"
                className="ml-v2-today-check"
                aria-label={`Mark ${task.title} complete`}
                title="Mark task complete"
                onClick={() => setConfirmId(task.id)}
              >
                <Check size={14} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="ml-v2-today-task-main"
                onClick={() => onTaskClick(task.id)}
              >
                <span className="ml-v2-today-task-text">
                  <span
                    className="ml-v2-coming-up-title"
                    style={{
                      ...task.textStyle,
                      // STEP P36C.1O.1H - Match Upcoming Appointments.
                      fontSize: "13px",
                      fontWeight: 700,
                      // STEP 295X.58 - Respect user-selected textStyle; otherwise inherit normal theme text.
                    }}
                  >
                    {task.title}
                  </span>
                  {(() => {
                    const assigneeDisplay = (
                      <span
                        className="ml-v2-today-assignee"
                        title={task.assignee || "Unassigned"}
                        aria-label={task.assignee || "Unassigned"}
                      >
                        {!task.assignee || task.assigneeDisplayStyle !== "avatar" ? (
                          <span>{task.assignee || "Unassigned"}</span>
                        ) : task.avatarData ? (
                          <img src={task.avatarData} alt="" />
                        ) : (
                          <span className="ml-v2-today-person-icon">
                            {task.assignee.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
                          </span>
                        )}
                      </span>
                    );
                    return task.assigneePersonId ? (
                      <PeopleProfileHoverCard
                        person={{
                          id: task.assigneePersonId,
                          name: task.assignee || "",
                          avatarData: task.avatarData,
                        }}
                        onEdit={() => onEditAssigneeProfile?.(task.assigneePersonId!)}
                        onView={() => onViewAssigneeProfile?.(task.assigneePersonId!)}
                      >
                        {assigneeDisplay}
                      </PeopleProfileHoverCard>
                    ) : assigneeDisplay;
                  })()}
                </span>
                <span className="ml-v2-dashboard-classification-tag" style={{ color: getClassificationColor(task.classification || "Task") }} title={`Classification: ${task.classification || "Task"}`}>
                  {task.classification || "Task"}
                </span>
                <span className="ml-v2-today-time">
                  <Clock3 size={12} aria-hidden="true" />
                  {displayTime(task.dueTime)}
                </span>
                <ChevronRight
                  className="ml-v2-coming-up-chevron"
                  size={15}
                  aria-hidden="true"
                />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="ml-v2-dashboard-empty">
          <CheckCheck size={24} />
          <strong>You’re all caught up.</strong>
          <span>There are no unfinished tasks for today.</span>
        </div>
      )}

      {selected && (
        <div
          className="ml-v2-today-confirm-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setConfirmId(null);
            }
          }}
        >
          <div
            className="ml-v2-today-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ml-v2-today-confirm-title"
            aria-describedby="ml-v2-today-confirm-description"
            onKeyDown={(event) => {
              if (event.key === "Escape" && !saving) {
                setConfirmId(null);
              }
            }}
          >
            <h3 id="ml-v2-today-confirm-title">Complete this task?</h3>
            <p id="ml-v2-today-confirm-description">
              Are you sure you want to mark “{selected.title}” as
              completed? It will be moved to Completed.
            </p>
            <div className="ml-v2-today-confirm-actions">
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void confirmComplete()}
              >
                {saving ? "Completing..." : "Complete Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
