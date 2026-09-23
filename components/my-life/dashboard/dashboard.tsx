"use client";

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
  type LucideIcon,
} from "lucide-react";
import { ComingUpWidget } from "./coming-up-widget";
import { DashboardWidget } from "./dashboard-widget";
import { ProjectProgressWidget } from "./project-progress-widget";
import type { DashboardWidgetId } from "./types";

const DASHBOARD_ORDER_KEY = "my-life-v2-dashboard-widget-order";

type MovableWidgetId =
  | "tasks-in-progress"
  | "due-today"
  | "overdue"
  | "completed"
  | "coming-up"
  | "project-progress";

const defaultWidgetOrder: MovableWidgetId[] = [
  "tasks-in-progress",
  "due-today",
  "overdue",
  "completed",
  "coming-up",
  "project-progress",
];

type StatWidgetId =
  | "tasks-in-progress"
  | "due-today"
  | "overdue"
  | "completed";

type StatDefinition = {
  id: StatWidgetId;
  label: string;
  value: number;
  icon: LucideIcon;
  detail: string;
  onClick?: () => void;
};

export type DashboardTask = {
  id: string;
  title: string;
  due: string;
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
  comingUpTasks: DashboardTask[];
  projects: DashboardProject[];
  today: string;
  formatDate: (date: string) => string;
  onTaskClick: (id: string) => void;
  onProjectClick: (id: string) => void;
  onCreateProject?: () => void;
  onShowInProgress?: () => void;
  onShowDueToday?: () => void;
  onShowOverdue?: () => void;
  onShowCompleted?: () => void;
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
  return (
    value === "tasks-in-progress" ||
    value === "due-today" ||
    value === "overdue" ||
    value === "completed"
  );
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

    const valid = saved.filter(isMovableWidgetId);

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
  comingUpTasks,
  projects,
  today,
  formatDate,
  onTaskClick,
  onProjectClick,
  onCreateProject,
  onShowInProgress,
  onShowDueToday,
  onShowOverdue,
  onShowCompleted,
}: MyLifeDashboardProps) {
  const [widgetOrder, setWidgetOrder] =
    useState<MovableWidgetId[]>(defaultWidgetOrder);

  const [draggingWidget, setDraggingWidget] =
    useState<MovableWidgetId | null>(null);

  const [dragOverWidget, setDragOverWidget] =
    useState<MovableWidgetId | null>(null);

  useEffect(() => {
    setWidgetOrder(loadWidgetOrder());
  }, []);

  const definitions: Record<StatWidgetId, StatDefinition> = {
    "tasks-in-progress": {
      id: "tasks-in-progress",
      label: "In progress",
      value: inProgress,
      icon: CircleDotDashed,
      detail: "Tasks currently moving",
      onClick: onShowInProgress,
    },
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
    completed: {
      id: "completed",
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      detail: "Tasks completed",
      onClick: onShowCompleted,
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

    if (isStatWidgetId(id)) {
      const widget = definitions[id];
      const Icon = widget.icon;

      return (
        <DashboardWidget
          key={widget.id}
          id={widget.id}
          title={widget.label}
          size="small"
          {...commonProps}
        >
          <button
            type="button"
            className="ml-v2-dashboard-stat"
            onClick={widget.onClick}
            disabled={!widget.onClick}
          >
            <span className="ml-v2-dashboard-stat-icon">
              <Icon size={18} />
            </span>

            <strong>{widget.value}</strong>

            <span className="ml-v2-dashboard-stat-detail">
              {widget.detail}
            </span>

            {widget.onClick ? (
              <ArrowUpRight
                className="ml-v2-dashboard-stat-arrow"
                size={16}
                aria-hidden="true"
              />
            ) : null}
          </button>
        </DashboardWidget>
      );
    }

    if (id === "coming-up") {
      return (
        <DashboardWidget
          key={id}
          id={id}
          title="Coming up next"
          size="large"
          {...commonProps}
        >
          <ComingUpWidget
            tasks={comingUpTasks}
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
        title="Project progress"
        size="large"
        {...commonProps}
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
    <div className="ml-v2-dashboard">
      <section className="ml-v2-dashboard-welcome">
        <div>
          <span className="ml-v2-dashboard-eyebrow">
            YOUR DAY AT A GLANCE
          </span>

          <h1>
            Welcome back{userName ? `, ${userName}` : ""}.
          </h1>

          <p>
            Here is what needs your attention and what is
            already moving forward.
          </p>
        </div>
      </section>

      <div
        className="ml-v2-dashboard-grid"
        aria-label="Movable dashboard widgets"
      >
        {widgetOrder.map(renderWidget)}
      </div>
    </div>
  );
}
