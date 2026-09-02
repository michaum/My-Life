import { database } from "@/db/raw";
import { z } from "zod";
import { env } from "cloudflare:workers";
import { requireUser } from "@/lib/auth-db";

const statuses = ["To do", "In progress", "In review", "Done"] as const;
const taskSchema = z.object({
  id: z.string().min(1).max(100),
  projectId: z.string().min(1).max(100),
  sectionId: z.string().max(100).default(""),
  title: z.string().trim().min(1).max(250),
  description: z.string().max(10000),
  status: z.enum(statuses),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#e5e5e5"),
  priority: z.enum(["Low", "Medium", "High"]),
  assignee: z.string().max(100),
  due: z
    .string()
    .refine(
      (v) =>
        !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))),
      "Invalid date",
    ),
  dueTime: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/),
  emoji: z.string().max(8),
  fontFamily: z.enum([
    "Arial",
    "Georgia",
    "Verdana",
    "Trebuchet MS",
    "Courier New",
    "Comic Sans MS",
    "Monotype Corsiva",
  ]),
  fontSize: z.enum(["9", "10", "11", "12", "14", "16"]),
  fontStyle: z.enum(["normal", "bold", "italic"]),
  fontColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  boardFontColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  listFontColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  calendarFontColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  overviewFontColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sortOrder: z.number().int().min(0).max(100000),
  subtasks: z
    .array(
      z.object({
        id: z.string().max(100),
        title: z.string().trim().min(1).max(250),
        done: z.boolean(),
      }),
    )
    .max(100),
  customValues: z
    .record(z.string().min(1).max(100), z.string().max(5000))
    .refine((v) => Object.keys(v).length <= 50, "Too many custom values")
    .default({}),
});
const personSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Use a full phone number, for example +18195550123."),
  smsEnabled: z.boolean(),
});
type SmsContact = { name: string; phone: string; sms_enabled: number };
class SmsDeliveryError extends Error {}
async function sendSmsMessage(phone: string, text: string) {
  const settings = env as unknown as Record<string, string | undefined>;
  const required = ["SINCH_ACCESS_KEY", "SINCH_KEY_SECRET", "SINCH_PROJECT_ID", "SINCH_CONVERSATION_APP_ID", "SINCH_SENDER"];
  if (required.some((key) => !settings[key])) throw new SmsDeliveryError("SMS notifications are not configured.");
  const response = await fetch(`https://us.conversation.api.sinch.com/v1/projects/${settings.SINCH_PROJECT_ID}/messages:send`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${settings.SINCH_ACCESS_KEY}:${settings.SINCH_KEY_SECRET}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: settings.SINCH_CONVERSATION_APP_ID,
      recipient: { identified_by: { channel_identities: [{ channel: "SMS", identity: phone }] } },
      message: { text_message: { text } },
      channel_priority_order: ["SMS"],
      channel_properties: { SMS_SENDER: settings.SINCH_SENDER },
    }),
  });
  if (!response.ok) {
    const error = await response.text();
    console.error("Sinch SMS request failed", response.status, error.slice(0, 500));
    throw new SmsDeliveryError(`Sinch rejected the SMS request (error ${response.status}).`);
  }
}
async function sendAssignmentSms(contact: SmsContact, task: z.infer<typeof taskSchema>) {
  const details = [task.due ? `Due: ${task.due}` : "", task.dueTime ? `Time: ${task.dueTime}` : ""].filter(Boolean).join(" · ");
  await sendSmsMessage(contact.phone, `My Life: You have been assigned “${task.title}”.${details ? ` ${details}` : ""}`);
}
const projectSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  description: z.string().max(2000),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.enum([
    "folder",
    "home",
    "calendar",
    "star",
    "heart",
    "sport",
    "tools",
    "shopping",
    "work",
    "trophy",
  ]),
});
const sectionSchema = z.object({
  id: z.string().min(1).max(100),
  projectId: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  sortOrder: z.number().int().min(0).max(100000),
});
const choiceColors = [
  "#b8b8b8",
  "#ff8a8a",
  "#ffad6f",
  "#ffc857",
  "#f6dd5e",
  "#b7d86b",
  "#7ed3ab",
  "#6dcbd5",
  "#78a7f5",
  "#a595ed",
  "#c18be3",
  "#e58bd0",
  "#f48db6",
  "#f7a0ad",
  "#9fa4a6",
  "#8adbd3",
  "#82b1f6",
  "#d7a0ec",
  "#f19ac8",
  "#a9b0b2",
];
const choiceSchema = z.object({
  id: z.string().min(1).max(100),
  label: z.string().trim().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
const statusOptionsSchema = z
  .array(choiceSchema.extend({ id: z.enum(statuses) }))
  .length(statuses.length)
  .refine(
    (options) =>
      statuses.every((status) =>
        options.some((option) => option.id === status),
      ),
    "Every workflow status is required.",
  );
const filterLabelsSchema = z.object({
  priority: z.object({
    High: z.string().trim().min(1).max(40),
    Medium: z.string().trim().min(1).max(40),
    Low: z.string().trim().min(1).max(40),
  }),
  sort: z.object({
    Default: z.string().trim().min(1).max(40),
    "Due date": z.string().trim().min(1).max(40),
    Priority: z.string().trim().min(1).max(40),
    Name: z.string().trim().min(1).max(40),
  }),
});
const defaultFilterLabels = {
  priority: { High: "High", Medium: "Medium", Low: "Low" },
  sort: {
    Default: "Sort: default",
    "Due date": "Due date",
    Priority: "Priority",
    Name: "Name",
  },
};
const fieldSchema = z.object({
  id: z.string().min(1).max(100),
  projectId: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  type: z.enum(["Text", "Number", "Date", "Choice"]),
  options: z
    .array(z.union([z.string().trim().min(1).max(100), choiceSchema]))
    .max(30),
});
function normalizeOptions(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((option, index) => {
    if (typeof option === "string" && option.trim())
      return [
        {
          id: `legacy-${index}`,
          label: option.trim(),
          color: choiceColors[index % choiceColors.length],
        },
      ];
    const parsed = choiceSchema.safeParse(option);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  try {
    const db = database();
    const [
      projects,
      tasks,
      comments,
      sections,
      customFields,
      people,
      taskValues,
      workspaceSettings,
    ] = await db.batch([
      db.prepare("SELECT * FROM projects ORDER BY created_at"),
      db.prepare("SELECT * FROM tasks ORDER BY sort_order, created_at"),
      db.prepare("SELECT * FROM comments ORDER BY created_at"),
      db.prepare("SELECT * FROM sections ORDER BY sort_order, created_at"),
      db.prepare("SELECT * FROM custom_fields ORDER BY created_at"),
      db.prepare("SELECT id,name,phone,sms_enabled FROM people ORDER BY name COLLATE NOCASE"),
      db.prepare("SELECT * FROM task_values ORDER BY task_id, field_id"),
      db.prepare(
        "SELECT status_options,filter_labels FROM workspace WHERE id='initialized'",
      ),
    ]);
    const valuesByTask = new Map<string, Record<string, string>>();
    for (const row of taskValues.results as Array<{
      task_id: string;
      field_id: string;
      value: string;
    }>) {
      const values = valuesByTask.get(row.task_id) ?? {};
      values[row.field_id] = row.value;
      valuesByTask.set(row.task_id, values);
    }
    return Response.json(
      {
        projects: projects.results,
        tasks: tasks.results.map((t: any) => ({
          ...t,
          projectId: t.project_id,
          sectionId: t.section_id,
          dueTime: t.due_time,
          endTime: t.end_time,
          emoji: t.emoji,
          fontFamily: t.font_family,
          fontSize: t.font_size,
          fontStyle: t.font_style,
          fontColor: t.font_color,
          boardFontColor: t.board_font_color ?? t.font_color,
          listFontColor: t.list_font_color ?? t.font_color,
          calendarFontColor: t.calendar_font_color ?? t.font_color,
          overviewFontColor: t.overview_font_color ?? t.font_color,
          sortOrder: t.sort_order,
          subtasks: JSON.parse(t.subtasks),
          customValues: valuesByTask.get(t.id) ?? {},
        })),
        comments: comments.results,
        sections: sections.results.map((s: any) => ({
          ...s,
          projectId: s.project_id,
          sortOrder: s.sort_order,
        })),
        customFields: customFields.results.map((f: any) => {
          let parsed: unknown = [];
          try {
            parsed = JSON.parse(f.options);
          } catch {}
          return {
            ...f,
            projectId: f.project_id,
            options: normalizeOptions(parsed),
          };
        }),
        people: people.results.map((person: any) => ({ ...person, smsEnabled: Boolean(person.sms_enabled) })),
        statusOptions: statusOptionsSchema
          .catch(
            statuses.map((label, index) => ({
              id: label,
              label,
              color: ["#7f8a8d", "#ff1a66", "#727272", "#727272"][index],
            })),
          )
          .parse(
            JSON.parse(
              String(
                (
                  workspaceSettings.results[0] as
                    { status_options?: string } | undefined
                )?.status_options || "[]",
              ),
            ),
          ),
        filterLabels: filterLabelsSchema
          .catch(defaultFilterLabels)
          .parse(
            JSON.parse(
              String(
                (
                  workspaceSettings.results[0] as
                    { filter_labels?: string } | undefined
                )?.filter_labels || "{}",
              ),
            ),
          ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Could not load your workspace. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  try {
    if (request.headers.get("sec-fetch-site") === "cross-site")
      return Response.json({ error: "Invalid origin" }, { status: 403 });
    if (!request.headers.get("content-type")?.includes("application/json"))
      return Response.json({ error: "JSON required" }, { status: 415 });
    const b = z
        .object({ action: z.string() })
        .passthrough()
        .parse(await request.json()),
      db = database(),
      now = new Date().toISOString();
    if (b.action === "initialize") {
      const p = "welcome-project",
        seed = [
          [
            "plan",
            "Map out the project",
            "Write down the outcome you want and the key milestones.",
            "To do",
            "High",
            1,
          ],
          [
            "ideas",
            "Collect ideas and inspiration",
            "A place for useful links, notes, and inspiration.",
            "To do",
            "Low",
            3,
          ],
          [
            "first",
            "Choose your first small step",
            "Break big work into a step you can finish today.",
            "In progress",
            "High",
            0,
          ],
          [
            "organize",
            "Organize your workspace",
            "Create a project for each area of your work.",
            "In progress",
            "Medium",
            2,
          ],
          [
            "review",
            "Review the project plan",
            "Check that the scope and priorities feel right.",
            "In review",
            "Medium",
            4,
          ],
          [
            "welcome",
            "Welcome to Taskflow",
            "Click any task to edit it. Drag cards between columns or change their status in the task details.",
            "Done",
            "Low",
            0,
          ],
        ];
      await db.batch([
        db
          .prepare(
            "INSERT OR IGNORE INTO projects (id,name,description,color,created_at) SELECT ?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM workspace WHERE id='initialized')",
          )
          .bind(
            p,
            "Getting started",
            "Your ideas, organized. Explore the example tasks, then make this space your own.",
            "#727272",
            now,
          ),
        ...seed.map(([id, title, description, status, priority, offset]) => {
          const due = new Date();
          due.setDate(due.getDate() + Number(offset));
          return db
            .prepare(
              "INSERT OR IGNORE INTO tasks (id,project_id,title,description,status,color,priority,assignee,due,subtasks,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM workspace WHERE id='initialized')",
            )
            .bind(
              id,
              p,
              title,
              description,
              status,
              "#e5e5e5",
              priority,
              "Marcel",
              due.toISOString().slice(0, 10),
              JSON.stringify(
                id === "first"
                  ? [
                      {
                        id: "s1",
                        title: "Pick one task to focus on",
                        done: true,
                      },
                      {
                        id: "s2",
                        title: "Set a realistic due date",
                        done: false,
                      },
                    ]
                  : [],
              ),
              now,
            );
        }),
        db.prepare("INSERT OR IGNORE INTO workspace(id) VALUES('initialized')"),
        db.prepare(
          "UPDATE projects SET color='#727272' WHERE color IN ('#668475','#215e61','#2f777a')",
        ),
      ]);
    } else if (b.action === "saveProject") {
      const p = projectSchema.parse(b.project);
      await db
        .prepare(
          "INSERT INTO projects(id,name,description,color,icon,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,color=excluded.color,icon=excluded.icon",
        )
        .bind(p.id, p.name, p.description, p.color, p.icon, now)
        .run();
    } else if (b.action === "savePerson") {
      const person = personSchema.parse(b.person);
      await db.prepare("INSERT INTO people(id,name,phone,sms_enabled,created_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=excluded.phone,sms_enabled=excluded.sms_enabled")
        .bind(person.id, person.name, person.phone, person.smsEnabled ? 1 : 0, now).run();
    } else if (b.action === "deletePerson") {
      const id = z.string().min(1).parse(b.id);
      await db.prepare("DELETE FROM people WHERE id=?").bind(id).run();
    } else if (b.action === "testSms") {
      const id = z.string().min(1).parse(b.id);
      const contact = await db
        .prepare("SELECT name,phone,sms_enabled FROM people WHERE id=?")
        .bind(id)
        .first<SmsContact>();
      if (!contact) return Response.json({ error: "Person no longer exists." }, { status: 400 });
      if (!contact.sms_enabled)
        return Response.json({ error: "Turn on SMS notifications for this person first." }, { status: 400 });
      await sendSmsMessage(contact.phone, "My Life test: SMS notifications are connected.");
    } else if (b.action === "deleteProject") {
      const id = z.string().min(1).parse(b.id);
      await db.batch([
        db
          .prepare(
            "DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE project_id=?)",
          )
          .bind(id),
        db
          .prepare(
            "DELETE FROM task_values WHERE task_id IN (SELECT id FROM tasks WHERE project_id=?)",
          )
          .bind(id),
        db.prepare("DELETE FROM tasks WHERE project_id=?").bind(id),
        db.prepare("DELETE FROM custom_fields WHERE project_id=?").bind(id),
        db.prepare("DELETE FROM sections WHERE project_id=?").bind(id),
        db.prepare("DELETE FROM projects WHERE id=?").bind(id),
      ]);
    } else if (b.action === "saveSection") {
      const s = sectionSchema.parse(b.section);
      if (
        !(await db
          .prepare("SELECT id FROM projects WHERE id=?")
          .bind(s.projectId)
          .first())
      )
        return Response.json(
          { error: "Project no longer exists." },
          { status: 400 },
        );
      await db
        .prepare(
          "INSERT INTO sections(id,project_id,name,sort_order,created_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,sort_order=excluded.sort_order",
        )
        .bind(s.id, s.projectId, s.name, s.sortOrder, now)
        .run();
    } else if (b.action === "reorderSections") {
      const data = z
        .object({
          projectId: z.string().min(1),
          ids: z.array(z.string().min(1)).max(100),
        })
        .parse(b);
      await db.batch(
        data.ids.map((id, index) =>
          db
            .prepare(
              "UPDATE sections SET sort_order=? WHERE id=? AND project_id=?",
            )
            .bind(index, id, data.projectId),
        ),
      );
    } else if (b.action === "reorderTasks") {
      const data = z
        .object({
          projectId: z.string().min(1),
          items: z
            .array(
              z.object({
                id: z.string().min(1),
                sectionId: z.string(),
                sortOrder: z.number().int().min(0),
                status: z.enum(statuses),
              }),
            )
            .max(1000),
        })
        .parse(b);
      const sectionRows = await db
        .prepare("SELECT id,name FROM sections WHERE project_id=?")
        .bind(data.projectId)
        .all();
      const fieldRows = await db
        .prepare(
          "SELECT id,options FROM custom_fields WHERE project_id=? AND type='Choice'",
        )
        .bind(data.projectId)
        .all();
      const sectionNames = new Map(
        (sectionRows.results as Array<{ id: string; name: string }>).map(
          (section) => [section.id, section.name.trim().toLowerCase()],
        ),
      );
      const choiceMatches = (
        fieldRows.results as Array<{ id: string; options: string }>
      ).flatMap((field) =>
        normalizeOptions(JSON.parse(field.options)).map((option) => ({
          fieldId: field.id,
          ...option,
          labelKey: option.label.trim().toLowerCase(),
        })),
      );
      await db.batch([
        ...data.items.map((item) =>
          db
            .prepare(
              "UPDATE tasks SET section_id=?,sort_order=?,status=? WHERE id=? AND project_id=?",
            )
            .bind(
              item.sectionId,
              item.sortOrder,
              item.status,
              item.id,
              data.projectId,
            ),
        ),
        ...data.items.flatMap((item) =>
          choiceMatches
            .filter(
              (option) => option.labelKey === sectionNames.get(item.sectionId),
            )
            .map((option) =>
              db
                .prepare(
                  "INSERT INTO task_values(task_id,field_id,value) VALUES(?,?,?) ON CONFLICT(task_id,field_id) DO UPDATE SET value=excluded.value",
                )
                .bind(item.id, option.fieldId, option.id),
            ),
        ),
      ]);
    } else if (b.action === "deleteSection") {
      const id = z.string().min(1).parse(b.id);
      await db.batch([
        db
          .prepare("UPDATE tasks SET section_id='' WHERE section_id=?")
          .bind(id),
        db.prepare("DELETE FROM sections WHERE id=?").bind(id),
      ]);
    } else if (b.action === "saveCustomField") {
      const f = fieldSchema.parse(b.field),
        options = f.type === "Choice" ? normalizeOptions(f.options) : [];
      if (
        !(await db
          .prepare("SELECT id FROM projects WHERE id=?")
          .bind(f.projectId)
          .first())
      )
        return Response.json(
          { error: "Project no longer exists." },
          { status: 400 },
        );
      const previous = await db
          .prepare("SELECT options FROM custom_fields WHERE id=?")
          .bind(f.id)
          .first<{ options: string }>(),
        oldOptions = previous
          ? normalizeOptions(JSON.parse(previous.options))
          : [];
      await db.batch([
        db
          .prepare(
            "INSERT INTO custom_fields(id,project_id,name,type,options,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,type=excluded.type,options=excluded.options",
          )
          .bind(
            f.id,
            f.projectId,
            f.name,
            f.type,
            JSON.stringify(options),
            now,
          ),
        ...oldOptions.map((option) =>
          db
            .prepare(
              "UPDATE task_values SET value=? WHERE field_id=? AND value=?",
            )
            .bind(option.id, f.id, option.label),
        ),
      ]);
    } else if (b.action === "saveStatusOptions") {
      const options = statusOptionsSchema.parse(b.options);
      await db
        .prepare("UPDATE workspace SET status_options=? WHERE id='initialized'")
        .bind(JSON.stringify(options))
        .run();
    } else if (b.action === "saveFilterLabels") {
      const labels = filterLabelsSchema.parse(b.labels);
      await db
        .prepare("UPDATE workspace SET filter_labels=? WHERE id='initialized'")
        .bind(JSON.stringify(labels))
        .run();
    } else if (b.action === "deleteCustomField") {
      const id = z.string().min(1).parse(b.id);
      await db.batch([
        db.prepare("DELETE FROM task_values WHERE field_id=?").bind(id),
        db.prepare("DELETE FROM custom_fields WHERE id=?").bind(id),
      ]);
    } else if (b.action === "saveTask") {
      const t = taskSchema.parse(b.task);
      const previous = await db.prepare("SELECT assignee FROM tasks WHERE id=?").bind(t.id).first<{ assignee: string }>();
      if (
        !(await db
          .prepare("SELECT id FROM projects WHERE id=?")
          .bind(t.projectId)
          .first())
      )
        return Response.json(
          { error: "Project no longer exists." },
          { status: 400 },
        );
      if (
        t.sectionId &&
        !(await db
          .prepare("SELECT id FROM sections WHERE id=? AND project_id=?")
          .bind(t.sectionId, t.projectId)
          .first())
      )
        return Response.json(
          { error: "Section no longer exists." },
          { status: 400 },
        );
      const rows = await db
          .prepare("SELECT id FROM custom_fields WHERE project_id=?")
          .bind(t.projectId)
          .all(),
        valid = new Set(
          (rows.results as Array<{ id: string }>).map((f) => f.id),
        ),
        values = Object.entries(t.customValues).filter(([id]) => valid.has(id));
      let sectionId = t.sectionId;
      for (const [fieldId, value] of values) {
        const field = await db
          .prepare("SELECT options FROM custom_fields WHERE id=? AND type=?")
          .bind(fieldId, "Choice")
          .first<{ options: string }>();
        const option = field
          ? normalizeOptions(JSON.parse(field.options)).find(
              (item) => item.id === value || item.label === value,
            )
          : undefined;
        if (option?.label.trim().toLocaleLowerCase() === "completer") {
          const target = await db
            .prepare(
              "SELECT id FROM sections WHERE project_id=? AND lower(name)=?",
            )
            .bind(t.projectId, "completer")
            .first<{ id: string }>();
          if (target) sectionId = target.id;
        }
      }
      await db.batch([
        db
          .prepare(
            "INSERT INTO tasks(id,project_id,section_id,title,description,status,color,priority,assignee,due,due_time,end_time,emoji,font_family,font_size,font_style,font_color,board_font_color,list_font_color,calendar_font_color,overview_font_color,sort_order,subtasks,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET project_id=excluded.project_id,section_id=excluded.section_id,title=excluded.title,description=excluded.description,status=excluded.status,color=excluded.color,priority=excluded.priority,assignee=excluded.assignee,due=excluded.due,due_time=excluded.due_time,end_time=excluded.end_time,emoji=excluded.emoji,font_family=excluded.font_family,font_size=excluded.font_size,font_style=excluded.font_style,font_color=excluded.font_color,board_font_color=excluded.board_font_color,list_font_color=excluded.list_font_color,calendar_font_color=excluded.calendar_font_color,overview_font_color=excluded.overview_font_color,sort_order=excluded.sort_order,subtasks=excluded.subtasks",
          )
          .bind(
            t.id,
            t.projectId,
            sectionId,
            t.title,
            t.description,
            t.status,
            t.color,
            t.priority,
            t.assignee,
            t.due,
            t.dueTime,
            t.endTime,
            t.emoji,
            t.fontFamily,
            t.fontSize,
            t.fontStyle,
            t.fontColor,
            t.boardFontColor,
            t.listFontColor,
            t.calendarFontColor,
            t.overviewFontColor,
            t.sortOrder,
            JSON.stringify(t.subtasks),
            now,
          ),
        db.prepare("DELETE FROM task_values WHERE task_id=?").bind(t.id),
        ...values.map(([fieldId, value]) =>
          db
            .prepare(
              "INSERT INTO task_values(task_id,field_id,value) VALUES(?,?,?)",
            )
            .bind(t.id, fieldId, value),
        ),
      ]);
      if (t.assignee && previous?.assignee !== t.assignee) {
        const contact = await db.prepare("SELECT name,phone,sms_enabled FROM people WHERE lower(name)=lower(?)").bind(t.assignee).first<SmsContact>();
        if (contact?.sms_enabled) {
          try { await sendAssignmentSms(contact, t); } catch (error) { console.error("Assignment SMS failed", error); }
        }
      }
    } else if (b.action === "deleteTask") {
      const id = z.string().min(1).parse(b.id);
      await db.batch([
        db.prepare("DELETE FROM comments WHERE task_id=?").bind(id),
        db.prepare("DELETE FROM task_values WHERE task_id=?").bind(id),
        db.prepare("DELETE FROM tasks WHERE id=?").bind(id),
      ]);
    } else if (b.action === "comment") {
      const c = z
        .object({
          taskId: z.string().min(1),
          body: z.string().trim().min(1).max(4000),
        })
        .parse(b);
      if (
        !(await db
          .prepare("SELECT id FROM tasks WHERE id=?")
          .bind(c.taskId)
          .first())
      )
        return Response.json(
          { error: "Task no longer exists." },
          { status: 400 },
        );
      await db
        .prepare(
          "INSERT INTO comments(id,task_id,body,created_at) VALUES(?,?,?,?)",
        )
        .bind(crypto.randomUUID(), c.taskId, c.body, now)
        .run();
    } else return Response.json({ error: "Unknown action" }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError)
      return Response.json(
        { error: error.issues[0]?.message || "Please check your fields." },
        { status: 400 },
      );
    if (error instanceof SmsDeliveryError)
      return Response.json({ error: error.message }, { status: 502 });
    return Response.json(
      { error: "Your change could not be saved. Please try again." },
      { status: 500 },
    );
  }
}
