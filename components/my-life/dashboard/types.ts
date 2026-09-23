"use client";

import type { ReactNode } from "react";

export type DashboardWidgetId =
  | "welcome"
  | "tasks-in-progress"
  | "due-today"
  | "overdue"
  | "completed"
  | "coming-up"
  | "project-progress";

export type DashboardWidgetSize = "small" | "medium" | "large" | "wide";

export type DashboardWidgetDefinition = {
  id: DashboardWidgetId;
  title: string;
  size: DashboardWidgetSize;
  content: ReactNode;
};
