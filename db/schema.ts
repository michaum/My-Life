import {
  sqliteTable,
  text,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";
export const workspace = sqliteTable("workspace", {
  id: text("id").primaryKey(),
  statusOptions: text("status_options")
    .notNull()
    .default(
      '[{"id":"To do","label":"To do","color":"#7f8a8d"},{"id":"In progress","label":"In progress","color":"#ff1a66"},{"id":"In review","label":"In review","color":"#727272"},{"id":"Done","label":"Done","color":"#727272"}]',
    ),
  filterLabels: text("filter_labels")
    .notNull()
    .default(
      '{"priority":{"High":"High","Medium":"Medium","Low":"Low"},"sort":{"Default":"Sort: default","Due date":"Due date","Priority":"Priority","Name":"Name"}}',
    ),
});
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  color: text("color").notNull().default("#658373"),
  icon: text("icon").notNull().default("folder"),
  createdAt: text("created_at").notNull(),
});
export const people = sqliteTable(
  "people",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    smsEnabled: integer("sms_enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_people_name").on(table.name)],
);

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("user"),
    personId: text("person_id"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_person_id").on(table.personId),
  ],
);

export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_sessions_user").on(table.userId),
    index("idx_sessions_expires").on(table.expiresAt),
  ],
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    sectionId: text("section_id").notNull().default(""),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("To do"),
    color: text("color").notNull().default("#e5e5e5"),
    priority: text("priority").notNull().default("Medium"),
    assignee: text("assignee").notNull().default(""),
    due: text("due").notNull().default(""),
    dueTime: text("due_time").notNull().default(""),
    endTime: text("end_time").notNull().default(""),
    emoji: text("emoji").notNull().default(""),
    fontFamily: text("font_family").notNull().default("Arial"),
    fontSize: text("font_size").notNull().default("11"),
    fontStyle: text("font_style").notNull().default("normal"),
    fontColor: text("font_color").notNull().default("#1d2128"),
    boardFontColor: text("board_font_color").notNull().default("#1d2128"),
    listFontColor: text("list_font_color").notNull().default("#1d2128"),
    calendarFontColor: text("calendar_font_color").notNull().default("#1d2128"),
    overviewFontColor: text("overview_font_color").notNull().default("#1d2128"),
    sortOrder: integer("sort_order").notNull().default(0),
    subtasks: text("subtasks").notNull().default("[]"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_tasks_project").on(table.projectId)],
);
export const comments = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_comments_task").on(table.taskId)],
);
export const sections = sqliteTable(
  "sections",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_sections_project").on(table.projectId)],
);
export const customFields = sqliteTable(
  "custom_fields",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(),
    options: text("options").notNull().default("[]"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_custom_fields_project").on(table.projectId)],
);
export const taskValues = sqliteTable(
  "task_values",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    fieldId: text("field_id")
      .notNull()
      .references(() => customFields.id, { onDelete: "cascade" }),
    value: text("value").notNull().default(""),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.fieldId] }),
    index("idx_task_values_field").on(table.fieldId),
  ],
);
