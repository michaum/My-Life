"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Database from "@tauri-apps/plugin-sql";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  Columns3,
  Download,
  Flag,
  FolderKanban,
  Dumbbell,
  Heart,
  House,
  BriefcaseBusiness,
  ShoppingCart,
  Star,
  Trophy,
  Wrench,
  GripVertical,
  Home,
  LayoutGrid,
  List,
  Loader2,
  LockKeyhole,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Status = "To do" | "In progress" | "In review" | "Done";
type CalendarMode = "day" | "workweek" | "week" | "month";
type ProjectIcon =
  | "folder"
  | "home"
  | "calendar"
  | "star"
  | "heart"
  | "sport"
  | "tools"
  | "shopping"
  | "work"
  | "trophy";
type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  sidebarFontColor: string;
  icon: ProjectIcon;
};
type Person = { id: string; name: string; phone: string; smsEnabled: boolean };
type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  personId: string | null;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "user";
  personId: string | null;
  active: boolean;
  createdAt: string;
};
type Task = {
  id: string;
  projectId: string;
  sectionId: string;
  title: string;
  description: string;
  status: Status;
  color: string;
  priority: "Low" | "Medium" | "High";
  assignee: string;
  due: string;
  dueTime: string;
  endTime: string;
  recurrenceUnit: "none" | "days" | "months" | "years";
  recurrenceInterval: number;
  emoji: string;
  fontFamily:
    | "Arial"
    | "Georgia"
    | "Verdana"
    | "Trebuchet MS"
    | "Courier New"
    | "Comic Sans MS"
    | "Monotype Corsiva";
  fontSize: "9" | "10" | "11" | "12" | "14" | "16";
  fontStyle: "normal" | "bold" | "italic";
  fontColor: string;
  boardFontColor: string;
  listFontColor: string;
  calendarFontColor: string;
  overviewFontColor: string;
  sortOrder: number;
  subtasks: { id: string; title: string; done: boolean }[];
  customValues: Record<string, string>;
};
type FilterLabels = {
  priority: { High: string; Medium: string; Low: string };
  sort: { Default: string; "Smart / Urgency": string; "Due date": string; Priority: string; Name: string };
};
type Comment = {
  id: string;
  task_id: string;
  body: string;
  created_at: string;
};
type Section = {
  id: string;
  projectId: string;
  name: string;
  sortOrder: number;
};
type ChoiceOption = { id: string; label: string; color: string };
type CustomField = {
  id: string;
  projectId: string;
  name: string;
  type: "Text" | "Number" | "Date" | "Choice";
  options: ChoiceOption[];
};
function normalizeOptions(value: unknown): ChoiceOption[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ChoiceOption =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as ChoiceOption).id === "string" &&
      typeof (item as ChoiceOption).label === "string" &&
      typeof (item as ChoiceOption).color === "string",
  );
}

