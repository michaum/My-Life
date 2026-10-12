"use client";

import type { ReactNode } from "react";
import "./task-detail-panel-v2.css";

export type TaskDetailPanelV2Field = {
  id: string;
  label: string;
  value: ReactNode;
};

export type TaskDetailPanelV2Props = {
  title: ReactNode;
  assignee?: ReactNode;
  dueDate?: ReactNode;
  dependencies?: ReactNode;
  project?: ReactNode;
  section?: ReactNode;
  fields?: TaskDetailPanelV2Field[];
  description?: ReactNode;
  subtasks?: ReactNode;
  attachments?: ReactNode;
  activity?: ReactNode;
  commentEditor?: ReactNode;
  completionAction?: ReactNode;
  toolbarActions?: ReactNode;
  onClose?: () => void;
};

export function TaskDetailPanelV2({
  title,
  assignee,
  dueDate,
  dependencies,
  project,
  section,
  fields = [],
  description,
  subtasks,
  attachments,
  activity,
  commentEditor,
  completionAction,
  toolbarActions,
  onClose,
}: TaskDetailPanelV2Props) {
  return (
    <div className="ml-task-detail-v2">
      <header className="ml-task-detail-v2__toolbar">
        <div className="ml-task-detail-v2__completion">
          {completionAction}
        </div>
        <div className="ml-task-detail-v2__toolbar-actions">
          {toolbarActions}
          {onClose && (
            <button
              type="button"
              className="ml-task-detail-v2__close"
              onClick={onClose}
              aria-label="Close task details"
            >
              ×
            </button>
          )}
        </div>
      </header>

      <div className="ml-task-detail-v2__body">
        <div className="ml-task-detail-v2__title">{title}</div>

        <section className="ml-task-detail-v2__properties" aria-label="Task properties">
          <div className="ml-task-detail-v2__property">
            <span>Assignee</span>
            <div>{assignee ?? "Unassigned"}</div>
          </div>
          <div className="ml-task-detail-v2__property">
            <span>Due date</span>
            <div>{dueDate ?? "No due date"}</div>
          </div>
          {dependencies != null && (
            <div className="ml-task-detail-v2__property">
              <span>Dependencies</span>
              <div>{dependencies}</div>
            </div>
          )}
        </section>

        <section className="ml-task-detail-v2__projects" aria-label="Projects">
          <h3>Projects</h3>
          <div className="ml-task-detail-v2__project-row">
            <div>{project ?? "No project"}</div>
            {section != null && <div>{section}</div>}
          </div>
        </section>

        {fields.length > 0 && (
          <section className="ml-task-detail-v2__fields" aria-label="Custom fields">
            {fields.map((field) => (
              <div className="ml-task-detail-v2__field" key={field.id}>
                <div>{field.label}</div>
                <div>{field.value}</div>
              </div>
            ))}
          </section>
        )}

        <section className="ml-task-detail-v2__section ml-task-detail-v2__description">
          <h3>Description</h3>
          <div>{description ?? "What is this task about?"}</div>
        </section>

        <section className="ml-task-detail-v2__section">
          <h3>Subtasks</h3>
          <div>{subtasks}</div>
        </section>

        <section className="ml-task-detail-v2__section">
          <h3>Attachments</h3>
          <div>{attachments}</div>
        </section>

        <section className="ml-task-detail-v2__section ml-task-detail-v2__activity">
          <h3>Comments</h3>
          <div>{activity}</div>
          <div className="ml-task-detail-v2__comment-editor">
            {commentEditor}
          </div>
        </section>
      </div>
    </div>
  );
}
