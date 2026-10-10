"use client";

import { WeeklyCalendar } from "./weekly-calendar";
import { getClassificationColor } from "../classification-colors";

import {
  useEffect,
  useState,
  type CSSProperties,
  type DragEvent,
} from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDotDashed,
  Clock3,
  Flag,
  CalendarDays,
  Folder,
  Users,
  ChevronRight,
  ChevronLeft,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";
import { ComingUpWidget } from "./coming-up-widget";
import { DashboardWidget } from "./dashboard-widget";
import { ProjectProgressWidget } from "./project-progress-widget";
import type { DashboardWidgetId } from "./types";

const DASHBOARD_ORDER_KEY = "my-life-v2-dashboard-widget-order";

// STEP 18F.23I.43F - Project To Do List preference.
const PROJECT_TODO_KEY = "my-life-v2-project-todo-selection";

type ProjectTodoTask = {
  id: string;
  projectId: string;
  title: string;
  status: string;
  emoji?: string;
};

type MovableWidgetId =
  | "tasks-in-progress"
  | "due-today"
  | "overdue"
  | "notes"
  | "coming-up"
  | "project-progress";

const defaultWidgetOrder: MovableWidgetId[] = [
  "due-today",
  "overdue",
  "notes",
  "coming-up",
  "project-progress",
];

type StatWidgetId =
  | "due-today"
  | "overdue";

type StatDefinition = {
  id: StatWidgetId;
  label: string;
  value: number;
  icon: LucideIcon;
  detail: string;
  onClick?: () => void;
};


// P36C.1K.17C - Use saved Classification colors.
function classificationPastelColor(name: string): string {
  return getClassificationColor(name);
}

export type DashboardTask = {
  id: string;
  title: string;
  classification?: string;
  due: string;
  emoji?: string;
  dueTime?: string;
  assignee?: string;
  avatarData?: string | null;
  endTime?: string;
  occurrenceDate?: string;
  status: string;
  statusColor: string;
  textStyle?: CSSProperties;
};

export type DashboardProject = {
  id: string;
  name: string;
  color: string;
  completed: number;
  total: number;
};

export type MyLifeDashboardProps = {
  userName?: string;
  inProgress: number;
  dueToday: number;
  overdue: number;
  completed: number;
  upcomingCount: number;
  peopleNames: string[];
  peopleAvatars?: { id: string; name: string; avatarData?: string | null }[];
  onShowUpcoming: () => void;
  onShowProjects: () => void;
  onShowPeople: () => void;
  onOpenCalendarToday: () => void;
  onCompleteTodayTask: (id: string) => Promise<void>;
  comingUpTasks: DashboardTask[];
  calendarTasks?: DashboardTask[];
  calendarTaskOccursOnDate?: (taskId: string, date: string) => boolean;
  calendarTaskTimeForDate?: (taskId: string, date: string) => { dueTime?: string; endTime?: string };
  projects: DashboardProject[];
  projectTodoTasks?: ProjectTodoTask[];
  onOpenProjectList?: (projectId: string) => void;
  onOpenProjectTask?: (taskId: string, projectId: string) => void;
  today: string;
  formatDate: (date: string) => string;
  onTaskClick: (id: string) => void;
  onProjectClick: (id: string) => void;
  onCreateProject?: () => void;
  onShowInProgress?: () => void;
  onShowDueToday?: () => void;
  onShowOverdue?: () => void;
  onShowCompleted?: () => void;
  onShowNotes?: () => void;
  onOpenNote?: (noteId: string) => void;
  // STEP 18F.23I.40F - Calendar navigation for appointments.
  onShowAppointments?: () => void;
};

function isMovableWidgetId(
  value: unknown,
): value is MovableWidgetId {
  return (
    typeof value === "string" &&
    defaultWidgetOrder.includes(value as MovableWidgetId)
  );
}

function isStatWidgetId(
  value: MovableWidgetId,
): value is StatWidgetId {
  return value === "due-today" || value === "overdue";
}