const statuses: Status[] = ["To do", "In progress", "In review", "Done"];
const statusColors = ["#7f8a8d", "#ff1a66", "#727272", "#727272"];
const defaultStatusOptions: ChoiceOption[] = statuses.map((label, index) => ({
  id: label,
  label,
  color: statusColors[index],
}));
const defaultFilterLabels: FilterLabels = {
  priority: { High: "High", Medium: "Medium", Low: "Low" },
  sort: {
    Default: "Sort: default",
    "Smart / Urgency": "Smart / Urgency",
    "Due date": "Due date",
    Priority: "Priority",
    Name: "Name",
  },
};
const emojis = Array.from(
  new Set([
    "",
    "⭐",
    "✅",
    "📌",
    "🔥",
    "💡",
    "🎯",
    "📅",
    "📞",
    "✉️",
    "🚀",
    "❤️",
    "🏆",
    "🛒",
    "🏠",
    "💼",
    "🎉",
    "⚠️",
    "⚽",
    "🏀",
    "🏈",
    "⚾",
    "🥎",
    "🎾",
    "🏐",
    "🏉",
    "🥏",
    "🎱",
    "🏓",
    "🏸",
    "🥅",
    "🏒",
    "🏑",
    "🥍",
    "🏏",
    "⛳",
    "🏹",
    "🎣",
    "🥊",
    "🥋",
    "⛸️",
    "🎿",
    "🏂",
    "🏋️",
    "🤸",
    "🚴",
    "🏊",
    "🏇",
    "🏆",
    "🥇",
    "🏅",
    "🧹",
    "🧽",
    "🧼",
    "🫧",
    "🧴",
    "🪣",
    "🧺",
    "🧻",
    "🚽",
    "🚿",
    "🛁",
    "🪥",
    "🧯",
    "🛒",
    "🍽️",
    "🧑‍🍳",
    "🗑️",
    "♻️",
    "🪟",
    "🛏️",
    "👕",
    "👚",
    "🧦",
    "🧤",
    "🪴",
    "🧰",
    "🔧",
    "🔨",
    "🪛",
    "🧲",
  ]),
);
const projectIcons = {
  folder: FolderKanban,
  home: House,
  calendar: CalendarDays,
  star: Star,
  heart: Heart,
  sport: Dumbbell,
  tools: Wrench,
  shopping: ShoppingCart,
  work: BriefcaseBusiness,
  trophy: Trophy,
};
const choicePalette = [
  "#ffbe0c",
  "#fb5507",
  "#ff006e",
  "#8338eb",
  "#3a86fe",
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
const colors = [
  "#ff1a66",
  "#727272",
  "#1d2128",
  "#d41457",
  "#ffbe0c",
  "#3a86fe",
];
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
const dateText = (date: string) =>
  date
    ? new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "No date";
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function ChoiceDropdown({
  value,
  options,
  onChange,
  onEdit,
  label,
  disabled = false,
}: {
  value: string;
  options: ChoiceOption[];
  onChange: (value: string) => void;
  onEdit?: () => void;
  label: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    selected = options.find(
      (option) => option.id === value || option.label === value,
    );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="choice-trigger"
          aria-label={label}
          aria-expanded={open}
          disabled={disabled}
        >
          <span>
            {selected ? (
              <span
                className="choice-pill"
                style={{ background: selected.color }}
              >
                {selected.label}
              </span>
            ) : (
              <span className="choice-placeholder">Not set</span>
            )}
          </span>
          <ChevronDown size={15} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="choice-menu">
        <div className="choice-menu-list">
          {options.map((option) => (
            <button
              type="button"
              key={option.id}
              className="choice-menu-option"
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
            >
              <Check
                size={15}
                className={
                  selected?.id === option.id ? "visible-check" : "hidden-check"
                }
              />
              <span
                className="choice-pill"
                style={{ background: option.color }}
              >
                {option.label}
              </span>
            </button>
          ))}
          {selected && (
            <button
              type="button"
              className="choice-menu-option clear-choice"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <X size={15} />
              <span>Clear selection</span>
            </button>
          )}
        </div>
        {onEdit && (
          <button
            type="button"
            className="choice-edit-action"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil size={15} />
            Edit options
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ShootingStarIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
    >
      <path
        d="M21.8 2.5l2.25 5.55 5.45 2.35-5.45 2.35-2.25 5.55-2.25-5.55-5.45-2.35 5.45-2.35 2.25-5.55Z"
        fill="currentColor"
      />
      <path
        d="M2.7 27.6c2.2-7.1 6.35-11.75 12.35-14.25M7.15 29c1.7-5.1 4.7-8.55 9.25-10.75"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="m8.25 15.1.85 2.05 2 .85-2 .85-.85 2.05-.85-2.05-2-.85 2-.85.85-2.05Zm2.3 7.5.65 1.55 1.5.65-1.5.65-.65 1.55-.65-1.55-1.5-.65 1.5-.65.65-1.55Z"
        fill="currentColor"
        opacity=".58"
      />
    </svg>
  );
}

export default function Taskflow() {
  const [projects, setProjects] = useState<Project[]>([]),
    [tasks, setTasks] = useState<Task[]>([]),
    [comments, setComments] = useState<Comment[]>([]),
    [sections, setSections] = useState<Section[]>([]),
    [customFields, setCustomFields] = useState<CustomField[]>([]),
    [people, setPeople] = useState<Person[]>([]),
    [workflowOptions, setWorkflowOptions] =
      useState<ChoiceOption[]>(defaultStatusOptions),
    [filterLabels, setFilterLabels] =
      useState<FilterLabels>(defaultFilterLabels);
  const [active, setActive] = useState("welcome-project"),
    [view, setView] = useState("Board"),
    [query, setQuery] = useState(""),
    [priority, setPriority] = useState("All priorities"),
    [statusFilter, setStatusFilter] = useState("All statuses"),
    [sort, setSort] = useState("Default");
  const [taskDateFilter, setTaskDateFilter] =
    useState<"all" | "overdue" | "today" | "upcoming">("all");
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [mobile, setMobile] = useState(false),
    [help, setHelp] = useState(false);
  const [draft, setDraft] = useState<Task | null>(null),
    [projectDraft, setProjectDraft] = useState<Project | null>(null),
    [sectionDraft, setSectionDraft] = useState<Section | null>(null),
    [fieldDraft, setFieldDraft] = useState<CustomField | null>(null),
    [statusDraft, setStatusDraft] = useState<ChoiceOption[] | null>(null),
    [filterDraft, setFilterDraft] = useState<FilterLabels | null>(null),
    [columnsOpen, setColumnsOpen] = useState(false),
    [collapsedSections, setCollapsedSections] = useState<string[]>([]),
    [confirmDelete, setConfirmDelete] = useState(false),
    [comment, setComment] = useState(""),
    [subtask, setSubtask] = useState("");
  const [peopleOpen, setPeopleOpen] = useState(false),
    [personDraft, setPersonDraft] = useState<Person | null>(null);
  const [appVersion, setAppVersion] = useState("");
  const [availableUpdate, setAvailableUpdate] =
    useState<Awaited<ReturnType<typeof check>>>(null);
  const [updateInstalling, setUpdateInstalling] = useState(false);
  const [updateStage, setUpdateStage] =
    useState<"idle" | "downloading" | "installing">("idle");
  const [updateDownloaded, setUpdateDownloaded] = useState(0);
  const [updateTotal, setUpdateTotal] = useState(0);
  const [updateError, setUpdateError] = useState("");

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
const currentPersonName =
  people.find((person) => person.id === currentUser?.personId)?.name ??
  currentUser?.name ??
  "";
const [accountOpen, setAccountOpen] = useState(false);
const [changePasswordOpen, setChangePasswordOpen] = useState(false);
const [currentPassword, setCurrentPassword] = useState("");
const [newAccountPassword, setNewAccountPassword] = useState("");
const [confirmAccountPassword, setConfirmAccountPassword] = useState("");
const [accountPasswordError, setAccountPasswordError] = useState("");
  const [adminUsersOpen, setAdminUsersOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "user">("user");
const [editingAdminUser, setEditingAdminUser] = useState<AdminUser | null>(null);
const [editAdminUserName, setEditAdminUserName] = useState("");
const [editAdminUserEmail, setEditAdminUserEmail] = useState("");
const [editAdminUserPhone, setEditAdminUserPhone] = useState("");
const [editAdminUserRole, setEditAdminUserRole] = useState<"admin" | "user">("user");
const [editAdminUserActive, setEditAdminUserActive] = useState(true);
const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);
const [deleteAdminUser, setDeleteAdminUser] = useState<AdminUser | null>(null);
const [resetPasswordValue, setResetPasswordValue] = useState("");
const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [month, setMonth] = useState(
    () => new Date(),
  );
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [dragging, setDragging] = useState<string | null>(null),
    [dropTarget, setDropTarget] = useState<Status | null>(null);
  async function loadAdminUsers() {
    setAdminUsersLoading(true);
    setAdminUsersError("");

    try {
      const response = await fetch("/api/admin/users", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load users.");
      }

      setAdminUsers(data.users ?? []);
    } catch (error) {
      setAdminUsersError((error as Error).message);
    } finally {
      setAdminUsersLoading(false);
    }
  }

  async function createAdminUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminUsersError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          phone: newUserPhone,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create user.");
      }

      setNewUserName("");
      setNewUserEmail("");
      setNewUserPhone("");
      setNewUserPassword("");
      setNewUserRole("user");
      await loadAdminUsers();
      await refresh();
    } catch (error) {
      setAdminUsersError((error as Error).message);
    }
  }

  async function updateAdminUser(
    id: string,
    changes: Partial<
      Pick<AdminUser, "name" | "email" | "phone" | "role" | "active">
    > & {
      password?: string;
    },
  ) {
    setAdminUsersError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, ...changes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to update user.");
      }

      await loadAdminUsers();
      await refresh();
    } catch (error) {
      setAdminUsersError((error as Error).message);
    }
  }

  function openEditAdminUser(user: AdminUser) {
    setAdminUsersError("");
    setEditingAdminUser(user);
    setEditAdminUserName(user.name);
    setEditAdminUserEmail(user.email);
    setEditAdminUserPhone(user.phone);
    setEditAdminUserRole(user.role);
    setEditAdminUserActive(user.active);
  }

  async function saveEditedAdminUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAdminUser) return;

    await updateAdminUser(editingAdminUser.id, {
      name: editAdminUserName,
      email: editAdminUserEmail,
      phone: editAdminUserPhone,
      role: editAdminUserRole,
      active: editAdminUserActive,
    });

    setEditingAdminUser(null);
  }

  function openChangePassword() {
    setAccountPasswordError("");
    setCurrentPassword("");
    setNewAccountPassword("");
    setConfirmAccountPassword("");
    setChangePasswordOpen(true);
  }

  async function saveAccountPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccountPasswordError("");

    if (newAccountPassword !== confirmAccountPassword) {
      setAccountPasswordError("New passwords do not match.");
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword: newAccountPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to change password.");
      }

      setChangePasswordOpen(false);
      setCurrentPassword("");
      setNewAccountPassword("");
      setConfirmAccountPassword("");
      setNotice("Password changed");
    } catch (error) {
      setAccountPasswordError((error as Error).message);
    }
  }

  function openResetPassword(user: AdminUser) {
    setAdminUsersError("");
    setResetPasswordUser(user);
    setResetPasswordValue("");
    setResetPasswordConfirm("");
  }

  async function deleteSelectedAdminUser() {
    if (!deleteAdminUser) return;

    setAdminUsersError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: deleteAdminUser.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to delete user.");
      }

      setDeleteAdminUser(null);
      await loadAdminUsers();
      setNotice("User deleted");
    } catch (error) {
      setAdminUsersError((error as Error).message);
    }
  }

  async function saveResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetPasswordUser) return;

    if (resetPasswordValue.length < 8) {
      setAdminUsersError("Password must be at least 8 characters.");
      return;
    }

    if (resetPasswordValue !== resetPasswordConfirm) {
      setAdminUsersError("Passwords do not match.");
      return;
    }

    await updateAdminUser(resetPasswordUser.id, {
      password: resetPasswordValue,
    });

    setResetPasswordUser(null);
    setResetPasswordValue("");
    setResetPasswordConfirm("");
  }

  async function loadLocalWorkspace() {
    const db = await Database.load("sqlite:mylife.db");

    const [
      projects,
      tasks,
      comments,
      sections,
      customFields,
      people,
      taskValues,
      workspaceSettings,
    ] = await Promise.all([
      db.select<any[]>("SELECT * FROM projects ORDER BY created_at"),
      db.select<any[]>("SELECT * FROM tasks ORDER BY sort_order, created_at"),
      db.select<any[]>("SELECT * FROM comments ORDER BY created_at"),
      db.select<any[]>("SELECT * FROM sections ORDER BY sort_order, created_at"),
      db.select<any[]>("SELECT * FROM custom_fields ORDER BY created_at"),
      db.select<any[]>("SELECT id,name,phone,sms_enabled FROM people ORDER BY name COLLATE NOCASE"),
      db.select<any[]>("SELECT * FROM task_values ORDER BY task_id, field_id"),
      db.select<any[]>("SELECT status_options,filter_labels FROM workspace WHERE id='initialized'"),
    ]);

    const valuesByTask = new Map<string, Record<string, string>>();
    for (const row of taskValues) {
      const values = valuesByTask.get(row.task_id) ?? {};
      values[row.field_id] = row.value;
      valuesByTask.set(row.task_id, values);
    }

    return {
      projects: projects.map((p: any) => ({
        ...p,
        sidebarFontColor: p.sidebar_font_color ?? "#ffffff",
      })),
      tasks: tasks.map((t: any) => ({
        ...t,
        projectId: t.project_id,
        sectionId: t.section_id,
        dueTime: t.due_time,
        endTime: t.end_time,
        recurrenceUnit: t.recurrence_unit || "none",
        recurrenceInterval: Number(t.recurrence_interval || 1),
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
      comments,
      sections: sections.map((s: any) => ({
        ...s,
        projectId: s.project_id,
        sortOrder: s.sort_order,
      })),
      customFields: customFields.map((f: any) => {
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
      people: people.map((person: any) => ({
        ...person,
        smsEnabled: Boolean(person.sms_enabled),
      })),
      statusOptions: JSON.parse(
        String(workspaceSettings[0]?.status_options || "[]"),
      ) as ChoiceOption[],
      filterLabels: JSON.parse(
        String(workspaceSettings[0]?.filter_labels || "{}"),
      ) as FilterLabels,
    };
  }

  async function saveTaskLocally(payload: any) {
    const db = await Database.load("sqlite:mylife.db");
    const t = payload.task as Task;
    const now = new Date().toISOString();

    const projectRows = await db.select<any[]>(
      "SELECT id FROM projects WHERE id=?",
      [t.projectId],
    );
    if (!projectRows.length) {
      throw new Error("Project no longer exists.");
    }

    if (t.sectionId) {
      const sectionRows = await db.select<any[]>(
        "SELECT id FROM sections WHERE id=? AND project_id=?",
        [t.sectionId, t.projectId],
      );
      if (!sectionRows.length) {
        throw new Error("Section no longer exists.");
      }
    }

    const fieldRows = await db.select<any[]>(
      "SELECT id FROM custom_fields WHERE project_id=?",
      [t.projectId],
    );
    const valid = new Set(fieldRows.map((f) => f.id));
    const values = Object.entries(t.customValues).filter(([id]) =>
      valid.has(id),
    );

    let sectionId = t.sectionId;

    for (const [fieldId, value] of values) {
      const choiceRows = await db.select<any[]>(
        "SELECT options FROM custom_fields WHERE id=? AND type='Choice'",
        [fieldId],
      );

      if (choiceRows.length) {
        let parsed: unknown = [];
        try {
          parsed = JSON.parse(choiceRows[0].options);
        } catch {}

        const option = normalizeOptions(parsed).find(
          (item) => item.id === value || item.label === value,
        );

        if (option?.label.trim().toLowerCase() === "completer") {
          const target = await db.select<any[]>(
            "SELECT id FROM sections WHERE project_id=? AND lower(name)=?",
            [t.projectId, "completer"],
          );
          if (target.length) sectionId = target[0].id;
        }
      }
    }

    await db.execute(
      `INSERT INTO tasks(
        id,project_id,section_id,title,description,status,color,priority,
        assignee,due,due_time,end_time,recurrence_unit,recurrence_interval,
        emoji,font_family,font_size,font_style,font_color,board_font_color,
        list_font_color,calendar_font_color,overview_font_color,sort_order,
        subtasks,created_at
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        project_id=excluded.project_id,
        section_id=excluded.section_id,
        title=excluded.title,
        description=excluded.description,
        status=excluded.status,
        color=excluded.color,
        priority=excluded.priority,
        assignee=excluded.assignee,
        due=excluded.due,
        due_time=excluded.due_time,
        end_time=excluded.end_time,
        recurrence_unit=excluded.recurrence_unit,
        recurrence_interval=excluded.recurrence_interval,
        emoji=excluded.emoji,
        font_family=excluded.font_family,
        font_size=excluded.font_size,
        font_style=excluded.font_style,
        font_color=excluded.font_color,
        board_font_color=excluded.board_font_color,
        list_font_color=excluded.list_font_color,
        calendar_font_color=excluded.calendar_font_color,
        overview_font_color=excluded.overview_font_color,
        sort_order=excluded.sort_order,
        subtasks=excluded.subtasks`,
      [
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
        t.recurrenceUnit || "none",
        t.recurrenceInterval || 1,
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
      ],
    );

    await db.execute("DELETE FROM task_values WHERE task_id=?", [t.id]);

    for (const [fieldId, value] of values) {
      await db.execute(
        "INSERT INTO task_values(task_id,field_id,value) VALUES(?,?,?)",
        [t.id, fieldId, value],
      );
    }

    await db.execute(
      "INSERT INTO sync_queue(id,payload,created_at,attempts) VALUES(?,?,?,0)",
      [crypto.randomUUID(), JSON.stringify(payload), now],
    );
  }



  async function mutateLocally(payload: any) {
    const db = await Database.load("sqlite:mylife.db");
    const action = payload.action as string | undefined;
    const now = new Date().toISOString();

    if (action === "saveProject") {
      const p = payload.project;

      await db.execute(
        `INSERT INTO projects(id,name,description,color,sidebar_font_color,icon,created_at)
         VALUES(?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           description=excluded.description,
           color=excluded.color,
           sidebar_font_color=excluded.sidebar_font_color,
           icon=excluded.icon`,
        [
          p.id,
          p.name,
          p.description,
          p.color,
          p.sidebarFontColor ?? "#ffffff",
          p.icon,
          now,
        ],
      );
    } else if (action === "deleteProject") {
      const id = payload.id;

      const taskRows = await db.select<any[]>(
        "SELECT id FROM tasks WHERE project_id=?",
        [id],
      );

      for (const task of taskRows) {
        await db.execute("DELETE FROM comments WHERE task_id=?", [task.id]);
        await db.execute("DELETE FROM task_values WHERE task_id=?", [task.id]);
      }

      await db.execute("DELETE FROM tasks WHERE project_id=?", [id]);

      const fieldRows = await db.select<any[]>(
        "SELECT id FROM custom_fields WHERE project_id=?",
        [id],
      );

      for (const field of fieldRows) {
        await db.execute("DELETE FROM task_values WHERE field_id=?", [field.id]);
      }

      await db.execute("DELETE FROM custom_fields WHERE project_id=?", [id]);
      await db.execute("DELETE FROM sections WHERE project_id=?", [id]);
      await db.execute("DELETE FROM projects WHERE id=?", [id]);
    } else if (action === "savePerson") {
      const person = payload.person;

      await db.execute(
        `INSERT INTO people(id,name,phone,sms_enabled,created_at)
         VALUES(?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           phone=excluded.phone,
           sms_enabled=excluded.sms_enabled`,
        [
          person.id,
          person.name,
          person.phone,
          person.smsEnabled ? 1 : 0,
          now,
        ],
      );
    } else if (action === "deletePerson") {
      await db.execute("DELETE FROM people WHERE id=?", [payload.id]);
    } else if (action === "saveSection") {
      const s = payload.section;

      const projectRows = await db.select<any[]>(
        "SELECT id FROM projects WHERE id=?",
        [s.projectId],
      );

      if (!projectRows.length) {
        throw new Error("Project no longer exists.");
      }

      await db.execute(
        `INSERT INTO sections(id,project_id,name,sort_order,created_at)
         VALUES(?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           sort_order=excluded.sort_order`,
        [s.id, s.projectId, s.name, s.sortOrder, now],
      );
    } else if (action === "reorderSections") {
      for (let index = 0; index < payload.ids.length; index += 1) {
        await db.execute(
          "UPDATE sections SET sort_order=? WHERE id=? AND project_id=?",
          [index, payload.ids[index], payload.projectId],
        );
      }
    } else if (action === "reorderTasks") {
      const sectionRows = await db.select<any[]>(
        "SELECT id,name FROM sections WHERE project_id=?",
        [payload.projectId],
      );

      const fieldRows = await db.select<any[]>(
        "SELECT id,options FROM custom_fields WHERE project_id=? AND type='Choice'",
        [payload.projectId],
      );

      const sectionNames = new Map(
        sectionRows.map((section) => [
          section.id,
          String(section.name).trim().toLowerCase(),
        ]),
      );

      const choiceMatches = fieldRows.flatMap((field) => {
        let parsed: unknown = [];

        try {
          parsed = JSON.parse(field.options);
        } catch {}

        return normalizeOptions(parsed).map((option) => ({
          fieldId: field.id,
          ...option,
          labelKey: option.label.trim().toLowerCase(),
        }));
      });

      for (const item of payload.items) {
        await db.execute(
          `UPDATE tasks
           SET section_id=?,sort_order=?,status=?
           WHERE id=? AND project_id=?`,
          [
            item.sectionId,
            item.sortOrder,
            item.status,
            item.id,
            payload.projectId,
          ],
        );

        const sectionName = sectionNames.get(item.sectionId);

        for (const option of choiceMatches) {
          if (option.labelKey !== sectionName) continue;

          await db.execute(
            `INSERT INTO task_values(task_id,field_id,value)
             VALUES(?,?,?)
             ON CONFLICT(task_id,field_id)
             DO UPDATE SET value=excluded.value`,
            [item.id, option.fieldId, option.id],
          );
        }
      }
    } else if (action === "deleteSection") {
      await db.execute("UPDATE tasks SET section_id='' WHERE section_id=?", [
        payload.id,
      ]);
      await db.execute("DELETE FROM sections WHERE id=?", [payload.id]);
    } else if (action === "saveCustomField") {
      const f = payload.field;

      const projectRows = await db.select<any[]>(
        "SELECT id FROM projects WHERE id=?",
        [f.projectId],
      );

      if (!projectRows.length) {
        throw new Error("Project no longer exists.");
      }

      const previousRows = await db.select<any[]>(
        "SELECT options FROM custom_fields WHERE id=?",
        [f.id],
      );

      let oldOptions: ReturnType<typeof normalizeOptions> = [];

      if (previousRows.length) {
        try {
          oldOptions = normalizeOptions(
            JSON.parse(previousRows[0].options),
          );
        } catch {}
      }

      const options =
        f.type === "Choice" ? normalizeOptions(f.options) : [];

      await db.execute(
        `INSERT INTO custom_fields(
           id,project_id,name,type,options,created_at
         )
         VALUES(?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           type=excluded.type,
           options=excluded.options`,
        [
          f.id,
          f.projectId,
          f.name,
          f.type,
          JSON.stringify(options),
          now,
        ],
      );

      for (const option of oldOptions) {
        await db.execute(
          "UPDATE task_values SET value=? WHERE field_id=? AND value=?",
          [option.id, f.id, option.label],
        );
      }
    } else if (action === "deleteCustomField") {
      await db.execute("DELETE FROM task_values WHERE field_id=?", [payload.id]);
      await db.execute("DELETE FROM custom_fields WHERE id=?", [payload.id]);
    } else if (action === "saveStatusOptions") {
      await db.execute(
        "UPDATE workspace SET status_options=? WHERE id='initialized'",
        [JSON.stringify(payload.options)],
      );
    } else if (action === "saveFilterLabels") {
      await db.execute(
        "UPDATE workspace SET filter_labels=? WHERE id='initialized'",
        [JSON.stringify(payload.labels)],
      );
    } else if (action === "deleteTask") {
      await db.execute("DELETE FROM comments WHERE task_id=?", [payload.id]);
      await db.execute("DELETE FROM task_values WHERE task_id=?", [payload.id]);
      await db.execute("DELETE FROM tasks WHERE id=?", [payload.id]);
    } else if (action === "comment") {
      const taskRows = await db.select<any[]>(
        "SELECT id FROM tasks WHERE id=?",
        [payload.taskId],
      );

      if (!taskRows.length) {
        throw new Error("Task no longer exists.");
      }

      await db.execute(
        "INSERT INTO comments(id,task_id,body,created_at) VALUES(?,?,?,?)",
        [crypto.randomUUID(), payload.taskId, payload.body, now],
      );
    } else {
      return false;
    }

    await db.execute(
      "INSERT INTO sync_queue(id,payload,created_at,attempts) VALUES(?,?,?,0)",
      [crypto.randomUUID(), JSON.stringify(payload), now],
    );

    return true;
  }


  async function downloadServerWorkspaceToLocal() {
    const isDesktop =
      "__TAURI_INTERNALS__" in window || "__TAURI__" in window;

    if (!isDesktop || !navigator.onLine) return false;

    const db = await Database.load("sqlite:mylife.db");

    const pending = await db.select<Array<{ count: number }>>(
      "SELECT COUNT(*) AS count FROM sync_queue",
    );

    if (Number(pending[0]?.count ?? 0) > 0) {
      console.log("Skipping server snapshot because local changes are pending.");
      return false;
    }

    const r = await fetch("/api/workspace", {
      credentials: "include",
      cache: "no-store",
    });

    if (r.status === 401) {
      throw new Error("Workspace download returned 401 Unauthorized.");
    }

    if (!r.ok) {
      throw new Error("Could not download the online workspace.");
    }

    const data = (await r.json()) as {
      projects: any[];
      tasks: any[];
      comments: any[];
      sections: any[];
      customFields: any[];
      people: any[];
      statusOptions: ChoiceOption[];
      filterLabels: FilterLabels;
    };

    const now = new Date().toISOString();
      await db.execute("DELETE FROM comments");
      await db.execute("DELETE FROM task_values");
      await db.execute("DELETE FROM tasks");
      await db.execute("DELETE FROM custom_fields");
      await db.execute("DELETE FROM sections");
      await db.execute("DELETE FROM projects");
      await db.execute("DELETE FROM people");

      await db.execute(
        "INSERT OR IGNORE INTO workspace(id) VALUES('initialized')",
      );

      for (const p of data.projects) {
        await db.execute(
          `INSERT INTO projects(
             id,name,description,color,sidebar_font_color,icon,created_at
           ) VALUES(?,?,?,?,?,?,?)`,
          [
            p.id,
            p.name,
            p.description ?? "",
            p.color ?? "#727272",
            p.sidebarFontColor ?? p.sidebar_font_color ?? "#ffffff",
            p.icon ?? "folder",
            p.created_at ?? now,
          ],
        );
      }

      for (const s of data.sections) {
        await db.execute(
          `INSERT INTO sections(
             id,project_id,name,sort_order,created_at
           ) VALUES(?,?,?,?,?)`,
          [
            s.id,
            s.projectId,
            s.name,
            s.sortOrder ?? 0,
            s.created_at ?? now,
          ],
        );
      }

      for (const f of data.customFields) {
        const options =
          f.type === "Choice" ? normalizeOptions(f.options) : [];

        await db.execute(
          `INSERT INTO custom_fields(
             id,project_id,name,type,options,created_at
           ) VALUES(?,?,?,?,?,?)`,
          [
            f.id,
            f.projectId,
            f.name,
            f.type,
            JSON.stringify(options),
            f.created_at ?? now,
          ],
        );
      }

      for (const t of data.tasks) {
        await db.execute(
          `INSERT INTO tasks(
             id,project_id,section_id,title,description,status,color,priority,
             assignee,due,due_time,end_time,emoji,font_family,font_size,
             font_style,font_color,board_font_color,list_font_color,
             calendar_font_color,overview_font_color,sort_order,subtasks,
             recurrence_unit,recurrence_interval,created_at
           ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            t.id,
            t.projectId,
            t.sectionId ?? "",
            t.title,
            t.description ?? "",
            t.status ?? "To do",
            t.color ?? "#e5e5e5",
            t.priority ?? "Medium",
            t.assignee ?? "",
            t.due ?? "",
            t.dueTime ?? "",
            t.endTime ?? "",
            t.emoji ?? "",
            t.fontFamily ?? "Arial",
            t.fontSize ?? "11",
            t.fontStyle ?? "normal",
            t.fontColor ?? "#1d2128",
            t.boardFontColor ?? t.fontColor ?? "#1d2128",
            t.listFontColor ?? t.fontColor ?? "#1d2128",
            t.calendarFontColor ?? t.fontColor ?? "#1d2128",
            t.overviewFontColor ?? t.fontColor ?? "#1d2128",
            t.sortOrder ?? 0,
            JSON.stringify(t.subtasks ?? []),
            t.recurrenceUnit ?? "none",
            t.recurrenceInterval ?? 1,
            t.created_at ?? now,
          ],
        );

        for (const [fieldId, value] of Object.entries(
          t.customValues ?? {},
        )) {
          await db.execute(
            `INSERT INTO task_values(task_id,field_id,value)
             VALUES(?,?,?)`,
            [t.id, fieldId, value],
          );
        }
      }

      for (const c of data.comments) {
        await db.execute(
          `INSERT INTO comments(id,task_id,body,created_at)
           VALUES(?,?,?,?)`,
          [
            c.id,
            c.task_id ?? c.taskId,
            c.body,
            c.created_at ?? now,
          ],
        );
      }

      for (const person of data.people) {
        await db.execute(
          `INSERT INTO people(
             id,name,phone,sms_enabled,created_at
           ) VALUES(?,?,?,?,?)`,
          [
            person.id,
            person.name,
            person.phone ?? "",
            person.smsEnabled ? 1 : 0,
            person.created_at ?? now,
          ],
        );
      }

      await db.execute(
        `UPDATE workspace
         SET status_options=?,filter_labels=?
         WHERE id='initialized'`,
        [
          JSON.stringify(data.statusOptions ?? []),
          JSON.stringify(data.filterLabels ?? {}),
        ],
      );
    return true;
  }

  async function processSyncQueue() {
    const isDesktop = "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
    if (!isDesktop || !navigator.onLine) return;

    const db = await Database.load("sqlite:mylife.db");

    const queued = await db.select<
      Array<{
        id: string;
        payload: string;
        attempts: number;
      }>
    >(
      "SELECT id,payload,attempts FROM sync_queue ORDER BY created_at ASC",
    );

    for (const item of queued) {
      try {
        const payload = JSON.parse(item.payload);

        const r = await fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (r.status === 401) {
          return;
        }

        if (!r.ok) {
          const d = (await r.json().catch(() => ({}))) as {
            error?: string;
          };

          console.error(
            "Queued mutation failed:",
            d.error || `HTTP ${r.status}`,
          );

          await db.execute(
            "UPDATE sync_queue SET attempts=attempts+1 WHERE id=?",
            [item.id],
          );

          return;
        }

        await db.execute("DELETE FROM sync_queue WHERE id=?", [item.id]);
      } catch (error) {
        console.error("Sync queue processing failed:", error);

        await db.execute(
          "UPDATE sync_queue SET attempts=attempts+1 WHERE id=?",
          [item.id],
        );

        return;
      }
    }
  }

  async function refresh() {
    const isDesktop = "__TAURI_INTERNALS__" in window || "__TAURI__" in window;

    if (isDesktop) {
      const d = await loadLocalWorkspace();
      setProjects(d.projects);
      setTasks(d.tasks);
      setComments(d.comments);
      setSections(d.sections);
      setCustomFields(d.customFields);
      setPeople(d.people);
      setWorkflowOptions(d.statusOptions);
      setFilterLabels(d.filterLabels);
      return d;
    }

    const r = await fetch("/api/workspace", { cache: "no-store" });

    if (r.status === 401) {
      window.location.href = "/login";
      throw new Error("Authentication required.");
    }

    const d = (await r.json()) as {
      error?: string;
      projects: Project[];
      tasks: Task[];
      comments: Comment[];
      sections: Section[];
      customFields: CustomField[];
      people: Person[];
      statusOptions: ChoiceOption[];
      filterLabels: FilterLabels;
    };
    if (!r.ok) throw new Error(d.error);
    setProjects(d.projects);
    setTasks(d.tasks);
    setComments(d.comments);
    setSections(d.sections);
    setCustomFields(d.customFields);
    setPeople(d.people);
    setWorkflowOptions(d.statusOptions);
    setFilterLabels(d.filterLabels);
    return d;
  }
  async function initialize() {
    setLoading(true);
    setError("");

    try {
      const isDesktop =
        "__TAURI_INTERNALS__" in window || "__TAURI__" in window;

      if (isDesktop) {
        const d = await refresh();

        if (!d.projects.some((p: Project) => p.id === active)) {
          setActive(d.projects[0]?.id || "all");
        }

        return;
      }

      const r = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize" }),
      });

      if (!r.ok) {
        throw new Error("Could not open your workspace. Please try again.");
      }

      const d = await refresh();

      if (!d.projects.some((p: Project) => p.id === active)) {
        setActive(d.projects[0]?.id || "all");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function start() {
      const isDesktop =
        "__TAURI_INTERNALS__" in window || "__TAURI__" in window;

      if (isDesktop) {
        await initialize();

        if (!navigator.onLine) {
          return;
        }

        try {
          const sessionResponse = await fetch("/api/auth/session", {
            credentials: "include",
            cache: "no-store",
          });

          if (sessionResponse.status === 401) {
            window.location.href = "/login";
            return;
          }

          if (sessionResponse.ok) {
            const sessionData = (await sessionResponse.json()) as {
              user: CurrentUser;
            };

            setCurrentUser(sessionData.user);
            await processSyncQueue();
            await downloadServerWorkspaceToLocal();
            await refresh();
          }
        } catch (error) {
          console.error("Desktop session check failed:", error);
          setError("Desktop sync failed: " + (error instanceof Error ? error.message : String(error)));
        }

        return;
      }

      const sessionResponse = await fetch("/api/auth/session", {
        credentials: "include",
        cache: "no-store",
      });

      if (sessionResponse.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (sessionResponse.ok) {
        const sessionData = (await sessionResponse.json()) as {
          user: CurrentUser;
        };
        setCurrentUser(sessionData.user);
      }

      await initialize();
    }

    void start();
  }, []);


  useEffect(() => {
    const isDesktop =
      "__TAURI_INTERNALS__" in window || "__TAURI__" in window;

    if (!isDesktop) return;

    let cancelled = false;
    let checking = false;

    void getVersion()
      .then((version) => {
        if (!cancelled) setAppVersion(version);
      })
      .catch((error) => {
        console.error("Could not read app version:", error);
      });

    async function checkForUpdates() {
      if (cancelled || checking || !navigator.onLine) return;

      checking = true;

      try {
        const update = await check();

        if (!update || cancelled) return;

        const dismissedVersion = sessionStorage.getItem(
          "mylife-dismissed-update",
        );

        if (dismissedVersion === update.version) return;

        setAvailableUpdate(update);
      } catch (error) {
        console.error("Update check failed:", error);
      } finally {
        checking = false;
      }
    }

    void checkForUpdates();

    const updateInterval = window.setInterval(() => {
      void checkForUpdates();
    }, 60 * 60 * 1000);

    const handleOnline = () => {
      void checkForUpdates();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      cancelled = true;
      window.clearInterval(updateInterval);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  async function installAvailableUpdate() {
    if (!availableUpdate || updateInstalling) return;

    setUpdateInstalling(true);
    setUpdateStage("downloading");
    setUpdateDownloaded(0);
    setUpdateTotal(0);
    setUpdateError("");

    let downloaded = 0;
    let total = 0;

    try {
      await availableUpdate.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength ?? 0;
            setUpdateTotal(total);
            setUpdateDownloaded(0);
            setUpdateStage("downloading");
            break;

          case "Progress":
            downloaded += event.data.chunkLength;
            setUpdateDownloaded(downloaded);
            break;

          case "Finished":
            if (total > 0) {
              setUpdateDownloaded(total);
            }
            setUpdateStage("installing");
            break;
        }
      });
    } catch (error) {
      console.error("Update installation failed:", error);
      setUpdateError(
        error instanceof Error ? error.message : String(error),
      );
      setUpdateInstalling(false);
      setUpdateStage("idle");
    }
  }

  useEffect(() => {
    const isDesktop = "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
    if (!isDesktop) return;

    const sync = async () => {
      try {
        await processSyncQueue();
        await downloadServerWorkspaceToLocal();
        await refresh();
      } catch (error) {
        console.error("Reconnect sync failed:", error);
      }
    };

    sync();
    window.addEventListener("online", sync);

    return () => {
      window.removeEventListener("online", sync);
    };
  }, []);

  useEffect(() => {
    if (notice) {
      const timeout = setTimeout(() => setNotice(""), 3000);
      return () => clearTimeout(timeout);
    }
  }, [notice]);
  async function mutate(payload: object, message: string) {
    if (busy) return false;
    setBusy(true);
    setError("");

    try {
      const action = (payload as { action?: string }).action;
      const isDesktop = "__TAURI_INTERNALS__" in window;

      if (isDesktop) {
        if (action === "saveTask") {
          await saveTaskLocally(payload);
          await refresh();
          setNotice(message);
          return true;
        }

        const handledLocally = await mutateLocally(payload);

        if (handledLocally) {
          await refresh();
          setNotice(message);
          void processSyncQueue();
          return true;
        }
      }

      const r = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const d = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(d.error);

      await refresh();
      setNotice(message);
      return true;
    } catch (e) {
      console.error("Mutation failed:", e);
      setError(String((e as Error)?.message || e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  const project = projects.find((p) => p.id === active);
  const projectSections = project
    ? sections
        .filter((s) => s.projectId === project.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
  const projectFields = project
    ? customFields.filter((f) => f.projectId === project.id)
    : [];
  const scope = tasks.filter(
    (t) =>
      active === "all" ||
      active === "home" ||
      (active === "mine"
        ? t.assignee.toLowerCase() ===
          currentPersonName.toLowerCase()
        : t.projectId === active),
  );
  const filtered = useMemo(
    () =>
      scope
        .filter(
          (t) =>
            (!query ||
              `${t.title} ${t.description} ${t.assignee}`
                .toLowerCase()
                .includes(query.toLowerCase())) &&
            (priority === "All priorities" || t.priority === priority) &&
            (statusFilter === "All statuses" || t.status === statusFilter) &&
            (taskDateFilter === "all" ||
            (taskDateFilter === "overdue"
              ? t.status !== "Done" && !!t.due && t.due < todayKey()
              : taskDateFilter === "today"
                ? t.status !== "Done" && t.due === todayKey()
                : taskDateFilter === "upcoming"
                  ? (() => {
                      if (t.status === "Done" || !t.due) return false;
                      const start = new Date(`${todayKey()}T00:00:00`);
                      const end = new Date(start);
                      end.setDate(end.getDate() + 7);
                      const due = new Date(`${t.due}T00:00:00`);
                      return due > start && due <= end;
                    })()
                  : t.status !== "Done" && !t.due)),
        )
        .sort((a, b) => {
          if (sort === "Smart / Urgency") {
            const urgencyRank = (t: Task) => {
              if (t.status === "Done") return 5;
              if (t.due && t.due < todayKey()) return 0;
              if (t.due === todayKey()) return 1;
              if (t.due) {
                const start = new Date(`${todayKey()}T00:00:00`);
                const end = new Date(start);
                end.setDate(end.getDate() + 7);
                const due = new Date(`${t.due}T00:00:00`);
                return due > start && due <= end ? 2 : 3;
              }
              return 4;
            };

            const rankDiff = urgencyRank(a) - urgencyRank(b);
            if (rankDiff) return rankDiff;

            if (a.due || b.due) {
              const dueDiff = (a.due || "9999").localeCompare(b.due || "9999");
              if (dueDiff) return dueDiff;
            }

            const priorityDiff =
              ["High", "Medium", "Low"].indexOf(a.priority) -
              ["High", "Medium", "Low"].indexOf(b.priority);

            return priorityDiff || a.sortOrder - b.sortOrder;
          }

          return sort === "Due date"
            ? (a.due || "9999").localeCompare(b.due || "9999")
            : sort === "Priority"
              ? ["High", "Medium", "Low"].indexOf(a.priority) -
                ["High", "Medium", "Low"].indexOf(b.priority)
              : sort === "Name"
                ? a.title.localeCompare(b.title)
                : a.sortOrder - b.sortOrder;
        }),
    [scope, query, priority, statusFilter, taskDateFilter, sort],
  );
  const completed = scope.filter((t) => t.status === "Done").length,
    overdue = scope.filter(
      (t) => t.status !== "Done" && t.due && t.due < todayKey(),
    ).length,
    dueToday = scope.filter(
      (t) => t.status !== "Done" && t.due === todayKey(),
    ).length,
    upcoming = scope.filter((t) => {
      if (t.status === "Done" || !t.due) return false;
      const start = new Date(`${todayKey()}T00:00:00`);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const due = new Date(`${t.due}T00:00:00`);
      return due > start && due <= end;
    }).length;
  function navigate(id: string) {
    setActive(id);
    setQuery("");
    setPriority("All priorities");
    setStatusFilter("All statuses");
    setTaskDateFilter("all");
    setMobile(false);
    if (id === "home") setView("Overview");
    else if (view === "Overview") setView("Board");
  }
  function newTask(status: Status = "To do", sectionId = "") {
    if (!projects.length) {
      newProject();
      return;
    }
    setConfirmDelete(false);
    setComment("");
    setSubtask("");
    setDraft({
      id: crypto.randomUUID(),
      projectId: project?.id || projects[0].id,
      sectionId,
      title: "",
      description: "",
      status,
      color: "#e5e5e5",
      priority: "Medium",
      assignee: "Marcel",
      due: "",
      dueTime: "",
      endTime: "",
      recurrenceUnit: "none",
      recurrenceInterval: 1,
      emoji: "",
      fontFamily: "Arial",
      fontSize: "11",
      fontStyle: "normal",
      fontColor: "#1d2128",
      boardFontColor: "#1d2128",
      listFontColor: "#1d2128",
      calendarFontColor: "#1d2128",
      overviewFontColor: "#1d2128",
      sortOrder: tasks.filter(
        (t) =>
          t.projectId === (project?.id || projects[0].id) &&
          t.sectionId === sectionId,
      ).length,
      subtasks: [],
      customValues: {},
    });
  }
  function editTask(task: Task) {
    setDraft({
      ...task,
      recurrenceUnit: task.recurrenceUnit || "none",
      recurrenceInterval: task.recurrenceInterval || 1,
      subtasks: task.subtasks.map((s) => ({ ...s })),
      customValues: { ...task.customValues },
    });
    setConfirmDelete(false);
    setComment("");
    setSubtask("");
  }
  function newProject() {
    setProjectDraft({
      id: crypto.randomUUID(),
      name: "",
      description: "",
      color: colors[projects.length % colors.length],
      sidebarFontColor: "#ffffff",
      icon: "folder",
    });
    setConfirmDelete(false);
  }
  function newPerson() {
    setPersonDraft({ id: crypto.randomUUID(), name: "", phone: "", smsEnabled: true });
  }
  async function savePerson(e: FormEvent) {
    e.preventDefault();
    if (personDraft && await mutate({ action: "savePerson", person: personDraft }, "Person saved")) setPersonDraft(null);
  }
  async function testSms(person: Person) {
    await mutate({ action: "testSms", id: person.id }, `Test SMS sent to ${person.name}`);
  }
  function newSection() {
    if (!project) return;
    setSectionDraft({
      id: crypto.randomUUID(),
      projectId: project.id,
      name: "",
      sortOrder: projectSections.length,
    });
    setConfirmDelete(false);
  }
  function newField() {
    if (!project) return;
    setColumnsOpen(false);
    setFieldDraft({
      id: crypto.randomUUID(),
      projectId: project.id,
      name: "",
      type: "Text",
      options: [],
    });
    setConfirmDelete(false);
  }
  function editField(field: CustomField) {
    setColumnsOpen(false);
    setFieldDraft({
      ...field,
      options: field.options.map((option) => ({ ...option })),
    });
    setConfirmDelete(false);
  }
  function editStatusField() {
    setStatusDraft(workflowOptions.map((option) => ({ ...option })));
  }
  async function saveTask(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    if ((draft.recurrenceUnit || "none") !== "none" && !draft.due) {
      setError("A recurring task needs a due date.");
      return;
    }
    if (await mutate({ action: "saveTask", task: draft }, "Task saved")) {
      setDraft(null);
    }
  }
  async function saveProject(e: FormEvent) {
    e.preventDefault();
    if (
      projectDraft &&
      (await mutate(
        { action: "saveProject", project: projectDraft },
        "Project saved",
      ))
    ) {
      setActive(projectDraft.id);
      setView("Board");
      setProjectDraft(null);
    }
  }
  async function saveSection(e: FormEvent) {
    e.preventDefault();
    if (
      sectionDraft &&
      (await mutate(
        { action: "saveSection", section: sectionDraft },
        "Section saved",
      ))
    )
      setSectionDraft(null);
  }
  async function saveField(e: FormEvent) {
    e.preventDefault();
    if (!fieldDraft) return;
    const field = {
      ...fieldDraft,
      options:
        fieldDraft.type === "Choice"
          ? fieldDraft.options
              .map((option) => ({ ...option, label: option.label.trim() }))
              .filter((option) => option.label)
          : [],
    };
    if (await mutate({ action: "saveCustomField", field }, "Column saved"))
      setFieldDraft(null);
  }
  async function saveStatusField(e: FormEvent) {
    e.preventDefault();
    if (!statusDraft) return;
    const options = statusDraft.map((option) => ({
      ...option,
      label: option.label.trim(),
    }));
    if (
      await mutate(
        { action: "saveStatusOptions", options },
        "Status list saved",
      )
    )
      setStatusDraft(null);
  }
  async function saveFilterLabels(e: FormEvent) {
    e.preventDefault();
    if (
      filterDraft &&
      (await mutate(
        { action: "saveFilterLabels", labels: filterDraft },
        "Dropdown labels saved",
      ))
    )
      setFilterDraft(null);
  }
  function nextRecurringDate(
    due: string,
    interval: number,
    unit: Task["recurrenceUnit"],
  ) {
    const [year, month, day] = due.split("-").map(Number);
    const amount = Math.max(1, interval || 1);

    const format = (y: number, m: number, d: number) =>
      `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    if (unit === "days") {
      const date = new Date(Date.UTC(year, month - 1, day));
      date.setUTCDate(date.getUTCDate() + amount);
      return format(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
      );
    }

    if (unit === "months") {
      const totalMonths = year * 12 + (month - 1) + amount;
      const targetYear = Math.floor(totalMonths / 12);
      const targetMonthIndex = totalMonths % 12;
      const lastDay = new Date(
        Date.UTC(targetYear, targetMonthIndex + 1, 0),
      ).getUTCDate();

      return format(
        targetYear,
        targetMonthIndex + 1,
        Math.min(day, lastDay),
      );
    }

    if (unit === "years") {
      const targetYear = year + amount;
      const lastDay = new Date(
        Date.UTC(targetYear, month, 0),
      ).getUTCDate();

      return format(targetYear, month, Math.min(day, lastDay));
    }

    return due;
  }

  async function changeStatus(t: Task, status: Status) {
    const completingRecurringTask =
      status === "Done" &&
      t.status !== "Done" &&
      Boolean(t.due) &&
      (t.recurrenceUnit || "none") !== "none";

    const saved = await mutate(
      { action: "saveTask", task: { ...t, status } },
      status === "Done" ? "Nice work. Task completed!" : "Task moved",
    );

    if (!saved || !completingRecurringTask) return;

    const nextTask: Task = {
      ...t,
      id: crypto.randomUUID(),
      status: "To do",
      due: nextRecurringDate(
        t.due,
        t.recurrenceInterval || 1,
        t.recurrenceUnit,
      ),
      subtasks: t.subtasks.map((subtask) => ({
        ...subtask,
        done: false,
      })),
    };

    await mutate(
      { action: "saveTask", task: nextTask },
      "Next recurring task created",
    );
  }
  function exportWorkspace() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            projects,
            tasks,
            sections,
            customFields,
            comments,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-life-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Workspace exported");
  }
  function fieldValue(task: Task, field: CustomField) {
    const value = task.customValues[field.id] || "";
    if (!value) return "—";
    if (field.type === "Date") return dateText(value);
    if (field.type === "Choice")
      return (
        field.options.find(
          (option) => option.id === value || option.label === value,
        )?.label || value
      );
    return value;
  }
  function workflowOption(status: Status) {
    return (
      workflowOptions.find((option) => option.id === status) ||
      defaultStatusOptions.find((option) => option.id === status)!
    );
  }
  function statusForSection(sectionId: string, current: Status) {
    const name =
      sections
        .find((s) => s.id === sectionId)
        ?.name.trim()
        .toLowerCase() || "";
    if (
      [
        "completed",
        "completer",
        "complete",
        "done",
        "terminé",
        "termine",
      ].includes(name)
    )
      return "Done";
    if (["active", "in progress", "en cours"].includes(name))
      return "In progress";
    if (["pending", "to do", "a faire", "à faire", "en attente"].includes(name))
      return "To do";
    if (["review", "in review", "révision", "revision"].includes(name))
      return "In review";
    return current;
  }
  async function moveTaskToSection(
    taskId: string,
    sectionId: string,
    beforeId?: string,
  ) {
    if (!project) return;
    const moved = tasks.find((t) => t.id === taskId);
    if (!moved) return;
    const projectTasks = tasks.filter(
      (t) => t.projectId === project.id && t.id !== taskId,
    );
    const target = projectTasks
      .filter((t) => t.sectionId === sectionId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const at = beforeId
      ? Math.max(
          0,
          target.findIndex((t) => t.id === beforeId),
        )
      : target.length;
    target.splice(at, 0, {
      ...moved,
      sectionId,
      status: statusForSection(sectionId, moved.status),
    });
    const bySection = new Map<string, Task[]>();
    for (const task of projectTasks.filter((t) => t.sectionId !== sectionId)) {
      const list = bySection.get(task.sectionId) || [];
      list.push(task);
      bySection.set(task.sectionId, list);
    }
    bySection.set(sectionId, target);
    const items = Array.from(bySection.values()).flatMap((list) =>
      list
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((task, index) => ({
          id: task.id,
          sectionId: task.sectionId,
          sortOrder: index,
          status: task.status,
        })),
    );
    await mutate(
      { action: "reorderTasks", projectId: project.id, items },
      "Task moved",
    );
  }
  async function reorderSection(dragId: string, targetId: string) {
    if (!project || dragId === targetId) return;
    const ids = projectSections.map((s) => s.id).filter((id) => id !== dragId);
    const at = ids.indexOf(targetId);
    ids.splice(at, 0, dragId);
    await mutate(
      { action: "reorderSections", projectId: project.id, ids },
      "Sections reordered",
    );
  }
  const title =
    project?.name ||
    (active === "mine"
      ? "My tasks"
      : active === "home"
        ? "A little clarity. A lot of progress."
        : "All tasks");
  const ProjectIconView = projectIcons[project?.icon || "folder"];
  const taskTextStyle = (
    task: Task,
    view: "board" | "list" | "calendar" | "overview",
  ) => ({
    fontFamily: task.fontFamily,
    fontSize: `${task.fontSize}px`,
    fontStyle: task.fontStyle === "italic" ? "italic" : "normal",
    fontWeight: task.fontStyle === "bold" ? 700 : 400,
    color:
      task[
        `${view}FontColor` as
          | "boardFontColor"
          | "listFontColor"
          | "calendarFontColor"
          | "overviewFontColor"
      ] || task.fontColor,
  });
  const renderCard = (t: Task) => (
    <article
      key={t.id}
      className={`task-card ${t.status === "Done" ? "completed" : ""} ${dragging === t.id ? "dragging" : ""}`}
      draggable={!busy}
      onDragStart={(e) => {
        setDragging(t.id);
        e.dataTransfer.setData("text/plain", t.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        setDragging(null);
        setDropTarget(null);
      }}
    >
      <div className="card-top">
        <span className={`priority priority-${t.priority.toLowerCase()}`}>
          <span />
          {t.priority}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Edit ${t.title}`}
          onClick={() => editTask(t)}
        >
          <MoreHorizontal />
        </Button>
      </div>
      <div className="card-title">
        <button
          className={`check-task ${t.status === "Done" ? "checked" : ""}`}
          disabled={busy}
          aria-label={
            t.status === "Done" ? `Reopen ${t.title}` : `Complete ${t.title}`
          }
          onClick={() =>
            changeStatus(t, t.status === "Done" ? "To do" : "Done")
          }
        >
          {t.status === "Done" && <Check size={11} />}
        </button>
        <button
          className="task-name"
          style={taskTextStyle(t, "board")}
          onClick={() => editTask(t)}
        >
          {t.title}
        </button>
      </div>
      {t.description && (
        <p className="card-description" onClick={() => editTask(t)}>
          {t.description}
        </p>
      )}
      {t.subtasks.length > 0 && (
        <div className="subtask-progress">
          <span>
            <CheckCheck size={13} />
            {t.subtasks.filter((s) => s.done).length}/{t.subtasks.length}{" "}
            subtasks
          </span>
          <div>
            <i
              style={{
                width: `${(t.subtasks.filter((s) => s.done).length / t.subtasks.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
      {!project && (
        <span className="card-project">
          {projects.find((p) => p.id === t.projectId)?.name}
        </span>
      )}
      <div className="card-footer">
        <span
          className={`due ${
            t.status === "Done" || !t.due
              ? ""
              : t.due < todayKey()
                ? "late"
                : t.due === todayKey()
                  ? "due-today"
                  : (() => {
                      const start = new Date(`${todayKey()}T00:00:00`);
                      const end = new Date(start);
                      end.setDate(end.getDate() + 7);
                      const due = new Date(`${t.due}T00:00:00`);
                      return due > start && due <= end ? "due-upcoming" : "";
                    })()
          }`}
        >
          {t.status !== "Done" && t.due && (
            <span
              aria-hidden="true"
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "999px",
                flex: "0 0 7px",
                background:
                  t.due < todayKey()
                    ? "#d94b4b"
                    : t.due === todayKey()
                      ? "#d8a800"
                      : (() => {
                          const start = new Date(`${todayKey()}T00:00:00`);
                          const end = new Date(start);
                          end.setDate(end.getDate() + 7);
                          const due = new Date(`${t.due}T00:00:00`);
                          return due > start && due <= end ? "#4f9d69" : "transparent";
                        })(),
              }}
            />
          )}
          <CalendarDays size={13} />
          {t.status !== "Done" && t.due && t.due < todayKey()
            ? `Overdue · ${dateText(t.due)}`
            : t.status !== "Done" && t.due === todayKey()
              ? `Today · ${dateText(t.due)}`
              : t.status !== "Done" && t.due
                ? (() => {
                    const start = new Date(`${todayKey()}T00:00:00`);
                    const end = new Date(start);
                    end.setDate(end.getDate() + 7);
                    const due = new Date(`${t.due}T00:00:00`);
                    return due > start && due <= end
                      ? `Upcoming · ${dateText(t.due)}`
                      : dateText(t.due);
                  })()
                : dateText(t.due)}
        </span>
        <div className="card-meta">
          {comments.filter((c) => c.task_id === t.id).length > 0 && (
            <span>
              <MessageCircle size={13} />
              {comments.filter((c) => c.task_id === t.id).length}
            </span>
          )}
          <span
            className={`avatar ${t.assignee ? "" : "unassigned"}`}
            title={t.assignee || "Unassigned"}
          >
            {t.assignee ? initials(t.assignee) : <Users size={12} />}
          </span>
        </div>
      </div>
    </article>
  );
  const listGrid = {
    gridTemplateColumns: `minmax(260px,2.6fr) ${projectFields.map(() => "minmax(145px,1fr)").join(" ")} 105px`,
  };
  const renderListRow = (t: Task) => (
    <div
      className="list-row"
      style={listGrid}
      key={t.id}
      draggable={!busy}
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData("text/plain", `task-list:${t.id}`);
        setDragging(t.id);
      }}
      onDragEnd={() => setDragging(null)}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("text/plain")) e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const data = e.dataTransfer.getData("text/plain");
        if (data.startsWith("task-list:"))
          void moveTaskToSection(data.slice(10), t.sectionId, t.id);
      }}
    >
      <div className="list-name">
        <button
          className={`check-task ${t.status === "Done" ? "checked" : ""}`}
          disabled={busy}
          onClick={() =>
            changeStatus(t, t.status === "Done" ? "To do" : "Done")
          }
          aria-label={`Toggle completion of ${t.title}`}
        >
          {t.status === "Done" && <Check size={11} />}
        </button>
        <button
          onClick={() => editTask(t)}
          className={t.status === "Done" ? "struck" : ""}
          style={taskTextStyle(t, "list")}
        >
          {t.title}
        </button>
      </div>
      {projectFields.map((field) =>
        field.type === "Choice" ? (
          <ChoiceDropdown
            key={field.id}
            label={`${field.name} for ${t.title}`}
            value={t.customValues[field.id] || ""}
            options={field.options}
            disabled={busy}
            onChange={(value) =>
              void mutate(
                {
                  action: "saveTask",
                  task: {
                    ...t,
                    customValues: { ...t.customValues, [field.id]: value },
                  },
                },
                `${field.name} updated`,
              )
            }
            onEdit={() => editField(field)}
          />
        ) : (
          <button
            className="custom-value-cell"
            key={field.id}
            onClick={() => editTask(t)}
            title={fieldValue(t, field)}
          >
            {fieldValue(t, field)}
          </button>
        ),
      )}
      <div className="row-actions">
        <button aria-label={`Edit ${t.title}`} onClick={() => editTask(t)}>
          <Pencil size={13} />
        </button>
        <button
          aria-label={`Delete ${t.title}`}
          onClick={() => {
            editTask(t);
            setConfirmDelete(true);
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
  const calendarStart = new Date(month);
  let calendarDays = 42;
  if (calendarMode === "month") {
    calendarStart.setDate(1);
    calendarStart.setDate(1 - calendarStart.getDay());
  } else if (calendarMode === "week") {
    calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());
    calendarDays = 7;
  } else if (calendarMode === "workweek") {
    calendarStart.setDate(calendarStart.getDate() - ((calendarStart.getDay() + 6) % 7));
    calendarDays = 5;
  } else {
    calendarDays = 1;
  }
  const calendarDates = Array.from({ length: calendarDays }, (_, i) => {
    const d = new Date(calendarStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const calendarTitle =
    calendarMode === "month"
      ? month.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : calendarMode === "day"
        ? month.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
        : `${calendarDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${calendarDates.at(-1)!.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  const moveCalendar = (direction: -1 | 1) => {
    const next = new Date(month);
    if (calendarMode === "month") next.setMonth(next.getMonth() + direction);
    else next.setDate(next.getDate() + direction * (calendarMode === "day" ? 1 : 7));
    setMonth(next);
  };
  return (
    <div className="app-shell">
      <Dialog
        open={availableUpdate !== null}
        onOpenChange={(open) => {
          if (!open && !updateInstalling) {
            if (availableUpdate?.version) {
              sessionStorage.setItem(
                "mylife-dismissed-update",
                availableUpdate.version,
              );
            }

            setAvailableUpdate(null);
            setUpdateError("");
            setUpdateStage("idle");
            setUpdateDownloaded(0);
            setUpdateTotal(0);
          }
        }}
      >
        <DialogContent
          style={{
            width: "min(440px, calc(100vw - 32px))",
            borderRadius: "18px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "#17171b",
            color: "#ffffff",
            padding: "26px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                background: "rgba(255,26,102,0.14)",
                color: "#ff1a66",
              }}
            >
              {updateInstalling ? (
                <Loader2
                  size={22}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Download size={22} />
              )}
            </div>

            <div>
              <DialogTitle
                style={{
                  margin: 0,
                  fontSize: "19px",
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                {updateInstalling
                  ? updateStage === "installing"
                    ? "Installing My Life"
                    : "Updating My Life"
                  : "My Life Update"}
              </DialogTitle>

              <DialogDescription
                style={{
                  marginTop: "3px",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "13px",
                }}
              >
                {updateInstalling
                  ? updateStage === "installing"
                    ? "The download is complete. My Life is installing the update."
                    : "Please keep My Life open while the update downloads."
                  : "A new version is ready to install."}
              </DialogDescription>
            </div>
          </div>

          {!updateInstalling ? (
            <>
              <div
                style={{
                  padding: "15px 16px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.05)",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  Available version
                </div>
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "22px",
                    fontWeight: 700,
                  }}
                >
                  v{availableUpdate?.version}
                </div>
              </div>

              {updateError && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "11px 13px",
                    borderRadius: "10px",
                    background: "rgba(255,70,70,0.12)",
                    color: "#ff9a9a",
                    fontSize: "13px",
                  }}
                >
                  {updateError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (availableUpdate?.version) {
                      sessionStorage.setItem(
                        "mylife-dismissed-update",
                        availableUpdate.version,
                      );
                    }

                    setAvailableUpdate(null);
                    setUpdateError("");
                    setUpdateStage("idle");
                    setUpdateDownloaded(0);
                    setUpdateTotal(0);
                  }}
                  style={{
                    borderColor: "rgba(255,255,255,0.16)",
                    background: "transparent",
                    color: "#ffffff",
                  }}
                >
                  Later
                </Button>

                <Button
                  type="button"
                  onClick={() => void installAvailableUpdate()}
                  style={{
                    background: "#ff1a66",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                  }}
                >
                  <Download size={16} />
                  Update & Install
                </Button>
              </div>
            </>
          ) : (
            <div
              style={{
                padding: "18px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              {(() => {
                const percentage =
                  updateTotal > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (updateDownloaded / updateTotal) * 100,
                        ),
                      )
                    : updateStage === "installing"
                      ? 100
                      : 0;

                const downloadedMb =
                  updateDownloaded / (1024 * 1024);
                const totalMb = updateTotal / (1024 * 1024);

                return (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <strong style={{ fontSize: "15px" }}>
                        {updateStage === "installing"
                          ? `Installing version ${availableUpdate?.version}…`
                          : `Downloading version ${availableUpdate?.version}`}
                      </strong>

                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#ff1a66",
                        }}
                      >
                        {percentage}%
                      </span>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "9px",
                        overflow: "hidden",
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.10)",
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: "100%",
                          borderRadius: "999px",
                          background: "#ff1a66",
                          transition: "width 160ms ease",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginTop: "10px",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.52)",
                      }}
                    >
                      <span>
                        {updateStage === "installing"
                          ? "Download complete"
                          : updateTotal > 0
                            ? `${downloadedMb.toFixed(1)} MB of ${totalMb.toFixed(1)} MB`
                            : "Preparing download…"}
                      </span>

                      {updateStage === "installing" && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Loader2
                            size={13}
                            style={{
                              animation: "spin 1s linear infinite",
                            }}
                          />
                          Installing…
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: "16px",
                        paddingTop: "14px",
                        borderTop:
                          "1px solid rgba(255,255,255,0.08)",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.48)",
                        textAlign: "center",
                      }}
                    >
                      {updateStage === "installing"
                        ? "My Life may close briefly while the new version is installed."
                        : "Please keep My Life open while the update downloads."}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <a className="brand" href="/" aria-label="My Life home">
          <span className="brand-mark">
            <ShootingStarIcon size={23} />
          </span>
          My Life<span className="brand-dot">.</span>
          {appVersion && (
            <span
              style={{
                marginLeft: "7px",
                fontSize: "11px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.48)",
                letterSpacing: "0.02em",
                alignSelf: "center",
              }}
            >
              v{appVersion}
            </span>
          )}
        </a>
        <div className="workspace-label">
          <span className="workspace-icon">
            {currentUser?.name?.charAt(0).toUpperCase() || "M"}
          </span>
          <div>
            <strong>
              {currentUser ? `${currentUser.name}’s workspace` : "My workspace"}
            </strong>
            <small>Personal workspace</small>
          </div>
          <LockKeyhole size={12} />
        </div>
        <nav aria-label="Main navigation">
          <button
            className={active === "home" ? "nav-item selected" : "nav-item"}
            onClick={() => navigate("home")}
          >
            <Home size={17} />
            Overview
          </button>
          <button
            className={active === "mine" ? "nav-item selected" : "nav-item"}
            onClick={() => navigate("mine")}
          >
            <CircleCheck size={17} />
            My tasks
            <span className="nav-count">
              {
                tasks.filter(
                  (t) =>
                    t.assignee.toLowerCase() ===
                      currentPersonName.toLowerCase() &&
                    t.status !== "Done",
                ).length
              }
            </span>
          </button>
          <button
            className={active === "all" ? "nav-item selected" : "nav-item"}
            onClick={() => navigate("all")}
          >
            <LayoutGrid size={17} />
            All tasks
          </button>
          <button className="nav-item" onClick={() => setPeopleOpen(true)}>
            <Users size={17} />
            People
          </button>
        </nav>
        <div className="sidebar-section-title">
          <span>PROJECTS</span>
          <button aria-label="Create project" onClick={newProject}>
            <Plus size={16} />
          </button>
        </div>
        <nav className="projects-nav" aria-label="Projects">
          {projects.map((p) => {
            const Icon = projectIcons[p.icon || "folder"];
            return (
              <button
                key={p.id}
                className={active === p.id ? "nav-item selected" : "nav-item"}
                onClick={() => navigate(p.id)}
              >
                <span className="project-nav-icon" style={{ color: p.color }}>
                  <Icon size={14} />
                </span>
                <span className="truncate"><span style={{ color: p.sidebarFontColor ?? "#ffffff" }}>{p.name}</span></span>
                <span className="nav-count">
                  {
                    tasks.filter(
                      (t) => t.projectId === p.id && t.status !== "Done",
                    ).length
                  }
                </span>
              </button>
            );
          })}
          <button className="nav-item create-project" onClick={newProject}>
            <Plus size={15} />
            Create a project
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="quiet-note">
            <Sparkles size={18} />
            <strong>Make room for good work.</strong>
            <p>
              One project. One small step.
              <br />
              One less thing on your mind.
            </p>
          </div>
          <button
            className="nav-item"
            onClick={exportWorkspace}
            disabled={loading}
          >
            <Download size={16} />
            Export workspace
          </button>
          {currentUser?.role === "admin" ? (
            <button
              className="nav-item"
              onClick={() => {
                setAdminUsersOpen(true);
                void loadAdminUsers();
              }}
            >
              <Settings2 size={16} />
              Admin Panel
            </button>
          ) : null}
          <button className="nav-item" onClick={() => setHelp(true)}>
            <CircleHelp size={16} />
            Help & getting started
          </button>
          <button
            className="nav-item"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", {
                  method: "POST",
                  credentials: "include",
                });
              } finally {
                window.location.href = "/login";
              }
            }}
          >
            Log out
          </button>
          <div className="profile">
            <span className="avatar">
              {currentUser?.name?.charAt(0).toUpperCase() || "M"}
            </span>
            <div>
              <strong>{currentUser?.name ?? "User"}</strong>
              <small>
                {currentUser?.role === "admin"
                  ? "Administrator"
                  : "Your personal space"}
              </small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <Button
            variant="ghost"
            size="icon"
            className="menu-toggle"
            aria-label="Open navigation"
            onClick={() => setMobile(true)}
          >
            <Menu />
          </Button>
          <div className="breadcrumb">
            Workspace <ChevronRight size={12} />
            <strong>
              {active === "home" ? "Overview" : project?.name || title}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="private-label">
              <LockKeyhole size={12} />
              Private workspace
            </span>
            <button
              type="button"
              className="avatar"
              aria-label="Open account"
              onClick={() => setAccountOpen(true)}
            >
              {currentUser?.name?.charAt(0).toUpperCase() || "M"}
            </button>
          </div>
        </header>
        <section className="project-header">
          <div className="project-header-art" aria-hidden="true" />
          <div className="project-heading">
            <div
              className="project-symbol"
              style={{ background: project?.color || "#727272" }}
            >
              <ProjectIconView size={25} />
            </div>
            <div>
              <div className="eyebrow">
                {active === "home"
                  ? "YOUR WORK, IN FOCUS"
                  : project
                    ? "PROJECT WORKSPACE"
                    : "YOUR WORKSPACE"}
              </div>
              <h1>{title}</h1>
            </div>
            {project && (
              <Button
                className="project-settings"
                variant="ghost"
                size="icon"
                aria-label="Edit project"
                onClick={() => {
                  setProjectDraft({
                    ...project,
                    sidebarFontColor: project.sidebarFontColor ?? "#ffffff",
                  });
                  setConfirmDelete(false);
                }}
              >
                <Settings2 />
              </Button>
            )}
          </div>
          <p>
            {project?.description ||
              (active === "mine"
                ? "A clear view of the work assigned to you."
                : "Keep your projects moving, one small step at a time.")}
          </p>
          {active === "mine" && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "10px",
                marginBottom: "10px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                role="button"
                tabIndex={0}
                onClick={() =>
                  setTaskDateFilter(taskDateFilter === "overdue" ? "all" : "overdue")
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setTaskDateFilter(
                      taskDateFilter === "overdue" ? "all" : "overdue",
                    );
                  }
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  width: "auto",
                  minWidth: 0,
                  height: "auto",
                  padding: "4px 8px",
                  borderRadius: "999px",
                  border:
                    taskDateFilter === "overdue"
                      ? "1px solid #ff1a66"
                      : "1px solid #d7d7d7",
                  background:
                    taskDateFilter === "overdue" ? "#ffe8f0" : "#f8f8f8",
                  color: "#333",
                  fontSize: "11px",
                  lineHeight: 1,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                ⚠ {overdue} Overdue
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={() =>
                  setTaskDateFilter(taskDateFilter === "today" ? "all" : "today")
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setTaskDateFilter(
                      taskDateFilter === "today" ? "all" : "today",
                    );
                  }
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  width: "auto",
                  minWidth: 0,
                  height: "auto",
                  padding: "4px 8px",
                  borderRadius: "999px",
                  border:
                    taskDateFilter === "today"
                      ? "1px solid #ff1a66"
                      : "1px solid #d7d7d7",
                  background:
                    taskDateFilter === "today" ? "#ffe8f0" : "#f8f8f8",
                  color: "#333",
                  fontSize: "11px",
                  lineHeight: 1,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                📅 {dueToday} Due Today
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={() =>
                  setTaskDateFilter(
                    taskDateFilter === "upcoming" ? "all" : "upcoming",
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setTaskDateFilter(
                      taskDateFilter === "upcoming" ? "all" : "upcoming",
                    );
                  }
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  width: "auto",
                  minWidth: 0,
                  height: "auto",
                  padding: "4px 8px",
                  borderRadius: "999px",
                  border:
                    taskDateFilter === "upcoming"
                      ? "1px solid #ff1a66"
                      : "1px solid #d7d7d7",
                  background:
                    taskDateFilter === "upcoming" ? "#ffe8f0" : "#f8f8f8",
                  color: "#333",
                  fontSize: "11px",
                  lineHeight: 1,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                🗓️ {upcoming} Upcoming
              </span>
              
            </div>
          )}
          <div className="project-summary">
            <span className="status-label">
              <span /> {overdue ? "Needs attention" : "Let’s make progress"}
            </span>
            <span>
              {completed} of {scope.length} tasks completed
            </span>
            <div className="summary-progress">
              <i
                style={{
                  width: `${scope.length ? (completed / scope.length) * 100 : 0}%`,
                }}
              />
            </div>
            {active === "welcome-project" && (
              <span className="example-label">
                Example project · make it yours
              </span>
            )}
          </div>
        </section>
        <div className="viewbar">
          <nav aria-label="Project views">
            {[
              { name: "Overview", icon: Home },
              { name: "Board", icon: LayoutGrid },
              { name: "List", icon: List },
              { name: "Calendar", icon: CalendarDays },
            ].map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={view === name ? "view-tab active" : "view-tab"}
                onClick={() => setView(name)}
              >
                <Icon size={15} />
                {name}
              </button>
            ))}
          </nav>
          <span className="saved-label">
            {busy ? (
              <>
                <Loader2 size={13} className="spin" />
                Saving…
              </>
            ) : error ? (
              "Unable to save"
            ) : loading ? (
              "Connecting…"
            ) : (
              <>
                <Check size={13} />
                Changes saved
              </>
            )}
          </span>
        </div>
        {error && (
          <div className="error-banner" role="alert">
            {error}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setError("");
                void initialize();
              }}
            >
              Retry
            </Button>
          </div>
        )}
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spin" />
            <h2>Opening your workspace…</h2>
          </div>
        ) : (
          <>
            <div className="toolbar">
              <div className="search-box">
                <Search size={16} />
                <Input
                  aria-label="Search tasks"
                  placeholder="Search tasks…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="toolbar-actions">
                <NativeSelect
                  aria-label="Filter priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option>All priorities</option>
                  {(["High", "Medium", "Low"] as const).map((value) => (
                    <option key={value} value={value}>
                      {filterLabels.priority[value]}
                    </option>
                  ))}
                </NativeSelect>
                <NativeSelect
                  aria-label="Filter status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {workflowOption(s).label}
                    </option>
                  ))}
                </NativeSelect>
                <NativeSelect
                  aria-label="Sort tasks"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {(["Default", "Smart / Urgency", "Due date", "Priority", "Name"] as const).map(
                    (value) => (
                      <option key={value} value={value}>
                        {filterLabels.sort[value]}
                      </option>
                    ),
                  )}
                </NativeSelect>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Edit dropdown entries"
                  onClick={() =>
                    setFilterDraft(JSON.parse(JSON.stringify(filterLabels)))
                  }
                >
                  <Pencil size={14} />
                </Button>
                <Button onClick={() => newTask()} disabled={busy}>
                  <Plus size={15} />
                  Add task
                </Button>
              </div>
            </div>
            {view === "Board" && (
              <div className="board">
                {statuses.map((status) => (
                  <section
                    key={status}
                    className={`board-column ${dropTarget === status ? "drop-target" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropTarget(status);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node))
                        setDropTarget(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const task = tasks.find(
                        (t) => t.id === e.dataTransfer.getData("text/plain"),
                      );
                      if (task && !busy && task.status !== status)
                        changeStatus(task, status);
                      setDropTarget(null);
                      setDragging(null);
                    }}
                  >
                    <div className="column-header">
                      <span
                        className="column-dot"
                        style={{ background: workflowOption(status).color }}
                      />
                      <h2>{workflowOption(status).label}</h2>
                      <span className="column-count">
                        {filtered.filter((t) => t.status === status).length}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Add ${workflowOption(status).label} task`}
                        onClick={() => newTask(status)}
                      >
                        <Plus />
                      </Button>
                    </div>
                    <div className="column-cards">
                      {filtered
                        .filter((t) => t.status === status)
                        .map(renderCard)}
                      {!filtered.some((t) => t.status === status) && (
                        <div className="empty-column">
                          <span>
                            {query ||
                            priority !== "All priorities" ||
                            statusFilter !== "All statuses"
                              ? "No matching tasks"
                              : "A little space for what’s next."}
                          </span>
                        </div>
                      )}
                      <button
                        className="add-column-task"
                        onClick={() => newTask(status)}
                      >
                        <Plus size={14} />
                        Add task
                      </button>
                    </div>
                  </section>
                ))}
              </div>
            )}
            {view === "List" && (
              <div className="list-view-wrap">
                {project && (
                  <div className="list-customize">
                    <span>
                      Organize this list with sections and your own columns.
                    </span>
                    <Button variant="outline" size="sm" onClick={newSection}>
                      <Plus size={14} />
                      Add section
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setColumnsOpen(true)}
                    >
                      <Columns3 size={14} />
                      Columns
                    </Button>
                  </div>
                )}
                <div className="task-list">
                  <div className="list-head" style={listGrid}>
                    <span>Task name</span>
                    {projectFields.map((field) => (
                      <button
                        key={field.id}
                        className="custom-column-head"
                        onClick={() => editField(field)}
                        title={`Edit ${field.name}`}
                      >
                        <span>{field.name}</span>
                        <small>{field.type}</small>
                      </button>
                    ))}
                    <button
                      className="add-column-head"
                      disabled={!project}
                      onClick={newField}
                    >
                      <Plus size={13} />
                      {project ? "Add column" : "Open a project"}
                    </button>
                  </div>
                  {project ? (
                    <>
                      {[
                        {
                          id: "",
                          projectId: project.id,
                          name: "No section",
                        } as Section,
                        ...projectSections,
                      ].map((section) => {
                        const sectionTasks = filtered.filter(
                            (t) => t.sectionId === section.id,
                          ),
                          collapsed = collapsedSections.includes(
                            section.id || "none",
                          );
                        if (section.id === "" && projectSections.length === 0)
                          return sectionTasks.map(renderListRow);
                        if (section.id === "" && !sectionTasks.length)
                          return null;
                        return (
                          <section
                            className="list-section"
                            key={section.id || "none"}
                            draggable={!!section.id && !busy}
                            onDragStart={(e) => {
                              if (!section.id) return;
                              e.dataTransfer.setData(
                                "text/plain",
                                `section:${section.id}`,
                              );
                              setDragging(section.id);
                            }}
                            onDragEnd={() => setDragging(null)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const data = e.dataTransfer.getData("text/plain");
                              if (data.startsWith("section:") && section.id)
                                void reorderSection(data.slice(8), section.id);
                              else if (data.startsWith("task-list:"))
                                void moveTaskToSection(
                                  data.slice(10),
                                  section.id,
                                );
                            }}
                          >
                            <div className="list-section-head">
                              {section.id && (
                                <GripVertical
                                  size={15}
                                  className="section-grip"
                                />
                              )}
                              <button
                                aria-label={
                                  collapsed
                                    ? `Expand ${section.name}`
                                    : `Collapse ${section.name}`
                                }
                                onClick={() =>
                                  setCollapsedSections((current) =>
                                    current.includes(section.id || "none")
                                      ? current.filter(
                                          (id) => id !== (section.id || "none"),
                                        )
                                      : [...current, section.id || "none"],
                                  )
                                }
                              >
                                <ChevronDown
                                  size={15}
                                  className={
                                    collapsed ? "collapsed-chevron" : ""
                                  }
                                />
                              </button>
                              <strong>{section.name}</strong>
                              <span>{sectionTasks.length}</span>
                              <button
                                className="section-add-task"
                                onClick={() => newTask("To do", section.id)}
                              >
                                <Plus size={13} />
                                Add task
                              </button>
                              {section.id && (
                                <button
                                  className="section-menu"
                                  aria-label={`Edit ${section.name}`}
                                  onClick={() => {
                                    setSectionDraft({ ...section });
                                    setConfirmDelete(false);
                                  }}
                                >
                                  <MoreHorizontal size={16} />
                                </button>
                              )}
                            </div>
                            {!collapsed && sectionTasks.map(renderListRow)}
                          </section>
                        );
                      })}
                    </>
                  ) : (
                    filtered.map(renderListRow)
                  )}
                  {!filtered.length && (
                    <div className="empty-state">
                      <CircleCheck />
                      <h3>No tasks here yet</h3>
                      <p>Add a task or adjust your filters.</p>
                    </div>
                  )}
                  <div className="list-bottom-actions">
                    <button
                      className="add-column-task"
                      onClick={() => newTask()}
                    >
                      <Plus size={14} />
                      Add task
                    </button>
                    {project && (
                      <button className="add-column-task" onClick={newSection}>
                        <Plus size={14} />
                        Add section
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {view === "Calendar" && (
              <div className="calendar-wrap">
                <div className="calendar-heading">
                  <h2>{calendarTitle}</h2>
                  <div>
                    <div className="calendar-view-switcher" aria-label="Calendar view">
                      {([
                        ["day", "Day"],
                        ["workweek", "Work week"],
                        ["week", "Week"],
                        ["month", "Month"],
                      ] as const).map(([mode, label]) => (
                        <Button
                          key={mode}
                          variant={calendarMode === mode ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCalendarMode(mode)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMonth(
                          new Date(
                          new Date(),
                          ),
                        )
                      }
                    >
                      Today
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Previous month"
                      onClick={() =>
                        moveCalendar(-1)
                      }
                    >
                      <ChevronLeft />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Next month"
                      onClick={() =>
                        moveCalendar(1)
                      }
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
                <div
                  className={`calendar-grid calendar-grid--${calendarMode}`}
                  style={{ gridTemplateColumns: `repeat(${calendarDays === 42 ? 7 : calendarDays}, minmax(0, 1fr))` }}
                >
                  {calendarDates.slice(0, calendarDays === 42 ? 7 : calendarDays).map(
                    (d) => (
                      <div className="weekday" key={d.toISOString()}>
                        {d.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                    ),
                  )}
                  {calendarDates.map((d) => {
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    return (
                      <div
                        key={key}
                        className={`calendar-day ${calendarMode === "month" && d.getMonth() !== month.getMonth() ? "other-month" : ""}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const task = tasks.find(
                            (t) =>
                              t.id === e.dataTransfer.getData("text/plain"),
                          );
                          if (task && !busy && task.due !== key)
                            void mutate(
                              {
                                action: "saveTask",
                                task: { ...task, due: key },
                              },
                              `Moved to ${dateText(key)}`,
                            );
                          setDragging(null);
                        }}
                      >
                        <span className={key === todayKey() ? "today" : ""}>
                          {d.getDate()}
                        </span>
                        {filtered
                          .filter((t) => t.due === key)
                          .map((t) => (
                            <div className="calendar-entry" key={t.id}>
                              <button
                                draggable={!busy}
                                onDragStart={(e) => {
                                  setDragging(t.id);
                                  e.dataTransfer.setData("text/plain", t.id);
                                  e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragEnd={() => setDragging(null)}
                                className={`calendar-task ${t.status === "Done" ? "struck" : ""} ${dragging === t.id ? "dragging" : ""}`}
                                style={{
                                  background: t.color || "#e5e5e5",
                                  ...taskTextStyle(t, "calendar"),
                                }}
                                onClick={() => editTask(t)}
                              >
                                {t.dueTime && (
                                  <span className="calendar-entry-time">
                                    {t.dueTime}
                                    {t.endTime && `–${t.endTime}`}
                                  </span>
                                )}
                                <span className="calendar-task-title">
                                  {t.title}
                                  {t.emoji && ` ${t.emoji}`}
                                </span>
                              </button>
                            </div>
                          ))}
                      </div>
                    );
                  })}
                </div>
                <p className="calendar-note">
                  Drag a task to another day to reschedule it ·{" "}
                  {filtered.filter((t) => !t.due).length} tasks without a due
                  date.
                </p>
              </div>
            )}
            {view === "Overview" && (
              <div className="overview">
                <div className="overview-stats">
                  {[
                    {
                      label: "Total tasks",
                      number: scope.length,
                      icon: FolderKanban,
                    },
                    {
                      label: "In progress",
                      number: scope.filter((t) => t.status === "In progress")
                        .length,
                      icon: ArrowUpRight,
                    },
                    {
                      label: "Completed",
                      number: completed,
                      icon: CircleCheck,
                    },
                    { label: "Overdue", number: overdue, icon: Flag },
                  ].map(({ label, number, icon: Icon }) => (
                    <div className="stat" key={label}>
                      <div>
                        <span>{label}</span>
                        <Icon size={17} />
                      </div>
                      <strong>{number}</strong>
                    </div>
                  ))}
                </div>
                <div className="overview-columns">
                  <section className="overview-panel">
                    <div className="panel-title">
                      <h2>Coming up next</h2>
                      <span>Your next small steps</span>
                    </div>
                    {filtered
                      .filter((t) => t.status !== "Done")
                      .sort((a, b) =>
                        (a.due || "9999").localeCompare(b.due || "9999"),
                      )
                      .slice(0, 6)
                      .map((t) => (
                        <button
                          className="upcoming-task"
                          key={t.id}
                          onClick={() => editTask(t)}
                        >
                          <span
                            className="column-dot"
                            style={{
                              background: workflowOption(t.status).color,
                            }}
                          />
                          <span style={taskTextStyle(t, "overview")}>
                            {t.title}
                          </span>
                          <small
                            className={
                              t.due && t.due < todayKey() ? "late" : ""
                            }
                          >
                            {dateText(t.due)}
                          </small>
                          <ChevronRight size={14} />
                        </button>
                      ))}
                    {!filtered.some((t) => t.status !== "Done") && (
                      <div className="empty-state">
                        <CheckCheck />
                        <h3>You’re all caught up.</h3>
                        <p>Add something new when you’re ready.</p>
                      </div>
                    )}
                  </section>
                  <section className="overview-panel">
                    <div className="panel-title">
                      <h2>Project progress</h2>
                      <button aria-label="Create project" onClick={newProject}>
                        <Plus size={17} />
                      </button>
                    </div>
                    {(project ? [project] : projects).map((p) => {
                      const pt = tasks.filter((t) => t.projectId === p.id),
                        done = pt.filter((t) => t.status === "Done").length;
                      return (
                        <button
                          className="project-progress-row"
                          key={p.id}
                          onClick={() => navigate(p.id)}
                        >
                          <div>
                            <span
                              className="project-dot"
                              style={{ background: p.color }}
                            />
                            <strong>{p.name}</strong>
                            <small>
                              {pt.length
                                ? Math.round((done / pt.length) * 100)
                                : 0}
                              %
                            </small>
                          </div>
                          <div className="summary-progress">
                            <i
                              style={{
                                width: `${pt.length ? (done / pt.length) * 100 : 0}%`,
                                background: p.color,
                              }}
                            />
                          </div>
                          <small>
                            {done} of {pt.length} tasks complete
                          </small>
                        </button>
                      );
                    })}
                    {!projects.length && (
                      <div className="empty-state">
                        <p>Create your first project to get started.</p>
                        <Button onClick={newProject}>Create project</Button>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )}
            <footer className="workspace-footer">
              <span>
                <LockKeyhole size={11} /> A private space for your next big
                thing.
              </span>
              <span>
                {filtered.length} tasks{" "}
                {query ||
                priority !== "All priorities" ||
                statusFilter !== "All statuses"
                  ? "matching filters"
                  : "in this view"}
              </span>
            </footer>
          </>
        )}

      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent style={{ maxWidth: "440px" }}>
          <DialogTitle>My account</DialogTitle>
          <DialogDescription>
            Your My Life account information.
          </DialogDescription>

          <div style={{ display: "grid", gap: "14px", marginTop: "16px" }}>
            <div>
              <strong>{currentUser?.name}</strong>
              <div style={{ opacity: 0.7 }}>{currentUser?.email}</div>
            </div>

            <div>
              Role: {currentUser?.role === "admin" ? "Administrator" : "User"}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={openChangePassword}
            >
              Change password
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await fetch("/api/auth/logout", {
                  method: "POST",
                  credentials: "include",
                });
                window.location.href = "/login";
              }}
            >
              Log out
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={changePasswordOpen}
        onOpenChange={(open) => {
          setChangePasswordOpen(open);

          if (!open) {
            setCurrentPassword("");
            setNewAccountPassword("");
            setConfirmAccountPassword("");
            setAccountPasswordError("");
          }
        }}
      >
        <DialogContent style={{ maxWidth: "480px" }}>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Enter your current password, then choose a new one.
          </DialogDescription>

          <form
            onSubmit={saveAccountPassword}
            style={{ display: "grid", gap: "14px", marginTop: "16px" }}
          >
            <label>
              Current password
              <Input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </label>

            <label>
              New password
              <Input
                type="password"
                value={newAccountPassword}
                onChange={(event) => setNewAccountPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>

            <label>
              Confirm new password
              <Input
                type="password"
                value={confirmAccountPassword}
                onChange={(event) =>
                  setConfirmAccountPassword(event.target.value)
                }
                minLength={8}
                required
              />
            </label>

            {accountPasswordError ? (
              <div style={{ color: "#a40000" }}>
                {accountPasswordError}
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setChangePasswordOpen(false)}
              >
                Cancel
              </Button>

              <Button type="submit">Change password</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={adminUsersOpen} onOpenChange={setAdminUsersOpen}>
        <DialogContent style={{ maxWidth: "760px" }}>
          <DialogTitle>Admin Panel</DialogTitle>
          <DialogDescription>
            Create and manage accounts that can sign in to My Life.
          </DialogDescription>

          <form
            onSubmit={createAdminUser}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            <Input
              placeholder="Name"
              value={newUserName}
              onChange={(event) => setNewUserName(event.target.value)}
              required
            />

            <Input
              type="email"
              placeholder="Email"
              value={newUserEmail}
              onChange={(event) => setNewUserEmail(event.target.value)}
              required
            />
              <Input
                required
                type="tel"
                placeholder="Cell number (+18195550123)"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
              />

            <Input
              type="password"
              placeholder="Temporary password"
              value={newUserPassword}
              onChange={(event) => setNewUserPassword(event.target.value)}
              minLength={8}
              required
            />

            <NativeSelect
              value={newUserRole}
              onChange={(event) =>
                setNewUserRole(event.target.value as "admin" | "user")
              }
            >
              <option value="user">User</option>
              <option value="admin">Administrator</option>
            </NativeSelect>

            <div style={{ gridColumn: "1 / -1" }}>
              <Button type="submit">Create user</Button>
            </div>
          </form>

          {adminUsersError ? (
            <div
              style={{
                marginTop: "14px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#fff1f1",
                color: "#a40000",
              }}
            >
              {adminUsersError}
            </div>
          ) : null}

          <div
            style={{
              display: "grid",
              gap: "10px",
              marginTop: "20px",
              maxHeight: "380px",
              overflowY: "auto",
            }}
          >
            {adminUsersLoading ? (
              <div>Loading users...</div>
            ) : (
              adminUsers.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1.8fr auto auto auto",
                    gap: "10px",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  <div>
                    <strong>{user.name}</strong>
                    {!user.active ? (
                      <small style={{ display: "block", opacity: 0.6 }}>
                        Disabled
                      </small>
                    ) : null}
                  </div>

                  <div style={{ fontSize: "14px" }}>{user.email}</div>

                  <NativeSelect
                    value={user.role}
                    onChange={(event) =>
                      void updateAdminUser(user.id, {
                        role: event.target.value as "admin" | "user",
                      })
                    }
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </NativeSelect>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      void updateAdminUser(user.id, {
                        active: !user.active,
                      })
                    }
                  >
                    {user.active ? "Disable" : "Enable"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openEditAdminUser(user)}
                  >
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openResetPassword(user)}
                  >
                    Reset password
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeleteAdminUser(user)}
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteAdminUser !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteAdminUser(null);
        }}
      >
        <DialogContent style={{ maxWidth: "480px" }}>
          <DialogTitle>Delete user?</DialogTitle>
          <DialogDescription>
            {deleteAdminUser
              ? `Permanently delete ${deleteAdminUser.name}'s login account? Their People entry and existing tasks will not be deleted.`
              : "Permanently delete this login account?"}
          </DialogDescription>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteAdminUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void deleteSelectedAdminUser()}
            >
              Delete user
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingAdminUser !== null}
        onOpenChange={(open) => {
          if (!open) setEditingAdminUser(null);
        }}
      >
        <DialogContent style={{ maxWidth: "520px" }}>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            Update this user's account information and permissions.
          </DialogDescription>

          <form
            onSubmit={saveEditedAdminUser}
            style={{ display: "grid", gap: "14px", marginTop: "16px" }}
          >
            <label>
              Name
              <Input
                value={editAdminUserName}
                onChange={(event) => setEditAdminUserName(event.target.value)}
                required
              />
            </label>
            <label>
              Cell Number
              <Input
                required
                type="tel"
                placeholder="6133168197"
                value={editAdminUserPhone}
                onChange={(event) => setEditAdminUserPhone(event.target.value)}
              />
            </label>

            <label>
              Email
              <Input
                type="email"
                value={editAdminUserEmail}
                onChange={(event) => setEditAdminUserEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Role
              <NativeSelect
                value={editAdminUserRole}
                onChange={(event) =>
                  setEditAdminUserRole(event.target.value as "admin" | "user")
                }
              >
                <option value="user">User</option>
                <option value="admin">Administrator</option>
              </NativeSelect>
            </label>

            <label>
              <input
                type="checkbox"
                checked={editAdminUserActive}
                onChange={(event) =>
                  setEditAdminUserActive(event.target.checked)
                }
              />{" "}
              Account enabled
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingAdminUser(null)}
              >
                Cancel
              </Button>

              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={resetPasswordUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setResetPasswordUser(null);
            setResetPasswordValue("");
            setResetPasswordConfirm("");
          }
        }}
      >
        <DialogContent style={{ maxWidth: "480px" }}>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            {resetPasswordUser
              ? `Set a new password for ${resetPasswordUser.name}.`
              : "Set a new password."}
          </DialogDescription>

          <form
            onSubmit={saveResetPassword}
            style={{ display: "grid", gap: "14px", marginTop: "16px" }}
          >
            <label>
              New password
              <Input
                type="password"
                value={resetPasswordValue}
                onChange={(event) =>
                  setResetPasswordValue(event.target.value)
                }
                minLength={8}
                required
              />
            </label>

            <label>
              Confirm password
              <Input
                type="password"
                value={resetPasswordConfirm}
                onChange={(event) =>
                  setResetPasswordConfirm(event.target.value)
                }
                minLength={8}
                required
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setResetPasswordUser(null);
                  setResetPasswordValue("");
                  setResetPasswordConfirm("");
                }}
              >
                Cancel
              </Button>

              <Button type="submit">Reset password</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </main>
      {notice && (
        <div className="toast" role="status">
          <CircleCheck size={16} />
          {notice}
        </div>
      )}
      <Dialog open={peopleOpen} onOpenChange={setPeopleOpen}>
        <DialogContent>
          <DialogTitle>People</DialogTitle>
          <DialogDescription>Add people you assign tasks to. SMS is sent only when an assignee changes and their notifications are enabled.</DialogDescription>
          {personDraft ? (
            <form onSubmit={savePerson} className="editor-form">
              <label>Name<Input autoFocus required maxLength={100} value={personDraft.name} onChange={(e) => setPersonDraft({ ...personDraft, name: e.target.value })} /></label>
              <label>Mobile phone number<Input required placeholder="+18195550123" value={personDraft.phone} onChange={(e) => setPersonDraft({ ...personDraft, phone: e.target.value })} /></label>
              <label className="checkbox-row"><input type="checkbox" checked={personDraft.smsEnabled} onChange={(e) => setPersonDraft({ ...personDraft, smsEnabled: e.target.checked })} /> Send SMS notifications for new assignments</label>
              <div className="editor-footer"><Button type="button" variant="ghost" onClick={() => setPersonDraft(null)}>Cancel</Button><Button type="submit" disabled={busy}>Save person</Button></div>
            </form>
          ) : (
            <>
              <Button onClick={newPerson}><Plus size={15} /> Add person</Button>
              <div className="people-list">
                {people.map((person) => <div className="person-row" key={person.id}><div><strong>{person.name}</strong><small>{person.phone} · SMS {person.smsEnabled ? "on" : "off"}</small></div><Button variant="ghost" size="sm" disabled={!person.smsEnabled || busy} onClick={() => void testSms(person)}>Test SMS</Button><Button variant="ghost" size="icon" aria-label={`Edit ${person.name}`} onClick={() => setPersonDraft({ ...person })}><Pencil size={14} /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${person.name}`} onClick={() => void mutate({ action: "deletePerson", id: person.id }, "Person deleted")}><Trash2 size={14} /></Button></div>)}
                {!people.length && <p className="calendar-note">Add a person to assign tasks and optionally notify them by SMS.</p>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!draft}
        onOpenChange={(open) => {
          if (!open && !busy) setDraft(null);
        }}
      >
        <DialogContent className="task-dialog">
          <DialogTitle>
            {tasks.some((t) => t.id === draft?.id)
              ? "Task details"
              : "A new small step"}
          </DialogTitle>
          <DialogDescription>
            Give your work a clear next step.
          </DialogDescription>
          {draft && (
            <form onSubmit={saveTask} className="editor-form">
              <label>
                Task name
                <Input
                  autoFocus
                  required
                  maxLength={250}
                  value={draft.title}
                  placeholder="What needs to get done?"
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                />
              </label>
              <div className="form-grid">
                <label>
                  Project
                  <NativeSelect
                    value={draft.projectId}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        projectId: e.target.value,
                        sectionId: "",
                        customValues: {},
                      })
                    }
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </NativeSelect>
                </label>
                <label>
                  Section
                  <NativeSelect
                    value={draft.sectionId}
                    onChange={(e) =>
                      setDraft({ ...draft, sectionId: e.target.value })
                    }
                  >
                    <option value="">No section</option>
                    {sections
                      .filter((s) => s.projectId === draft.projectId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </NativeSelect>
                </label>
                <label>
                  Status
                  <ChoiceDropdown
                    label="Status"
                    value={draft.status}
                    options={workflowOptions}
                    onChange={(value) =>
                      setDraft({ ...draft, status: value as Status })
                    }
                    onEdit={editStatusField}
                  />
                </label>
                <label>
                  Assignee
                  <NativeSelect
                    value={draft.assignee}
                    onChange={(e) =>
                      setDraft({ ...draft, assignee: e.target.value })
                    }
                  >
                    <option value="">Unassigned</option>
                    {people.map((person) => <option key={person.id} value={person.name}>{person.name}</option>)}
                  </NativeSelect>
                </label>
                <label>
                  Due date
                  <Input
                    type="date"
                    value={draft.due}
                    onChange={(e) =>
                      setDraft({ ...draft, due: e.target.value })
                    }
                  />
                </label>
                <label>
                  Time
                  <Input
                    type="time"
                    value={draft.dueTime}
                    onChange={(e) =>
                      setDraft({ ...draft, dueTime: e.target.value })
                    }
                  />
                </label>
                <label>
                  End time
                  <Input
                    type="time"
                    value={draft.endTime}
                    min={draft.dueTime || undefined}
                    onChange={(e) =>
                      setDraft({ ...draft, endTime: e.target.value })
                    }
                  />
                </label>
                <label>
                  Repeat
                  <NativeSelect
                    value={draft.recurrenceUnit || "none"}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        recurrenceUnit: e.target.value as Task["recurrenceUnit"],
                      })
                    }
                  >
                    <option value="none">Does not repeat</option>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </NativeSelect>
                </label>
                {(draft.recurrenceUnit || "none") !== "none" && (
                  <label>
                    Repeat every
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Input
                        type="number"
                        min={1}
                        max={999}
                        value={draft.recurrenceInterval || 1}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            recurrenceInterval: Math.max(
                              1,
                              Number.parseInt(e.target.value || "1", 10),
                            ),
                          })
                        }
                      />
                      <span>
                        {draft.recurrenceUnit === "days"
                          ? "day(s)"
                          : draft.recurrenceUnit === "months"
                            ? "month(s)"
                            : "year(s)"}
                      </span>
                    </div>
                  </label>
                )}
                <label>
                  Priority
                  <NativeSelect
                    value={draft.priority}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        priority: e.target.value as Task["priority"],
                      })
                    }
                  >
                    {["Low", "Medium", "High"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </NativeSelect>
                </label>
                <div className="task-color-control">
                  <span>Calendar entry color</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="task-color-trigger"
                        aria-label="Choose calendar entry color"
                      >
                        <i style={{ background: draft.color || "#e5e5e5" }} />
                        <span>
                          {draft.color === "#e5e5e5"
                            ? "Default gray"
                            : "Custom color"}
                        </span>
                        <ChevronDown size={15} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="color-palette">
                      <strong>Task color</strong>
                      <div>
                        {choicePalette.map((color) => (
                          <button
                            type="button"
                            key={color}
                            aria-label={`Choose ${color}`}
                            aria-pressed={draft.color === color}
                            style={{ background: color }}
                            onClick={() => setDraft({ ...draft, color })}
                          >
                            {draft.color === color && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="reset-task-color"
                        onClick={() => setDraft({ ...draft, color: "#e5e5e5" })}
                      >
                        Use default gray
                      </button>
                    </PopoverContent>
                  </Popover>
                </div>
                <label>
                  Emoji
                  <NativeSelect
                    value={draft.emoji}
                    onChange={(e) =>
                      setDraft({ ...draft, emoji: e.target.value })
                    }
                  >
                    {emojis.map((emoji) => (
                      <option key={emoji || "none"} value={emoji}>
                        {emoji || "No emoji"}
                      </option>
                    ))}
                  </NativeSelect>
                </label>
                <label>
                  Calendar font
                  <NativeSelect
                    value={draft.fontFamily}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        fontFamily: e.target.value as Task["fontFamily"],
                      })
                    }
                  >
                    {[
                      "Arial",
                      "Georgia",
                      "Verdana",
                      "Trebuchet MS",
                      "Courier New",
                      "Comic Sans MS",
                      "Monotype Corsiva",
                    ].map((font) => (
                      <option key={font}>{font}</option>
                    ))}
                  </NativeSelect>
                </label>
                <label>
                  Font size
                  <NativeSelect
                    value={draft.fontSize}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        fontSize: e.target.value as Task["fontSize"],
                      })
                    }
                  >
                    {["9", "10", "11", "12", "14", "16"].map((size) => (
                      <option key={size} value={size}>
                        {size} px
                      </option>
                    ))}
                  </NativeSelect>
                </label>
                <label>
                  Font style
                  <NativeSelect
                    value={draft.fontStyle}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        fontStyle: e.target.value as Task["fontStyle"],
                      })
                    }
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="italic">Italic</option>
                  </NativeSelect>
                </label>
                <fieldset className="view-font-colors">
                  <legend>Text color by view</legend>
                  <div className="view-font-color-grid">
                    {[
                      ["Board", "boardFontColor"],
                      ["List", "listFontColor"],
                      ["Calendar", "calendarFontColor"],
                      ["Overview", "overviewFontColor"],
                    ].map(([label, key]) => (
                      <label key={key}>
                        {label}
                        <div className="font-color-row">
                          <Input
                            type="color"
                            value={draft[key as keyof Task] as string}
                            onChange={(e) =>
                              setDraft({ ...draft, [key]: e.target.value })
                            }
                          />
                          <span>{draft[key as keyof Task] as string}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {customFields
                  .filter((f) => f.projectId === draft.projectId)
                  .map((field) => (
                    <label key={field.id}>
                      {field.name}
                      {field.type === "Choice" ? (
                        <ChoiceDropdown
                          label={field.name}
                          value={draft.customValues[field.id] || ""}
                          options={field.options}
                          onChange={(value) =>
                            setDraft({
                              ...draft,
                              customValues: {
                                ...draft.customValues,
                                [field.id]: value,
                              },
                            })
                          }
                          onEdit={() => editField(field)}
                        />
                      ) : (
                        <Input
                          type={
                            field.type === "Number"
                              ? "number"
                              : field.type === "Date"
                                ? "date"
                                : "text"
                          }
                          maxLength={field.type === "Text" ? 5000 : undefined}
                          value={draft.customValues[field.id] || ""}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              customValues: {
                                ...draft.customValues,
                                [field.id]: e.target.value,
                              },
                            })
                          }
                        />
                      )}
                    </label>
                  ))}
              </div>
              <label>
                Description
                <Textarea
                  rows={3}
                  maxLength={10000}
                  placeholder="Add details, context, or useful links…"
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </label>
              <div className="subtasks-editor">
                <strong>
                  Subtasks{" "}
                  <small>
                    {draft.subtasks.filter((s) => s.done).length}/
                    {draft.subtasks.length}
                  </small>
                </strong>
                {draft.subtasks.map((s) => (
                  <div className="subtask-row" key={s.id}>
                    <input
                      type="checkbox"
                      aria-label={`Complete ${s.title}`}
                      checked={s.done}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          subtasks: draft.subtasks.map((x) =>
                            x.id === s.id
                              ? { ...x, done: e.target.checked }
                              : x,
                          ),
                        })
                      }
                    />
                    <span className={s.done ? "struck" : ""}>{s.title}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${s.title}`}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          subtasks: draft.subtasks.filter((x) => x.id !== s.id),
                        })
                      }
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="inline-input">
                  <Input
                    placeholder="Add a subtask…"
                    aria-label="New subtask"
                    value={subtask}
                    maxLength={250}
                    onChange={(e) => setSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (subtask.trim()) {
                          setDraft({
                            ...draft,
                            subtasks: [
                              ...draft.subtasks,
                              {
                                id: crypto.randomUUID(),
                                title: subtask.trim(),
                                done: false,
                              },
                            ],
                          });
                          setSubtask("");
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!subtask.trim()}
                    onClick={() => {
                      setDraft({
                        ...draft,
                        subtasks: [
                          ...draft.subtasks,
                          {
                            id: crypto.randomUUID(),
                            title: subtask.trim(),
                            done: false,
                          },
                        ],
                      });
                      setSubtask("");
                    }}
                  >
                    <Plus size={15} />
                    <span className="sr-only">Add subtask</span>
                  </Button>
                </div>
              </div>
              {tasks.some((t) => t.id === draft.id) && (
                <div className="comments-editor">
                  <strong>Comments</strong>
                  {comments
                    .filter((c) => c.task_id === draft.id)
                    .map((c) => (
                      <div className="comment" key={c.id}>
                        <span className="avatar">M</span>
                        <div>
                          <small>
                            Workspace note ·{" "}
                            {new Date(c.created_at).toLocaleString()}
                          </small>
                          <p>{c.body}</p>
                        </div>
                      </div>
                    ))}
                  <div className="inline-input">
                    <Input
                      placeholder="Leave a note…"
                      aria-label="Comment"
                      maxLength={4000}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!comment.trim() || busy}
                      onClick={async () => {
                        if (
                          await mutate(
                            {
                              action: "comment",
                              taskId: draft.id,
                              body: comment,
                            },
                            "Comment added",
                          )
                        )
                          setComment("");
                      }}
                    >
                      Post
                    </Button>
                  </div>
                  <small>
                    Comments save when posted. Task edits save below.
                  </small>
                </div>
              )}
              {error && (
                <p className="inline-error" role="alert">
                  {error}
                </p>
              )}
              <div className="editor-footer">
                {tasks.some((t) => t.id === draft.id) && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="delete-button"
                    disabled={busy}
                    onClick={async () => {
                      if (!confirmDelete) {
                        setConfirmDelete(true);
                        return;
                      }
                      if (
                        await mutate(
                          { action: "deleteTask", id: draft.id },
                          "Task deleted",
                        )
                      )
                        setDraft(null);
                    }}
                  >
                    <Trash2 size={15} />
                    {confirmDelete ? "Confirm delete" : "Delete"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setDraft(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={busy || !draft.title.trim()}>
                  {busy ? "Saving…" : "Save task"}
                </Button>
              </div>
              {confirmDelete && (
                <p className="inline-error">
                  Click “Confirm delete” to permanently remove this task and its
                  comments.
                </p>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!projectDraft}
        onOpenChange={(open) => {
          if (!open && !busy) setProjectDraft(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {projects.some((p) => p.id === projectDraft?.id)
              ? "Edit project"
              : "Create a project"}
          </DialogTitle>
          <DialogDescription>
            A home for everything you’re working toward.
          </DialogDescription>
          {projectDraft && (
            <form onSubmit={saveProject} className="editor-form">
              <label>
                Project name
                <Input
                  autoFocus
                  required
                  maxLength={100}
                  placeholder="e.g. Home projects"
                  value={projectDraft.name}
                  onChange={(e) =>
                    setProjectDraft({ ...projectDraft, name: e.target.value })
                  }
                />
              </label>
              <label>
                Description
                <Textarea
                  maxLength={2000}
                  value={projectDraft.description}
                  placeholder="What would you like to achieve?"
                  onChange={(e) =>
                    setProjectDraft({
                      ...projectDraft,
                      description: e.target.value,
                    })
                  }
                />
              </label>
              <fieldset>
                <legend>Project color</legend>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="color"
                    aria-label="Choose project color"
                    value={projectDraft.color}
                    onChange={(e) =>
                      setProjectDraft({
                        ...projectDraft,
                        color: e.target.value.toUpperCase(),
                      })
                    }
                    style={{
                      width: 54,
                      height: 40,
                      padding: 2,
                      cursor: "pointer",
                    }}
                  />
                  <Input
                    aria-label="Project color hex value"
                    value={projectDraft.color}
                    maxLength={7}
                    style={{ width: 115 }}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(value)) {
                        setProjectDraft({
                          ...projectDraft,
                          color: value,
                        });
                      }
                    }}
                    onBlur={() => {
                      if (!/^#[0-9a-fA-F]{6}$/.test(projectDraft.color)) {
                        setProjectDraft({
                          ...projectDraft,
                          color: "#658373",
                        });
                      }
                    }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: projectDraft.color,
                      border: "1px solid rgba(0,0,0,.15)",
                    }}
                  />
                </div>
              </fieldset>

              <fieldset>
                <legend>Sidebar font color</legend>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="color"
                    aria-label="Choose sidebar project font color"
                    value={projectDraft.sidebarFontColor ?? "#ffffff"}
                    onChange={(e) =>
                      setProjectDraft({
                        ...projectDraft,
                        sidebarFontColor: e.target.value.toUpperCase(),
                      })
                    }
                    style={{
                      width: 54,
                      height: 40,
                      padding: 2,
                      cursor: "pointer",
                    }}
                  />
                  <Input
                    aria-label="Sidebar project font color hex value"
                    value={projectDraft.sidebarFontColor ?? "#ffffff"}
                    maxLength={7}
                    style={{ width: 115 }}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(value)) {
                        setProjectDraft({
                          ...projectDraft,
                          sidebarFontColor: value,
                        });
                      }
                    }}
                    onBlur={() => {
                      if (
                        !/^#[0-9a-fA-F]{6}$/.test(
                          projectDraft.sidebarFontColor ?? "",
                        )
                      ) {
                        setProjectDraft({
                          ...projectDraft,
                          sidebarFontColor: "#ffffff",
                        });
                      }
                    }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: projectDraft.sidebarFontColor ?? "#ffffff",
                      border: "1px solid rgba(0,0,0,.15)",
                    }}
                  />
                </div>
              </fieldset>

              <fieldset>
                <legend>Project icon</legend>
                <div className="project-icon-choices">
                  {(Object.keys(projectIcons) as ProjectIcon[]).map((key) => {
                    const Icon = projectIcons[key];
                    return (
                      <button
                        type="button"
                        key={key}
                        aria-label={`Choose ${key} icon`}
                        aria-pressed={projectDraft.icon === key}
                        onClick={() =>
                          setProjectDraft({ ...projectDraft, icon: key })
                        }
                      >
                        <Icon size={19} />
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              {error && <p className="inline-error">{error}</p>}
              <div className="editor-footer">
                {projects.some((p) => p.id === projectDraft.id) && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="delete-button"
                    disabled={busy}
                    onClick={async () => {
                      if (!confirmDelete) {
                        setConfirmDelete(true);
                        return;
                      }
                      if (
                        await mutate(
                          { action: "deleteProject", id: projectDraft.id },
                          "Project deleted",
                        )
                      ) {
                        setProjectDraft(null);
                        setActive("all");
                      }
                    }}
                  >
                    <Trash2 size={15} />
                    {confirmDelete ? "Confirm delete" : "Delete"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProjectDraft(null)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={busy || !projectDraft.name.trim()}
                >
                  {busy ? "Saving…" : "Save project"}
                </Button>
              </div>
              {confirmDelete && (
                <p className="inline-error">
                  This permanently deletes the project, all its tasks, and
                  comments. Click “Confirm delete” to continue.
                </p>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!sectionDraft}
        onOpenChange={(open) => {
          if (!open && !busy) setSectionDraft(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {sections.some((s) => s.id === sectionDraft?.id)
              ? "Edit section"
              : "Add a section"}
          </DialogTitle>
          <DialogDescription>
            Sections divide a project into smaller, easy-to-scan groups.
          </DialogDescription>
          {sectionDraft && (
            <form onSubmit={saveSection} className="editor-form">
              <label>
                Section name
                <Input
                  autoFocus
                  required
                  maxLength={100}
                  placeholder="e.g. Planning, This week, Follow-up"
                  value={sectionDraft.name}
                  onChange={(e) =>
                    setSectionDraft({ ...sectionDraft, name: e.target.value })
                  }
                />
              </label>
              <div className="editor-footer">
                {sections.some((s) => s.id === sectionDraft.id) && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="delete-button"
                    disabled={busy}
                    onClick={async () => {
                      if (!confirmDelete) {
                        setConfirmDelete(true);
                        return;
                      }
                      if (
                        await mutate(
                          { action: "deleteSection", id: sectionDraft.id },
                          "Section deleted",
                        )
                      )
                        setSectionDraft(null);
                    }}
                  >
                    <Trash2 size={15} />
                    {confirmDelete ? "Confirm delete" : "Delete"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSectionDraft(null)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={busy || !sectionDraft.name.trim()}
                >
                  {busy ? "Saving…" : "Save section"}
                </Button>
              </div>
              {confirmDelete && (
                <p className="inline-error">
                  Tasks in this section will move to “No section.” Click
                  “Confirm delete” to continue.
                </p>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={columnsOpen} onOpenChange={setColumnsOpen}>
        <DialogContent>
          <DialogTitle>Columns</DialogTitle>
          <DialogDescription>
            Add your own information to every task in this project.
          </DialogDescription>
          <div className="column-manager">
            {projectFields.map((field) => (
              <button key={field.id} onClick={() => editField(field)}>
                <span>
                  <Columns3 size={16} />
                  <strong>{field.name}</strong>
                </span>
                <small>
                  {field.type}
                  <ChevronRight size={14} />
                </small>
              </button>
            ))}
            {!projectFields.length && (
              <div className="empty-field-list">
                <Columns3 />
                <p>No custom columns yet.</p>
              </div>
            )}
            <Button onClick={newField}>
              <Plus size={15} />
              Add column
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!statusDraft}
        onOpenChange={(open) => {
          if (!open && !busy) setStatusDraft(null);
        }}
      >
        <DialogContent className="field-dialog">
          <DialogTitle>Edit field</DialogTitle>
          <DialogDescription>
            Rename each status and choose the color shown across your workspace.
          </DialogDescription>
          {statusDraft && (
            <form onSubmit={saveStatusField} className="editor-form">
              <div className="form-grid">
                <label>
                  Field title
                  <Input value="Status" disabled />
                </label>
                <label>
                  Field type
                  <Input value="Single-select" disabled />
                </label>
              </div>
              <fieldset className="option-editor">
                <legend>Options</legend>
                <p>
                  Edit any entry below. Its tasks stay connected when the name
                  or color changes.
                </p>
                <div className="option-editor-list">
                  {statusDraft.map((option) => (
                    <div
                      className="option-editor-row status-option-row"
                      key={option.id}
                    >
                      <GripVertical size={16} />
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="option-color-button"
                            aria-label={`Change color for ${option.label}`}
                            style={{ background: option.color }}
                          >
                            <ChevronDown size={13} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="color-palette">
                          <strong>Color</strong>
                          <div>
                            {choicePalette.map((color) => (
                              <button
                                type="button"
                                key={color}
                                aria-label={`Choose ${color}`}
                                aria-pressed={option.color === color}
                                style={{ background: color }}
                                onClick={() =>
                                  setStatusDraft(
                                    statusDraft.map((item) =>
                                      item.id === option.id
                                        ? { ...item, color }
                                        : item,
                                    ),
                                  )
                                }
                              >
                                {option.color === color && <Check size={14} />}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Input
                        aria-label={`${option.id} name`}
                        required
                        maxLength={100}
                        value={option.label}
                        onChange={(e) =>
                          setStatusDraft(
                            statusDraft.map((item) =>
                              item.id === option.id
                                ? { ...item, label: e.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </fieldset>
              <div className="editor-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStatusDraft(null)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    busy || statusDraft.some((option) => !option.label.trim())
                  }
                >
                  {busy ? "Saving…" : "Save field"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!fieldDraft}
        onOpenChange={(open) => {
          if (!open && !busy) setFieldDraft(null);
        }}
      >
        <DialogContent className="field-dialog">
          <DialogTitle>
            {customFields.some((f) => f.id === fieldDraft?.id)
              ? "Edit field"
              : "Add a field"}
          </DialogTitle>
          <DialogDescription>
            Customize the field and its options for every task in this project.
          </DialogDescription>
          {fieldDraft && (
            <form onSubmit={saveField} className="editor-form">
              <div className="form-grid">
                <label>
                  Field title
                  <Input
                    autoFocus
                    required
                    maxLength={100}
                    placeholder="e.g. Status, Category, Stage"
                    value={fieldDraft.name}
                    onChange={(e) =>
                      setFieldDraft({ ...fieldDraft, name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Field type
                  <NativeSelect
                    value={fieldDraft.type}
                    onChange={(e) => {
                      const type = e.target.value as CustomField["type"];
                      setFieldDraft({
                        ...fieldDraft,
                        type,
                        options:
                          type === "Choice" && fieldDraft.options.length === 0
                            ? [
                                {
                                  id: crypto.randomUUID(),
                                  label: "New option",
                                  color: choicePalette[5],
                                },
                              ]
                            : fieldDraft.options,
                      });
                    }}
                  >
                    <option>Text</option>
                    <option>Number</option>
                    <option>Date</option>
                    <option>Choice</option>
                  </NativeSelect>
                </label>
              </div>
              {fieldDraft.type === "Choice" && (
                <fieldset className="option-editor">
                  <legend>Options</legend>
                  <p>Choose a name and color for each item in this list.</p>
                  <div className="option-editor-list">
                    {fieldDraft.options.map((option) => (
                      <div className="option-editor-row" key={option.id}>
                        <GripVertical size={16} />
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="option-color-button"
                              aria-label={`Change color for ${option.label}`}
                              style={{ background: option.color }}
                            >
                              <ChevronDown size={13} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            className="color-palette"
                          >
                            <strong>Color</strong>
                            <div>
                              {choicePalette.map((color) => (
                                <button
                                  type="button"
                                  key={color}
                                  aria-label={`Choose ${color}`}
                                  aria-pressed={option.color === color}
                                  style={{ background: color }}
                                  onClick={() =>
                                    setFieldDraft({
                                      ...fieldDraft,
                                      options: fieldDraft.options.map((item) =>
                                        item.id === option.id
                                          ? { ...item, color }
                                          : item,
                                      ),
                                    })
                                  }
                                >
                                  {option.color === color && (
                                    <Check size={14} />
                                  )}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Input
                          aria-label="Option name"
                          maxLength={100}
                          value={option.label}
                          onChange={(e) =>
                            setFieldDraft({
                              ...fieldDraft,
                              options: fieldDraft.options.map((item) =>
                                item.id === option.id
                                  ? { ...item, label: e.target.value }
                                  : item,
                              ),
                            })
                          }
                        />
                        <button
                          type="button"
                          className="remove-option"
                          aria-label={`Remove ${option.label}`}
                          onClick={() =>
                            setFieldDraft({
                              ...fieldDraft,
                              options: fieldDraft.options.filter(
                                (item) => item.id !== option.id,
                              ),
                            })
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="add-option"
                    disabled={fieldDraft.options.length >= 30}
                    onClick={() =>
                      setFieldDraft({
                        ...fieldDraft,
                        options: [
                          ...fieldDraft.options,
                          {
                            id: crypto.randomUUID(),
                            label: `Option ${fieldDraft.options.length + 1}`,
                            color:
                              choicePalette[
                                fieldDraft.options.length % choicePalette.length
                              ],
                          },
                        ],
                      })
                    }
                  >
                    <Plus size={15} />
                    Add option
                  </Button>
                </fieldset>
              )}
              <div className="editor-footer">
                {customFields.some((f) => f.id === fieldDraft.id) && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="delete-button"
                    disabled={busy}
                    onClick={async () => {
                      if (!confirmDelete) {
                        setConfirmDelete(true);
                        return;
                      }
                      if (
                        await mutate(
                          { action: "deleteCustomField", id: fieldDraft.id },
                          "Column deleted",
                        )
                      )
                        setFieldDraft(null);
                    }}
                  >
                    <Trash2 size={15} />
                    {confirmDelete ? "Confirm delete" : "Delete"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFieldDraft(null)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    busy ||
                    !fieldDraft.name.trim() ||
                    (fieldDraft.type === "Choice" &&
                      !fieldDraft.options.some((option) => option.label.trim()))
                  }
                >
                  {busy ? "Saving…" : "Save field"}
                </Button>
              </div>
              {confirmDelete && (
                <p className="inline-error">
                  This permanently removes the field and its saved values. Click
                  “Confirm delete” to continue.
                </p>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!filterDraft}
        onOpenChange={(open) => {
          if (!open && !busy) setFilterDraft(null);
        }}
      >
        <DialogContent className="field-dialog">
          <DialogTitle>Edit dropdown entries</DialogTitle>
          <DialogDescription>
            Rename the priority and sorting choices shown in the toolbar. Status
            names are edited from any Status menu.
          </DialogDescription>
          {filterDraft && (
            <form onSubmit={saveFilterLabels} className="editor-form">
              <fieldset className="option-editor">
                <legend>Priority choices</legend>
                {(["High", "Medium", "Low"] as const).map((key) => (
                  <label key={key}>
                    {key}
                    <Input
                      required
                      value={filterDraft.priority[key]}
                      onChange={(e) =>
                        setFilterDraft({
                          ...filterDraft,
                          priority: {
                            ...filterDraft.priority,
                            [key]: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </fieldset>
              <fieldset className="option-editor">
                <legend>Sort choices</legend>
                {(["Default", "Smart / Urgency", "Due date", "Priority", "Name"] as const).map(
                  (key) => (
                    <label key={key}>
                      {key}
                      <Input
                        required
                        value={filterDraft.sort[key]}
                        onChange={(e) =>
                          setFilterDraft({
                            ...filterDraft,
                            sort: {
                              ...filterDraft.sort,
                              [key]: e.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  ),
                )}
              </fieldset>
              <div className="editor-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFilterDraft(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  Save dropdowns
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent>
          <DialogTitle>Welcome to Taskflow</DialogTitle>
          <DialogDescription>
            Your personal project workspace.
          </DialogDescription>
          <div className="help-content">
            <p>
              <strong>Start with a project.</strong> Use the + beside Projects.
              The Getting started project contains editable example tasks.
            </p>
            <p>
              <strong>Keep work moving.</strong> Drag cards between columns, or
              change status in List view or task details. On touch devices, tap
              a task to change its status.
            </p>
            <p>
              <strong>Organize your list.</strong> Open a project’s List view to
              add collapsible sections and custom columns for text, numbers,
              dates, or choices.
            </p>
            <p>
              <strong>Make it actionable.</strong> Add due dates, priorities,
              names, subtasks, and notes. My tasks shows tasks assigned to
              Marcel.
            </p>
            <p>
              <strong>Your work is saved online.</strong> Use Save task or Save
              project after editing. Export workspace downloads a JSON backup.
            </p>
            <p>
              <strong>Private, single-user version.</strong> Assignee names are
              labels; team invitations, notifications, attachments, and live
              collaboration are not included.
            </p>
          </div>
          <Button onClick={() => setHelp(false)}>Let’s get started</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
