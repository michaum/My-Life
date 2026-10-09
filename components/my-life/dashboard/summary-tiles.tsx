"use client";

import {
  CheckCircle2,
  Flag,
  CalendarDays,
  Folder,
  Users,
  ChevronRight,
} from "lucide-react";

export type MyLifeSummaryTilesProps = {
  dueToday: number;
  overdue: number;
  upcomingCount: number;
  projectsCount: number;
  peopleNames: string[];
  peopleAvatars?: {
    id: string;
    name: string;
    avatarData?: string | null;
  }[];
  onShowDueToday?: () => void;
  onShowOverdue?: () => void;
  onShowUpcoming: () => void;
  onShowProjects: () => void;
  onShowPeople: () => void;
};

export function MyLifeSummaryTiles({
  dueToday,
  overdue,
  upcomingCount,
  projectsCount,
  peopleNames,
  peopleAvatars = [],
  onShowDueToday,
  onShowOverdue,
  onShowUpcoming,
  onShowProjects,
  onShowPeople,
}: MyLifeSummaryTilesProps) {
  return (
    <div className="ml-v2-dashboard-reference ml-v2-shared-summary">
      <section className="ml-v2-dashboard-summary" aria-label="Dashboard summary">
        {[
          {
            id: "today",
            label: "Today's Tasks",
            value: dueToday,
            icon: CheckCircle2,
            onClick: onShowDueToday,
          },
          {
            id: "overdue",
            label: "Overdue",
            value: overdue,
            icon: Flag,
            onClick: onShowOverdue,
          },
          {
            id: "upcoming",
            label: "Upcoming",
            value: upcomingCount,
            icon: CalendarDays,
            onClick: onShowUpcoming,
          },
          {
            id: "projects",
            label: "Active Projects",
            value: projectsCount,
            icon: Folder,
            onClick: onShowProjects,
          },
          {
            id: "people",
            label: "People",
            value: (peopleNames ?? []).length,
            icon: Users,
            onClick: onShowPeople,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`ml-v2-dashboard-summary-card ml-v2-summary-${item.id}`}
              onClick={item.onClick}
              aria-label={`${item.label}: ${item.value}`}
            >
              <span className="ml-v2-summary-icon">
                <Icon size={20} strokeWidth={2.4} />
              </span>
              <span className="ml-v2-summary-info">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </span>
              {item.id === "people" ? (
                <span className="ml-v2-summary-avatars" aria-hidden="true">
                  {/* STEP 18F.23I.19B - DASHBOARD AVATARS */}
                  {((peopleAvatars?.length ?? 0)
                    ? peopleAvatars
                    : (peopleNames ?? []).map((name, index) => ({
                        id: `${index}-${name}`,
                        name,
                        avatarData: null,
                      }))
                  ).slice(0, 3).map((person) => (
                    <span key={person.id} title={person.name}>
                      {person.avatarData ? (
                        <img src={person.avatarData} alt="" />
                      ) : (
                        person.name.trim().charAt(0).toUpperCase() || "?"
                      )}
                    </span>
                  ))}
                </span>
              ) : null}
              {item.id === "people" ? (
                <ChevronRight className="ml-v2-summary-arrow" size={16} />
              ) : null}
            </button>
          );
        })}
      </section>
    </div>
  );
}