function loadWidgetOrder(): MovableWidgetId[] {
  if (typeof window === "undefined") {
    return defaultWidgetOrder;
  }

  try {
    const saved = JSON.parse(
      window.localStorage.getItem(DASHBOARD_ORDER_KEY) || "[]",
    );

    if (!Array.isArray(saved)) {
      return defaultWidgetOrder;
    }

    // STEP 18F.23I.39C-R5B - Migrate legacy cards to Notes.
    const migrated = saved.map((id: unknown) =>
      id === "tasks-in-progress" || id === "completed"
        ? "notes"
        : id
    );
    const valid = migrated.filter(isMovableWidgetId);

    const unique = valid.filter(
      (id, index) => valid.indexOf(id) === index,
    );

    const missing = defaultWidgetOrder.filter(
      (id) => !unique.includes(id),
    );

    return [...unique, ...missing];
  } catch {
    return defaultWidgetOrder;
  }
}

export function MyLifeDashboard({
  userName,
  inProgress,
  dueToday,
  overdue,
  completed,
  upcomingCount,
  peopleNames = [],
  peopleAvatars = [],
  onShowUpcoming,
  onShowProjects,
  onShowPeople,
  onOpenCalendarToday,
  onCompleteTodayTask,
  comingUpTasks,
  calendarTasks,
  calendarTaskOccursOnDate,
  calendarTaskTimeForDate,
  projects,
  projectTodoTasks = [],
  onOpenProjectList,
  onOpenProjectTask,
  today,
  formatDate,
  onTaskClick,
  onProjectClick,
  onCreateProject,
  onShowInProgress,
  onShowDueToday,
  onShowOverdue,
  onShowCompleted,
  onShowNotes,
  onOpenNote,
  onShowAppointments,
}: MyLifeDashboardProps) {
  const [widgetOrder, setWidgetOrder] =
    useState<MovableWidgetId[]>(defaultWidgetOrder);

  // STEP 18F.23I.43F - Selected project, saved locally.
  const [todoProjectId, setTodoProjectId] = useState("");

  // STEP 18F.23I.43I-P34B.2 - Daily task navigation.
  const [selectedTaskDate, setSelectedTaskDate] = useState(today);

  const moveTaskDate = (direction: -1 | 1) => {
    setSelectedTaskDate((current) => {
      const date = new Date(`${current}T12:00:00`);
      date.setDate(date.getDate() + direction);
      return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
    });
  };

  const selectedTaskDateLabel = new Date(
    `${selectedTaskDate}T12:00:00`,
  ).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const displayedDailyTasks = comingUpTasks
    .filter((task) =>
      calendarTaskOccursOnDate?.(task.id, selectedTaskDate)
        ?? task.due === selectedTaskDate,
    )
    .sort((a, b) =>
      (a.dueTime ?? "").localeCompare(b.dueTime ?? ""),
    )
    .slice(0, 6)
    .map((task) => ({
      ...task,
      dueTime:
        calendarTaskTimeForDate?.(task.id, selectedTaskDate)?.dueTime
        ?? task.dueTime,
    }));

  useEffect(() => {
    try {
      setTodoProjectId(
        window.localStorage.getItem(PROJECT_TODO_KEY) ?? ""
      );
    } catch {
      // Dashboard remains usable without local storage.
    }
  }, []);

  const selectedTodoProject =
    projects.find((item) => item.id === todoProjectId)
    ?? projects[0];

  const topFiveProjectTodos = (projectTodoTasks ?? [])
    .filter(
      (task) =>
        task.projectId === selectedTodoProject?.id &&
        task.status !== "Done"
    )
    .slice(0, 5);

  const [draggingWidget, setDraggingWidget] =
    useState<MovableWidgetId | null>(null);

  const [dragOverWidget, setDragOverWidget] =
    useState<MovableWidgetId | null>(null);

  useEffect(() => {
    setWidgetOrder(loadWidgetOrder());
  }, []);


  // STEP 18F.23I.39C-R5B - Read-only web Notes preview.
  type PreviewNote = {
    id: string;
    title: string;
    updatedAt: string;
  };

  const [latestNotes, setLatestNotes] = useState<PreviewNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refreshNotes() {
      setNotesLoading(true);
      setNotesError(false);

      try {
        // Desktop V2 database access is intentionally disabled
        // until its storage is isolated from live V1.1.9.
        if (
          typeof window !== "undefined" &&
          ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
        ) {
          if (!cancelled) {
            setLatestNotes([]);
            setNotesError(true);
          }
          return;
        }

        const response = await fetch("/api/notes", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load Notes");
        }

        const result = (await response.json()) as {
          notes: PreviewNote[];
        };

        if (!Array.isArray(result.notes)) {
          throw new Error("Invalid Notes response");
        }

        if (!cancelled) {
          setLatestNotes(
            [...result.notes]
              .sort((a, b) =>
                b.updatedAt.localeCompare(a.updatedAt)
              )
              .slice(0, 5)
          );
        }
      } catch {
        if (!cancelled) setNotesError(true);
      } finally {
        if (!cancelled) setNotesLoading(false);
      }
    }

    void refreshNotes();

    return () => {
      cancelled = true;
    };
  }, []);

  // STEP 18F.23I.40F - Next five scheduled Calendar occurrences.
  // Scan future dates through the existing recurrence callback.
  const upcomingAppointments: {
    id: string;
    title: string;
    classification?: string;
    emoji?: string;
    date: string;
    time: string;
    timestamp: number;
  }[] = [];

  const now = new Date();
  const appointmentHorizon = 366;
  const appointmentTasks = calendarTasks ?? [];

  for (let offset = 0; offset < appointmentHorizon; offset += 1) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
    );

    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    for (const task of appointmentTasks) {
      if (task.status === "Done") continue;

      const occurs = calendarTaskOccursOnDate
        ? calendarTaskOccursOnDate(task.id, dateKey)
        : task.due === dateKey;

      if (!occurs) continue;

      const override = calendarTaskTimeForDate?.(task.id, dateKey);
      const startTime = override?.dueTime ?? task.dueTime;

      if (!startTime) continue;

      const match = /^(\d{1,2}):(\d{2})$/.exec(startTime);
      if (!match) continue;

      const hour = Number(match[1]);
      const minute = Number(match[2]);

      if (hour > 23 || minute > 59) continue;

      const startsAt = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hour,
        minute,
      );

      if (startsAt.getTime() < now.getTime()) continue;

      upcomingAppointments.push({
        id: task.id,
        title: task.title,
        classification: task.classification || "Task",
        emoji: task.emoji,
        date: dateKey,
        time: startTime,
        timestamp: startsAt.getTime(),
      });
    }

    if (upcomingAppointments.length >= 5) break;
  }

  upcomingAppointments.sort(
    (a, b) => a.timestamp - b.timestamp || a.title.localeCompare(b.title),
  );

  const nextFiveAppointments = upcomingAppointments.slice(0, 5);

  const definitions: Record<StatWidgetId, StatDefinition> = {
    "due-today": {
      id: "due-today",
      label: "Due today",
      value: dueToday,
      icon: Clock3,
      detail: "Tasks due today",
      onClick: onShowDueToday,
    },
    overdue: {
      id: "overdue",
      label: "Overdue",
      value: overdue,
      icon: Flag,
      detail: "Tasks needing attention",
      onClick: onShowOverdue,
    },
  };

  function saveOrder(order: MovableWidgetId[]) {
    setWidgetOrder(order);

    try {
      window.localStorage.setItem(
        DASHBOARD_ORDER_KEY,
        JSON.stringify(order),
      );
    } catch {
      // Dashboard remains usable if local storage is unavailable.
    }
  }

  function handleDragStart(
    event: DragEvent<HTMLElement>,
    id: DashboardWidgetId,
  ) {
    if (!isMovableWidgetId(id)) return;

    setDraggingWidget(id);
    setDragOverWidget(null);

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(
    event: DragEvent<HTMLElement>,
    id: DashboardWidgetId,
  ) {
    if (!draggingWidget || !isMovableWidgetId(id)) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (id !== draggingWidget) {
      setDragOverWidget(id);
    }
  }

  function handleDrop(
    event: DragEvent<HTMLElement>,
    targetId: DashboardWidgetId,
  ) {
    event.preventDefault();

    if (
      !draggingWidget ||
      !isMovableWidgetId(targetId) ||
      draggingWidget === targetId
    ) {
      setDragOverWidget(null);
      return;
    }

    const nextOrder = [...widgetOrder];
    const sourceIndex = nextOrder.indexOf(draggingWidget);
    const targetIndex = nextOrder.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDragOverWidget(null);
      return;
    }

    nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, draggingWidget);

    saveOrder(nextOrder);
    setDragOverWidget(null);
  }

  function handleDragEnd() {
    setDraggingWidget(null);
    setDragOverWidget(null);
  }

  function renderWidget(id: MovableWidgetId) {
    const commonProps = {
      draggable: true,
      dragging: draggingWidget === id,
      dragOver: dragOverWidget === id,
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
      onDragEnd: handleDragEnd,
    };

    if (id === "due-today") {
      return (
        <DashboardWidget
          key={id}
          id={id}
          title="Upcoming Appointments"
          size="small"
          className="ml-v2-dashboard-appointments-card"
          {...commonProps}
        >
          <div className="ml-v2-dashboard-appointments">
            <div className="ml-v2-dashboard-appointments-heading">
              <span>
                <CalendarDays size={17} aria-hidden="true" />
                Next 5 appointments
              </span>
              <button
                type="button"
                className="ml-v2-dashboard-appointments-view-all ml-v2-standard-button"
                onClick={onShowAppointments ?? onOpenCalendarToday}
              >
                View All
                <ArrowUpRight size={14} aria-hidden="true" />
              </button>
            </div>

            {nextFiveAppointments.length === 0 ? (
              <p className="ml-v2-dashboard-appointments-empty">
                No upcoming appointments.
              </p>
            ) : (
              <ul className="ml-v2-dashboard-appointments-list">
                {nextFiveAppointments.map((appointment) => {
                  const [year, month, day] = appointment.date
                    .split("-")
                    .map(Number);
                  const [hour, minute] = appointment.time
                    .split(":")
                    .map(Number);

                  const date = new Date(year, month - 1, day, hour, minute);

                  return (
                    <li key={`${appointment.id}-${appointment.date}`}>
                      <button
                        type="button"
                        className="ml-v2-dashboard-appointment-link ml-v2-standard-button"
                        onClick={() => onTaskClick(appointment.id)}
                      >
                        <span className="ml-v2-dashboard-appointment-main">
                          <span className="ml-v2-dashboard-appointment-title">
                          {appointment.emoji && (
                          <span className="ml-v2-dashboard-appointment-emoji" aria-hidden="true">
                            {appointment.emoji}
                          </span>
                        )}
                        {appointment.title}

                        </span>
                        </span>
                        <span
                          className="ml-v2-appointment-classification"
                          style={{ color: classificationPastelColor(appointment.classification || "Task") }}
                        >
                          {appointment.classification || "Task"}
                        </span>
                      <span className="ml-v2-dashboard-appointment-date">
                          {date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                          {" · "}
                          {date.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DashboardWidget>
      );
    }

    // STEP 18F.23I.43F - Dynamic Project To Do List.
    if (id === "overdue") {
      return (
        <DashboardWidget
          key={id}
          id={id}
          title={
            selectedTodoProject
              ? `${selectedTodoProject.name} Tasks`
              : "Project Tasks"
          }
          size="small"
          className="ml-v2-dashboard-project-todo-card"
          {...commonProps}
        >
          <div className="ml-v2-dashboard-project-todo">
            <div className="ml-v2-dashboard-project-todo-toolbar">
              <select
                aria-label="Select project for To Do List"
                className="ml-v2-dashboard-project-todo-select"
                value={selectedTodoProject?.id ?? ""}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setTodoProjectId(nextId);
                  try {
                    window.localStorage.setItem(
                      PROJECT_TODO_KEY,
                      nextId
                    );
                  } catch {
                    // Local storage is optional.
                  }
                }}
              >
                {projects.length === 0 ? (
                  <option value="">No projects available</option>
                ) : (
                  projects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                className="ml-v2-standard-button ml-v2-dashboard-project-todo-view-all"
                disabled={!selectedTodoProject || !onOpenProjectList}
                onClick={() => {
                  if (selectedTodoProject) {
                    onOpenProjectList?.(selectedTodoProject.id);
                  }
                }}
              >
                View All
                <ArrowUpRight size={14} aria-hidden="true" />
              </button>
            </div>

            {topFiveProjectTodos.length === 0 ? (
              <p className="ml-v2-dashboard-project-todo-empty">
                {selectedTodoProject
                  ? "No unfinished tasks in this project."
                  : "Create a project to see its To Do List."}
              </p>
            ) : (
              <ul className="ml-v2-dashboard-project-todo-list">
                {topFiveProjectTodos.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      className="ml-v2-standard-button ml-v2-dashboard-project-todo-task"
                      onClick={() =>
                        onOpenProjectTask?.(task.id, task.projectId)
                      }
                    >
                      <span>
                        {task.emoji ? `${task.emoji} ` : ""}
                        {task.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DashboardWidget>
      );
    }

    if (id === "notes") {
      return (
        <DashboardWidget
          key={id}
          id={id}
          title="Notes"
          size="small"
          className="ml-v2-dashboard-notes-card"
          {...commonProps}
        >
          <div className="ml-v2-dashboard-notes-preview">
            <div className="ml-v2-dashboard-notes-top">
              <span className="ml-v2-dashboard-notes-heading">
                <NotebookPen size={16} aria-hidden="true" />
                Latest Notes
              </span>
              <button
                type="button"
                className="ml-v2-dashboard-notes-view-all ml-v2-standard-button"
                onClick={onShowNotes}
              >
                View All
                <ArrowUpRight size={14} aria-hidden="true" />
              </button>
            </div>

            {notesLoading ? (
              <p className="ml-v2-dashboard-notes-empty">
                Loading notes...
              </p>
            ) : notesError ? (
              <p className="ml-v2-dashboard-notes-empty">
                Notes preview unavailable.
              </p>
            ) : latestNotes.length === 0 ? (
              <p className="ml-v2-dashboard-notes-empty">
                No notes yet.
              </p>
            ) : (
              <ul className="ml-v2-dashboard-notes-list">
                {latestNotes.map((note) => (
                  <li key={note.id}>
                    <button
                      type="button"
                      className="ml-v2-dashboard-note-link ml-v2-standard-button"
                      onClick={() => onOpenNote?.(note.id)}
                      title={`Open ${note.title.trim() || "Untitled note"}`}
                    >
                      <NotebookPen size={13} aria-hidden="true" />
                      <span>
                        {note.title.trim() || "Untitled note"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DashboardWidget>
      );
    }

    if (id === "coming-up") {
      return (
        <DashboardWidget
          key={id}
          id={id}
          title="Today's Tasks"
          headerActions={
            <>
              <button
                type="button"
                className="ml-v2-standard-button"
                aria-label="Previous day"
                title="Previous day"
                onClick={() => moveTaskDate(-1)}
                style={{ padding: "5px 7px" }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="ml-v2-standard-button"
                aria-label="Next day"
                title="Next day"
                onClick={() => moveTaskDate(1)}
                style={{ padding: "5px 7px" }}
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                className="ml-v2-standard-button"
                title="Return to today"
                onClick={() => setSelectedTaskDate(today)}
                style={{ padding: "5px 10px" }}
              >
                Today
              </button>
            </>
          }
          size="large"
          className="ml-v2-dashboard-widget-fixed"
          draggable={false}
        >
          <div
            style={{
              fontSize: 12,
              color: "#665b80",
              marginBottom: 10,
              fontWeight: 500,
            }}
          >
            {selectedTaskDateLabel}
          </div>
          <ComingUpWidget
            tasks={displayedDailyTasks}
            onCompleteTask={onCompleteTodayTask}
            today={today}
            formatDate={formatDate}
            onTaskClick={onTaskClick}
          />
        </DashboardWidget>
      );
    }

    return (
      <DashboardWidget
        key={id}
        id={id}
        title="My Projects"
        size="large"
        className="ml-v2-dashboard-widget-fixed"
        draggable={false}
      >
        <ProjectProgressWidget
          projects={projects}
          onProjectClick={onProjectClick}
          onCreateProject={onCreateProject}
        />
      </DashboardWidget>
    );
  }

  return (
    <div className="ml-v2-dashboard ml-v2-dashboard-reference">
      <section className="ml-v2-dashboard-main-layout" aria-label="Dashboard overview">
        <div className="ml-v2-dashboard-main-panel">
          {renderWidget("coming-up")}
        </div>
        <div className="ml-v2-dashboard-main-panel ml-v2-dashboard-calendar-panel">
          <WeeklyCalendar
            today={today}
            onOpenToday={onOpenCalendarToday}
            tasks={calendarTasks ?? []}
            occursOnDate={calendarTaskOccursOnDate ?? (() => false)}
            timeForDate={calendarTaskTimeForDate}
            onTaskClick={onTaskClick}
          />
        </div>
        <div className="ml-v2-dashboard-main-panel">
          {renderWidget("project-progress")}
        </div>
      </section>
      <div
        className="ml-v2-dashboard-grid ml-v2-dashboard-secondary-grid"
        aria-label="Movable dashboard widgets"
      >
        {widgetOrder
          .filter((id) => id !== "coming-up" && id !== "project-progress")
          .map(renderWidget)}
      </div>
    </div>
  );
}
