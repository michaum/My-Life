"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { DashboardWidget } from "./dashboard-widget";
import type { DashboardWidgetId } from "./types";

type DashboardStatWidgetProps = {
  id: DashboardWidgetId;
  label: string;
  value: number;
  icon: LucideIcon;
  detail?: string;
  onClick?: () => void;
};

export function DashboardStatWidget({
  id,
  label,
  value,
  icon: Icon,
  detail,
  onClick,
}: DashboardStatWidgetProps) {
  return (
    <DashboardWidget id={id} title={label} size="small">
      <button
        type="button"
        className="ml-v2-dashboard-stat"
        onClick={onClick}
        disabled={!onClick}
      >
        <span className="ml-v2-dashboard-stat-icon">
          <Icon size={18} />
        </span>

        <strong>{value}</strong>

        <span className="ml-v2-dashboard-stat-detail">
          {detail || "View tasks"}
        </span>

        {onClick && <ArrowUpRight size={16} />}
      </button>
    </DashboardWidget>
  );
}
