"use client";

import {
  FolderKanban,
  Plus,
} from "lucide-react";

export type DashboardProjectProgress = {
  id: string;
  name: string;
  color: string;
  completed: number;
  total: number;
};

export type ProjectProgressWidgetProps = {
  projects: DashboardProjectProgress[];
  onProjectClick: (id: string) => void;
  onCreateProject?: () => void;
};

export function ProjectProgressWidget({
  projects,
  onProjectClick,
  onCreateProject,
}: ProjectProgressWidgetProps) {
  return (
    <div className="ml-v2-project-progress">
      <div className="ml-v2-project-progress-intro">
        <div className="ml-v2-widget-copy">
          <span>PROJECT HEALTH</span>
          <p>
            A quick look at how your projects are moving.
          </p>
        </div>

        {onCreateProject ? (
          <button
            type="button"
            className="ml-v2-project-progress-add"
            aria-label="Create project"
            title="Create project"
            onClick={onCreateProject}
          >
            <Plus size={17} />
          </button>
        ) : null}
      </div>

      {projects.length ? (
        <div className="ml-v2-project-progress-list">
          {projects.map((project) => {
            const percentage = project.total
              ? Math.round(
                  (project.completed / project.total) * 100,
                )
              : 0;

            return (
              <button
                key={project.id}
                type="button"
                className="ml-v2-project-progress-row"
                onClick={() => onProjectClick(project.id)}
              >
                <span
                  className="ml-v2-project-progress-icon"
                  style={{
                    color: project.color,
                  }}
                >
                  <FolderKanban size={17} />
                </span>

                <span className="ml-v2-project-progress-main">
                  <span className="ml-v2-project-progress-heading">
                    <strong>{project.name}</strong>
                    <span>{percentage}%</span>
                  </span>

                  <span className="ml-v2-project-progress-track">
                    <i
                      style={{
                        width: `${percentage}%`,
                        background: project.color,
                      }}
                    />
                  </span>

                  <small>
                    {project.completed} of {project.total} tasks complete
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="ml-v2-dashboard-empty">
          <FolderKanban size={24} />
          <strong>No projects yet.</strong>
          <span>
            Create your first project to get started.
          </span>

          {onCreateProject ? (
            <button
              type="button"
              className="ml-v2-dashboard-empty-action"
              onClick={onCreateProject}
            >
              <Plus size={15} />
              Create project
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
