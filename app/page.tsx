"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  sort: { Default: string; "Due date": string; Priority: string; Name: string };
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
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [adminUsersOpen, setAdminUsersOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "user">("user");
const [editingAdminUser, setEditingAdminUser] = useState<AdminUser | null>(null);
const [editAdminUserName, setEditAdminUserName] = useState("");
const [editAdminUserEmail, setEditAdminUserEmail] = useState("");
const [editAdminUserRole, setEditAdminUserRole] = useState<"admin" | "user">("user");
const [editAdminUserActive, setEditAdminUserActive] = useState(true);
const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);
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
      setNewUserPassword("");
      setNewUserRole("user");
      await loadAdminUsers();
    } catch (error) {
      setAdminUsersError((error as Error).message);
    }
  }

  async function updateAdminUser(
    id: string,
    changes: Partial<
      Pick<AdminUser, "name" | "email" | "role" | "active">
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
    } catch (error) {
      setAdminUsersError((error as Error).message);
    }
  }

  function openEditAdminUser(user: AdminUser) {
    setAdminUsersError("");
    setEditingAdminUser(user);
    setEditAdminUserName(user.name);
    setEditAdminUserEmail(user.email);
    setEditAdminUserRole(user.role);
    setEditAdminUserActive(user.active);
  }

  async function saveEditedAdminUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAdminUser) return;

    await updateAdminUser(editingAdminUser.id, {
      name: editAdminUserName,
      email: editAdminUserEmail,
      role: editAdminUserRole,
      active: editAdminUserActive,
    });

    setEditingAdminUser(null);
  }

  function openResetPassword(user: AdminUser) {
    setAdminUsersError("");
    setResetPasswordUser(user);
    setResetPasswordValue("");
    setResetPasswordConfirm("");
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

  async function refresh() {
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
      const r = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize" }),
      });
      if (!r.ok)
        throw new Error("Could not open your workspace. Please try again.");
      const d = await refresh();
      if (!d.projects.some((p: Project) => p.id === active))
        setActive(d.projects[0]?.id || "all");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    async function start() {
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
      setError((e as Error).message);
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
          (currentUser?.name ?? "").toLowerCase()
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
            (statusFilter === "All statuses" || t.status === statusFilter),
        )
        .sort((a, b) =>
          sort === "Due date"
            ? (a.due || "9999").localeCompare(b.due || "9999")
            : sort === "Priority"
              ? ["High", "Medium", "Low"].indexOf(a.priority) -
                ["High", "Medium", "Low"].indexOf(b.priority)
              : sort === "Name"
                ? a.title.localeCompare(b.title)
                : a.sortOrder - b.sortOrder,
        ),
    [scope, query, priority, statusFilter, sort],
  );
  const completed = scope.filter((t) => t.status === "Done").length,
    overdue = scope.filter(
      (t) => t.status !== "Done" && t.due && t.due < todayKey(),
    ).length;
  function navigate(id: string) {
    setActive(id);
    setQuery("");
    setPriority("All priorities");
    setStatusFilter("All statuses");
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
    if (
      draft &&
      (await mutate({ action: "saveTask", task: draft }, "Task saved"))
    )
      setDraft(null);
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
  function changeStatus(t: Task, status: Status) {
    void mutate(
      { action: "saveTask", task: { ...t, status } },
      status === "Done" ? "Nice work. Task completed!" : "Task moved",
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
          className={`due ${t.due && t.due < todayKey() && t.status !== "Done" ? "late" : ""}`}
        >
          <CalendarDays size={13} />
          {dateText(t.due)}
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
                      (currentUser?.name ?? "").toLowerCase() &&
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
                <span className="truncate">{p.name}</span>
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
              Admin users
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
            <span className="avatar">
              {currentUser?.name?.charAt(0).toUpperCase() || "M"}
            </span>
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
                  setProjectDraft({ ...project });
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
                  {(["Default", "Due date", "Priority", "Name"] as const).map(
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

      <Dialog open={adminUsersOpen} onOpenChange={setAdminUsersOpen}>
        <DialogContent style={{ maxWidth: "760px" }}>
          <DialogTitle>Admin users</DialogTitle>
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
                </div>
              ))
            )}
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
                <div className="color-choices">
                  {colors.map((c) => (
                    <button
                      type="button"
                      key={c}
                      aria-label={`Choose ${c}`}
                      aria-pressed={projectDraft.color === c}
                      style={{ background: c }}
                      onClick={() =>
                        setProjectDraft({ ...projectDraft, color: c })
                      }
                    >
                      {projectDraft.color === c && <Check size={18} />}
                    </button>
                  ))}
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
                {(["Default", "Due date", "Priority", "Name"] as const).map(
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
