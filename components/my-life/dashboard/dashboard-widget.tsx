"use client";

import type {
  DragEvent,
  ReactNode,
} from "react";
import { GripVertical } from "lucide-react";
import type {
  DashboardWidgetId,
  DashboardWidgetSize,
} from "./types";

type DashboardWidgetProps = {
  id: DashboardWidgetId;
  title: string;
  size?: DashboardWidgetSize;
  children: ReactNode;
  className?: string;
  draggable?: boolean;
  dragging?: boolean;
  dragOver?: boolean;
  onDragStart?: (
    event: DragEvent<HTMLElement>,
    id: DashboardWidgetId,
  ) => void;
  onDragOver?: (
    event: DragEvent<HTMLElement>,
    id: DashboardWidgetId,
  ) => void;
  onDrop?: (
    event: DragEvent<HTMLElement>,
    id: DashboardWidgetId,
  ) => void;
  onDragEnd?: () => void;
};

export function DashboardWidget({
  id,
  title,
  size = "medium",
  children,
  className = "",
  draggable = false,
  dragging = false,
  dragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: DashboardWidgetProps) {
  return (
    <section
      className={[
        "ml-v2-dashboard-widget",
        `ml-v2-dashboard-widget-${size}`,
        dragging ? "is-dragging" : "",
        dragOver ? "is-drag-over" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-widget-id={id}
      onDragOver={
        draggable
          ? (event) => onDragOver?.(event, id)
          : undefined
      }
      onDrop={
        draggable
          ? (event) => onDrop?.(event, id)
          : undefined
      }
    >
      <header className="ml-v2-dashboard-widget-header">
        <h2>{title}</h2>

        <button
          type="button"
          className="ml-v2-dashboard-widget-handle"
          aria-label={`Move ${title} widget`}
          title={`Drag to move ${title}`}
          draggable={draggable}
          onDragStart={
            draggable
              ? (event) => onDragStart?.(event, id)
              : undefined
          }
          onDragEnd={draggable ? onDragEnd : undefined}
        >
          <GripVertical size={17} />
        </button>
      </header>

      <div className="ml-v2-dashboard-widget-content">
        {children}
      </div>
    </section>
  );
}
