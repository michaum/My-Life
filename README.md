# Taskflow

A private, single-user project and task manager with board, list, calendar, and overview views.

Includes project and task CRUD, drag-and-drop status changes, assignee name labels, due dates, priorities, subtasks, comments, filtering, sorting, collapsible project sections, custom list columns, and JSON export. Custom columns support text, numbers, dates, and single-choice values. The Getting started project is initialized once with editable examples. Records persist in D1. The Sites access gate keeps this deployment owner-only; changing access to shared/public would require a separate authorization review.

Team invitations, account-based assignment, notifications, attachments, real-time collaboration, and backup import are not implemented.

## Development

- `npm run install:ci`: install the locked dependencies.
- `npm run build`: build the Cloudflare Worker and assets.
- `npm run db:generate`: generate an additive migration after schema changes.
- `npx tsc --noEmit`: type check.

Database schema is in `db/schema.ts`; the API is in `app/api/workspace/route.ts`. Generated SQL migrations are applied by Sites during publication. Runtime queries use prepared statements. Do not change already-applied migrations.

The app is intentionally a single shared dataset behind the private Site access gate, rather than a multi-tenant application. Assignee labels do not grant access or send notifications.
