"use client";
import "../components/my-life/v2.css";
import { MyLifeAppShell, MyLifeDashboard } from "../components/my-life";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Database from "@tauri-apps/plugin-sql";
import { getVersion } from "@tauri-apps/api/app";
import packageJson from "../package.json";
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
  NotebookPen,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
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
import { TaskCompletionCelebration } from "@/components/my-life/task-completion-celebration";
import { MyLifeNotesWorkspace } from "@/components/my-life/notes/notes-workspace";
import type { GlobalSearchResult } from "@/components/my-life/top-bar";
import {
  CLASSIFICATION_COLOR_KEY,
  readClassificationColors,
  legacyClassificationColor,
  nextClassificationColor,
  type ClassificationColors,
} from "@/components/my-life/classification-colors";

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
type Person = { id: string; name: string; phone: string; smsEnabled: boolean; avatarData?: string | null };
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
type TaskAttachment = {
  id: string;
  name: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  data: string;
};

type TaskRecurrenceException = {
  id: string;
  taskId: string;
  originalDate: string;
  movedDate: string;
  movedDueTime?: string | null;
  movedEndTime?: string | null;
  createdAt: string;
};

type Task = {
  // STEP 18F.23I.43I-P36C.1D - Classification.
  classification?: string;
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
  recurrenceUnit: "none" | "days" | "weeks" | "months" | "years";
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
  attachments: TaskAttachment[];
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
    "📌",
    "🔥",
    "💡",
    "🎯",
    "📅",
    "📞",
    "🚀",
    "⭐",
    "🏆",
    "🛒",
    "🛠️",
    "💼",
    "🎉",
    "❤️",
    "🏠",
    "🚗",
    "✈️",
    "🍎",
    "🍕",
    "☕",
    "🥗",
    "🎾",
    "⚽",
    "🏀",
    "🏈",
    "⚾",
    "🏒",
    "🏅",
    "🏋️",
    "🏃",
    "🚶",
    "⛳",
    "🏊",
    "🎣",
    "🥊",
    "🥋",
    "⛸️",
    "🎿",
    "🏂",
    "🤸",
    "🚴",
    "🧹",
    "🧽",
    "🧼",
    "🧴",
    "🧺",
    "🧻",
    "🚽",
    "🚿",
    "🪥",
    "🛒",
    "🗑️",
    "♻️",
    "🪟",
    "👕",
    "👚",
    "🧦",
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
      <PopoverContent align="start" className={`choice-menu ${label === "Status" ? "ml-v2-status-choice-menu" : ""}`}>
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
  const [celebrationId, setCelebrationId] = useState(0);
  function celebrateTaskCompletion() {
    setCelebrationId((value) => value + 1);
  }

  const [projects, setProjects] = useState<Project[]>([]),
    [tasks, setTasks] = useState<Task[]>([]),
    [taskRecurrenceExceptions, setTaskRecurrenceExceptions] =
      useState<TaskRecurrenceException[]>([]),
    [comments, setComments] = useState<Comment[]>([]),
    [sections, setSections] = useState<Section[]>([]),
    [customFields, setCustomFields] = useState<CustomField[]>([]),
    [people, setPeople] = useState<Person[]>([]),
    [workflowOptions, setWorkflowOptions] =
      useState<ChoiceOption[]>(defaultStatusOptions),
    [filterLabels, setFilterLabels] =
      useState<FilterLabels>(defaultFilterLabels),
    [listColumnOrder, setListColumnOrder] =
      useState<Record<string, string[]>>({});
  const listColumnDragSourceRef = useRef<string | null>(null);
  const listColumnDragStartOrderRef = useRef<string[] | null>(null);
  const listColumnDragCurrentOrderRef = useRef<string[] | null>(null);
  const listColumnDragMovedRef = useRef(false);
  const [listColumnDragging, setListColumnDragging] = useState<string | null>(null);
  // STEP 18F.23I.40J-R1 - Default landing page is Overview.
  const [active, setActive] = useState("home"),
    [view, setView] = useState("Overview"),
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
    // STEP 18F.23I.43I-P35C - Inline section creation.
    [taskSectionName, setTaskSectionName] = useState(""),
    [taskSectionCreating, setTaskSectionCreating] = useState(false),
    // P36C.1G - Section management.
    [taskSectionsManaging, setTaskSectionsManaging] = useState(false),
    [taskSectionRenameId, setTaskSectionRenameId] = useState(""),
    [taskSectionRenameName, setTaskSectionRenameName] = useState(""),
    // P36C.1H.1 - Classification management.
    [classificationOptions, setClassificationOptions] = useState<string[]>([
      "Task",
      "Appointment",
    ]),
    [classificationColors, setClassificationColors] = useState<ClassificationColors>({}),
    [newClassificationName, setNewClassificationName] = useState(""),
    [classificationsManaging, setClassificationsManaging] = useState(false),
    [classificationRenameOld, setClassificationRenameOld] = useState(""),
    [classificationRenameName, setClassificationRenameName] = useState(""),
    // P36C.1I.1 - Project management.
    [newTaskProjectName, setNewTaskProjectName] = useState(""),
    [taskProjectsManaging, setTaskProjectsManaging] = useState(false),
    [taskProjectRenameId, setTaskProjectRenameId] = useState(""),
    [taskProjectRenameName, setTaskProjectRenameName] = useState(""),
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
  useEffect(() => {
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(
          "my-life-v2-classification-options"
        ) || '["Task","Appointment"]'
      );

      if (
        Array.isArray(saved) &&
        saved.length > 0 &&
        saved.every(
          (item) =>
            typeof item === "string" &&
            item.trim().length > 0
        )
      ) {
        setClassificationOptions(
          Array.from(new Set(saved)) as string[]
        );
      }
    } catch {
      // Retain the default classification options.
    }
  }, []);

  // P36C.1K.17C - Load saved colors without replacing existing names.
  useEffect(() => {
    const saved = readClassificationColors();
    setClassificationColors(saved);
  }, []);

  function persistClassificationColors(colors: ClassificationColors) {
    try {
      window.localStorage.setItem(
        CLASSIFICATION_COLOR_KEY,
        JSON.stringify(colors)
      );
      setClassificationColors(colors);
      return true;
    } catch {
      setError("Could not save Classification colors in this browser.");
      return false;
    }
  }

  const desktopSyncInProgressRef = useRef(false);
  const desktopSyncRequestedRef = useRef(false);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  async function addTaskAttachments(files: FileList | File[]) {
    if (!draft) return;

    const allowedTypes = new Set([
      "image/png",
      "image/jpeg",
      "image/webp",
    ]);

    const existing = draft.attachments ?? [];
    const remainingSlots = Math.max(0, 5 - existing.length);

    if (remainingSlots === 0) {
      setError("A task can have up to 5 screenshots.");
      return;
    }

    const selected = Array.from(files)
      .filter((file) => allowedTypes.has(file.type))
      .slice(0, remainingSlots);

    if (!selected.length) {
      setError("Please choose a PNG, JPEG, or WebP image.");
      return;
    }

    const added = await Promise.all(
      selected.map(
        (file) =>
          new Promise<TaskAttachment>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
              if (typeof reader.result !== "string") {
                reject(new Error("Could not read image."));
                return;
              }

              const image = new Image();

              image.onload = () => {
                const maxDimension = 1920;
                const largestSide = Math.max(image.width, image.height);

                if (largestSide <= maxDimension) {
                  resolve({
                    id: crypto.randomUUID(),
                    name: file.name || "screenshot",
                    mimeType: file.type as TaskAttachment["mimeType"],
                    data: reader.result as string,
                  });
                  return;
                }

                const scale = maxDimension / largestSide;
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(image.width * scale);
                canvas.height = Math.round(image.height * scale);

                const context = canvas.getContext("2d");

                if (!context) {
                  reject(new Error("Could not process image."));
                  return;
                }

                context.drawImage(image, 0, 0, canvas.width, canvas.height);

                const data = canvas.toDataURL("image/webp", 0.9);

                resolve({
                  id: crypto.randomUUID(),
                  name: (file.name || "screenshot").replace(
                    /\.(png|jpe?g|webp)$/i,
                    ".webp",
                  ),
                  mimeType: "image/webp",
                  data,
                });
              };

              image.onerror = () =>
                reject(new Error(`Could not process ${file.name}.`));

              image.src = reader.result;
            };

            reader.onerror = () =>
              reject(new Error(`Could not read ${file.name}.`));

            reader.readAsDataURL(file);
          }),
      ),
    );

    setDraft((current) =>
      current
        ? {
            ...current,
            attachments: [...(current.attachments ?? []), ...added],
          }
        : current,
    );

    setError("");
  }
  const [appVersion, setAppVersion] = useState(packageJson.version ?? "");
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
  const [calendarDragOccurrence, setCalendarDragOccurrence] = useState<{
    taskId: string;
    occurrenceDate: string;
  } | null>(null);
  const [calendarMoveChoice, setCalendarMoveChoice] = useState<{
    taskId: string;
    occurrenceDate: string;
    targetDate: string;
    targetDueTime?: string;
    targetEndTime?: string;
  } | null>(null);
  const [calendarTimelineDropTarget, setCalendarTimelineDropTarget] = useState<{
    date: string;
    minutes: number;
  } | null>(null);
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

      const data = (await response.json()) as { error?: string; users?: AdminUser[] };

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

      const data = (await response.json()) as { error?: string; users?: AdminUser[] };

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

      const data = (await response.json()) as { error?: string; users?: AdminUser[] };

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

      const data = (await response.json()) as { error?: string; users?: AdminUser[] };

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

      const data = (await response.json()) as { error?: string; users?: AdminUser[] };

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
      taskAttachments,
      taskRecurrenceExceptions,
      workspaceSettings,
    ] = await Promise.all([
      db.select<any[]>("SELECT * FROM projects ORDER BY created_at"),
      db.select<any[]>("SELECT * FROM tasks ORDER BY sort_order, created_at"),
      db.select<any[]>("SELECT * FROM comments ORDER BY created_at"),
      db.select<any[]>("SELECT * FROM sections ORDER BY sort_order, created_at"),
      db.select<any[]>("SELECT * FROM custom_fields ORDER BY created_at"),
      db.select<any[]>("SELECT id,name,phone,sms_enabled,avatar_data FROM people ORDER BY name COLLATE NOCASE"),
      db.select<any[]>("SELECT * FROM task_values ORDER BY task_id, field_id"),
      db.select<any[]>("SELECT * FROM task_attachments ORDER BY created_at"),
      db.select<any[]>(
        "SELECT * FROM task_recurrence_exceptions ORDER BY created_at",
      ),
      db.select<any[]>("SELECT status_options,filter_labels,list_column_order FROM workspace WHERE id='initialized'"),
    ]);

    const valuesByTask = new Map<string, Record<string, string>>();
    for (const row of taskValues) {
      const values = valuesByTask.get(row.task_id) ?? {};
      values[row.field_id] = row.value;
      valuesByTask.set(row.task_id, values);
    }

    const attachmentsByTask = new Map<string, TaskAttachment[]>();
    for (const row of taskAttachments) {
      const attachments = attachmentsByTask.get(row.task_id) ?? [];
      attachments.push({
        id: row.id,
        name: row.name,
        mimeType: row.mime_type,
        data: row.data,
      });
      attachmentsByTask.set(row.task_id, attachments);
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
        attachments: attachmentsByTask.get(t.id) ?? [],
        customValues: valuesByTask.get(t.id) ?? {},
      })),
      taskRecurrenceExceptions: taskRecurrenceExceptions.map((row: any) => ({
        id: row.id,
        taskId: row.task_id,
        originalDate: row.original_date,
        movedDate: row.moved_date,
        movedDueTime: row.moved_due_time,
        movedEndTime: row.moved_end_time,
        createdAt: row.created_at,
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
        avatarData: person.avatarData ?? person.avatar_data ?? null,
      })),
      statusOptions: JSON.parse(
        String(workspaceSettings[0]?.status_options || "[]"),
      ) as ChoiceOption[],
      filterLabels: JSON.parse(
        String(workspaceSettings[0]?.filter_labels || "{}"),
      ) as FilterLabels,
      listColumnOrder: JSON.parse(
        String(workspaceSettings[0]?.list_column_order || "{}"),
      ) as Record<string, string[]>,
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
    await db.execute("DELETE FROM task_attachments WHERE task_id=?", [t.id]);

    for (const [fieldId, value] of values) {
      await db.execute(
        "INSERT INTO task_values(task_id,field_id,value) VALUES(?,?,?)",
        [t.id, fieldId, value],
      );
    }

    for (const attachment of t.attachments ?? []) {
      await db.execute(
        `INSERT INTO task_attachments(
          id,task_id,name,mime_type,data,created_at
        ) VALUES(?,?,?,?,?,?)`,
        [
          attachment.id,
          t.id,
          attachment.name,
          attachment.mimeType,
          attachment.data,
          now,
        ],
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
        await db.execute("DELETE FROM task_attachments WHERE task_id=?", [task.id]);
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
        `INSERT INTO people(id,name,phone,sms_enabled,avatar_data,created_at)
         VALUES(?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           phone=excluded.phone,
           sms_enabled=excluded.sms_enabled,
           avatar_data=excluded.avatar_data`,
        [
          person.id,
          person.name,
          person.phone,
          person.smsEnabled ? 1 : 0,
          person.avatarData ?? null,
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
    } else if (action === "reorderListTasks") {
      for (const item of payload.items) {
        await db.execute(
          "UPDATE tasks SET section_id=?,sort_order=? WHERE id=? AND project_id=?",
          [item.sectionId, item.sortOrder, item.id, payload.projectId],
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
    } else if (action === "saveListColumnOrder") {
      await db.execute(
        "UPDATE workspace SET list_column_order=? WHERE id='initialized'",
        [JSON.stringify(payload.order)],
      );
    } else if (action === "saveRecurrenceException") {
    await db.execute(
      `INSERT INTO task_recurrence_exceptions(
        id,task_id,original_date,moved_date,moved_due_time,moved_end_time,created_at
      ) VALUES(?,?,?,?,?,?,?)
      ON CONFLICT(task_id,original_date) DO UPDATE SET
        moved_date=excluded.moved_date,
        moved_due_time=excluded.moved_due_time,
        moved_end_time=excluded.moved_end_time,
        created_at=excluded.created_at`,
      [
        payload.exception.id,
        payload.exception.taskId,
        payload.exception.originalDate,
        payload.exception.movedDate,
        payload.exception.movedDueTime ?? null,
        payload.exception.movedEndTime ?? null,
        payload.exception.createdAt ?? now,
      ],
    );
  } else if (action === "deleteRecurrenceExceptionsForTask") {
    await db.execute(
      "DELETE FROM task_recurrence_exceptions WHERE task_id=?",
      [payload.taskId],
    );
  } else if (action === "deleteTask") {
      await db.execute("DELETE FROM comments WHERE task_id=?", [payload.id]);
      await db.execute("DELETE FROM task_values WHERE task_id=?", [payload.id]);
      await db.execute("DELETE FROM task_attachments WHERE task_id=?", [payload.id]);
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
      listColumnOrder: Record<string, string[]>;
    };

    const now = new Date().toISOString();
      await db.execute("DELETE FROM comments");
      await db.execute("DELETE FROM task_values");
      await db.execute("DELETE FROM task_attachments");
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

        for (const attachment of t.attachments ?? []) {
          await db.execute(
            `INSERT INTO task_attachments(
              id,task_id,name,mime_type,data,created_at
            ) VALUES(?,?,?,?,?,?)`,
            [
              attachment.id,
              t.id,
              attachment.name,
              attachment.mimeType,
              attachment.data,
              now,
            ],
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
             id,name,phone,sms_enabled,avatar_data,created_at
           ) VALUES(?,?,?,?,?,?)`,
          [
            person.id,
            person.name,
            person.phone ?? "",
            person.smsEnabled ? 1 : 0,
            person.avatarData ?? person.avatar_data ?? null,
            person.created_at ?? now,
          ],
        );
      }

      await db.execute(
        `UPDATE workspace
         SET status_options=?,filter_labels=?,list_column_order=?
         WHERE id='initialized'`,
        [
          JSON.stringify(data.statusOptions ?? []),
          JSON.stringify(data.filterLabels ?? {}),
          JSON.stringify(data.listColumnOrder ?? {}),
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
      setTaskRecurrenceExceptions(d.taskRecurrenceExceptions ?? []);
      setComments(d.comments);
      setSections(d.sections);
      setCustomFields(d.customFields);
      setPeople(d.people);
      setWorkflowOptions(d.statusOptions);
      setFilterLabels(d.filterLabels);
      setListColumnOrder(d.listColumnOrder ?? {});
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
      taskRecurrenceExceptions: TaskRecurrenceException[];
      comments: Comment[];
      sections: Section[];
      customFields: CustomField[];
      people: Person[];
      statusOptions: ChoiceOption[];
      filterLabels: FilterLabels;
      listColumnOrder: Record<string, string[]>;
    };
    if (!r.ok) throw new Error(d.error);
    setProjects(d.projects);
    setTasks(d.tasks);
    setTaskRecurrenceExceptions(d.taskRecurrenceExceptions ?? []);
    setComments(d.comments);
    setSections(d.sections);
    setCustomFields(d.customFields);
    setPeople(d.people);
    setWorkflowOptions(d.statusOptions);
    setFilterLabels(d.filterLabels);
    setListColumnOrder(d.listColumnOrder ?? {});
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

        if (
          active !== "home" &&
          !d.projects.some((p: Project) => p.id === active)
        ) {
          setActive("home");
          setView("Overview");
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

      if (
        active !== "home" &&
        !d.projects.some((p: Project) => p.id === active)
      ) {
        setActive("home");
        setView("Overview");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function syncDesktopWorkspace() {
    const isDesktop =
      "__TAURI_INTERNALS__" in window || "__TAURI__" in window;

    if (!isDesktop || !navigator.onLine) {
      return;
    }

    if (desktopSyncInProgressRef.current) {
      desktopSyncRequestedRef.current = true;
      return;
    }

    desktopSyncInProgressRef.current = true;

    try {
      do {
        desktopSyncRequestedRef.current = false;

        await processSyncQueue();
        await downloadServerWorkspaceToLocal();
        await refresh();
      } while (
        desktopSyncRequestedRef.current &&
        navigator.onLine
      );
    } finally {
      desktopSyncInProgressRef.current = false;
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
            await syncDesktopWorkspace();
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
        await syncDesktopWorkspace();
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
          void syncDesktopWorkspace();
          return true;
        }

        const handledLocally = await mutateLocally(payload);

        if (handledLocally) {
          await refresh();
          setNotice(message);
          void syncDesktopWorkspace();
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
  async function moveCalendarOccurrence() {
    if (!calendarMoveChoice) return;

    const choice = calendarMoveChoice;

    const existingException = taskRecurrenceExceptions.find(
      (item) =>
        item.taskId === choice.taskId &&
        item.originalDate === choice.occurrenceDate,
    );

    const exception: TaskRecurrenceException = {
      id:
        existingException?.id ??
        `recurrence-exception-${choice.taskId}-${choice.occurrenceDate}`,
      taskId: choice.taskId,
      originalDate: choice.occurrenceDate,
      movedDate: choice.targetDate,
      movedDueTime: choice.targetDueTime ?? existingException?.movedDueTime ?? null,
      movedEndTime: choice.targetEndTime ?? existingException?.movedEndTime ?? null,
      createdAt: existingException?.createdAt ?? new Date().toISOString(),
    };

    const saved = await mutate(
      {
        action: "saveRecurrenceException",
        exception,
      },
      `Occurrence moved to ${dateText(choice.targetDate)}`,
    );

    if (saved) {
      setCalendarMoveChoice(null);
      setCalendarDragOccurrence(null);
    }
  }

  async function moveCalendarSeries() {
    if (!calendarMoveChoice) return;

    const choice = calendarMoveChoice;
    const task = tasks.find((item) => item.id === choice.taskId);

    if (!task) {
      setError("Recurring task could not be found.");
      return;
    }

    if (!task.due) {
      setError("Recurring task does not have a starting date.");
      return;
    }

    const occurrenceDate = new Date(
      `${choice.occurrenceDate}T12:00:00`,
    );
    const targetDate = new Date(
      `${choice.targetDate}T12:00:00`,
    );
    const originalDueDate = new Date(
      `${task.due}T12:00:00`,
    );

    const shiftMilliseconds =
      targetDate.getTime() - occurrenceDate.getTime();

    const shiftedDueDate = new Date(
      originalDueDate.getTime() + shiftMilliseconds,
    );

    const shiftedDue =
      `${shiftedDueDate.getFullYear()}-` +
      `${String(shiftedDueDate.getMonth() + 1).padStart(2, "0")}-` +
      `${String(shiftedDueDate.getDate()).padStart(2, "0")}`;

    const saved = await mutate(
      {
        action: "saveTask",
        task: {
          ...task,
          due: shiftedDue,
        dueTime: choice.targetDueTime ?? task.dueTime,
        endTime: choice.targetEndTime ?? task.endTime,
        },
      },
      `Recurring series moved to ${dateText(shiftedDue)}`,
    );

    if (saved) {
      await mutate(
        {
          action: "deleteRecurrenceExceptionsForTask",
          taskId: task.id,
        },
        "Recurring series occurrence overrides cleared",
      );

      setTaskRecurrenceExceptions((current) =>
        current.filter((item) => item.taskId !== task.id),
      );
      setCalendarMoveChoice(null);
      setCalendarDragOccurrence(null);
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

  const availableListColumnIds = [
    "task-name",
    ...projectFields.map((field) => `field:${field.id}`),
  ];

  const savedProjectColumnOrder = project
    ? listColumnOrder[project.id] ?? []
    : [];

  const orderedListColumnIds = [
    ...savedProjectColumnOrder.filter((id) =>
      availableListColumnIds.includes(id),
    ),
    ...availableListColumnIds.filter(
      (id) => !savedProjectColumnOrder.includes(id),
    ),
  ];

  async function moveListColumn(sourceId: string, targetId: string) {
    if (!project || sourceId === targetId) return;

    const sourceIndex = orderedListColumnIds.indexOf(sourceId);
    const targetIndex = orderedListColumnIds.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const nextOrder = [...orderedListColumnIds];
    const [moved] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);

    const previousOrder = listColumnOrder;
    const nextColumnOrder = {
      ...listColumnOrder,
      [project.id]: nextOrder,
    };

    setListColumnOrder(nextColumnOrder);

    const saved = await mutate(
      {
        action: "saveListColumnOrder",
        order: nextColumnOrder,
      },
      "Column order updated",
    );

    if (!saved) {
      setListColumnOrder(previousOrder);
    }
  }

  function previewListColumnPointerDrag(
    e: React.PointerEvent<HTMLElement>,
  ) {
    const source = listColumnDragSourceRef.current;
    if (!project || !source) return;

    const targetElement = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-list-column-id]");

    const target = targetElement?.dataset.listColumnId;
    if (!target || target === source) return;

    const currentOrder =
      listColumnDragCurrentOrderRef.current ?? [...orderedListColumnIds];

    const sourceIndex = currentOrder.indexOf(source);
    const targetIndex = currentOrder.indexOf(target);

    if (
      sourceIndex === -1 ||
      targetIndex === -1 ||
      sourceIndex === targetIndex
    ) {
      return;
    }

    const nextOrder = [...currentOrder];
    const [moved] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);

    listColumnDragCurrentOrderRef.current = nextOrder;
    listColumnDragMovedRef.current = true;

    setListColumnOrder((current) => ({
      ...current,
      [project.id]: nextOrder,
    }));
  }

  async function finishListColumnPointerDrag() {
    const source = listColumnDragSourceRef.current;
    const startOrder = listColumnDragStartOrderRef.current;
    const finalOrder = listColumnDragCurrentOrderRef.current;

    listColumnDragSourceRef.current = null;
    listColumnDragStartOrderRef.current = null;
    listColumnDragCurrentOrderRef.current = null;
    setListColumnDragging(null);

    if (!project || !source || !startOrder || !finalOrder) return;

    if (JSON.stringify(startOrder) === JSON.stringify(finalOrder)) {
      return;
    }

    const nextColumnOrder = {
      ...listColumnOrder,
      [project.id]: finalOrder,
    };

    const saved = await mutate(
      {
        action: "saveListColumnOrder",
        order: nextColumnOrder,
      },
      "Column order updated",
    );

    if (!saved) {
      setListColumnOrder((current) => ({
        ...current,
        [project.id]: startOrder,
      }));
    }
  }

  function startListColumnPointerDrag(
    columnId: string,
    e: React.PointerEvent<HTMLElement>,
  ) {
    if (!project || busy) return;

    e.preventDefault();
    e.stopPropagation();

    listColumnDragSourceRef.current = columnId;
    listColumnDragStartOrderRef.current = [...orderedListColumnIds];
    listColumnDragCurrentOrderRef.current = [...orderedListColumnIds];
    listColumnDragMovedRef.current = false;
    setListColumnDragging(columnId);

    const handleMove = (event: PointerEvent) => {
      previewListColumnPointerDrag(event as unknown as React.PointerEvent<HTMLElement>);
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);

      void finishListColumnPointerDrag();
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  }

  const scope = tasks.filter(
    (t) =>
      active === "all" ||
      active === "calendar" ||
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
  // STEP 18F.23I.39G-R2 - Direct Overview note navigation.
  const overviewNoteIdRef = useRef<string | null>(null);
  const [globalNoteSelection, setGlobalNoteSelection] = useState(0);

  function openOverviewNote(noteId: string) {
    overviewNoteIdRef.current = noteId;
    navigate("notes");
  }

  function navigate(id: string) {
    setActive(id);
    setQuery("");
    setPriority("All priorities");
    setStatusFilter("All statuses");
    setTaskDateFilter("all");
    setMobile(false);
    if (id === "home") setView("Overview");
    else if (id === "calendar") {
      setView("Calendar");
      setCalendarMode("month");
    } else if (view === "Overview" || active === "calendar") {
      setView("Board");
    }
  }

  // STEP P36C.1M.2B - Global Search is separate from task-list filters.
  const globalSearchItems: GlobalSearchResult[] = [
    ...tasks.map((task) => ({
      id: task.id,
      type: "task" as const,
      title: task.title || "Untitled task",
      detail: `${task.classification || "Task"} · ${
        projects.find((p) => p.id === task.projectId)?.name || "Project"
      }`,
      searchable: [
        task.description,
        task.assignee,
        task.status,
        task.priority,
        task.classification,
        ...task.subtasks.map((subtask) => subtask.title),
      ].join(" "),
    })),
    ...projects.map((item) => ({
      id: item.id,
      type: "project" as const,
      title: item.name,
      detail: "Project",
      searchable: item.description,
    })),
    ...sections.map((item) => ({
      id: item.id,
      type: "section" as const,
      title: item.name,
      detail: `Section · ${
        projects.find((p) => p.id === item.projectId)?.name || "Project"
      }`,
      searchable: projects.find((p) => p.id === item.projectId)?.name,
    })),
    ...people.map((item) => ({
      id: item.id,
      type: "person" as const,
      title: item.name,
      detail: "Person",
      searchable: item.phone,
    })),
  ];

  function openGlobalSearchResult(item: GlobalSearchResult) {
    if (item.type === "task") {
      const selected = tasks.find((task) => task.id === item.id);
      if (selected) editTask(selected);
    } else if (item.type === "project") {
      if (projects.some((project) => project.id === item.id)) {
        navigate(item.id);
        setView("Board");
      }
    } else if (item.type === "section") {
      const selected = sections.find((section) => section.id === item.id);
      if (selected) {
        navigate(selected.projectId);
        setView("Board");
      }
    } else if (item.type === "person") {
      const selected = people.find((person) => person.id === item.id);
      if (selected) {
        setPeopleOpen(true);
        setPersonDraft({ ...selected });
      }
    } else if (item.type === "note") {
      openOverviewNote(item.id);
      setGlobalNoteSelection((value) => value + 1);
    }
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
      classification: "Task",
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
      attachments: [],
      customValues: {},
    });
  }
  function editTask(task: Task) {
    setDraft({
      ...task,
      recurrenceUnit: task.recurrenceUnit || "none",
      recurrenceInterval: task.recurrenceInterval || 1,
      subtasks: task.subtasks.map((s) => ({ ...s })),
      attachments: (task.attachments ?? []).map((a) => ({ ...a })),
      customValues: { ...task.customValues },
    });
    setConfirmDelete(false);
    setComment("");
    setSubtask("");
  }
  // P36C.1I.1 - Project management functions.
  async function addTaskEditorProject() {
    if (!draft || busy) return;
    const name = newTaskProjectName.trim();
    if (!name) return;

    if (
      projects.some(
        (item) => item.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      setError("A project with that name already exists.");
      return;
    }

    const project: Project = {
      id: crypto.randomUUID(),
      name,
      description: "",
      color: colors[projects.length % colors.length],
      sidebarFontColor: "#ffffff",
      icon: "folder",
    };

    if (
      await mutate(
        { action: "saveProject", project },
        "Project created"
      )
    ) {
      setDraft((current) =>
        current
          ? {
              ...current,
              projectId: project.id,
              sectionId: "",
              customValues: {},
            }
          : current
      );
      setNewTaskProjectName("");
    }
  }

  async function renameTaskEditorProject() {
    if (!draft || busy) return;
    const project = projects.find(
      (item) => item.id === taskProjectRenameId
    );
    const name = taskProjectRenameName.trim();

    if (!project || !name) {
      setError("Choose a project and enter a name.");
      return;
    }

    if (
      projects.some(
        (item) =>
          item.id !== project.id &&
          item.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      setError("A project with that name already exists.");
      return;
    }

    if (
      await mutate(
        { action: "saveProject", project: { ...project, name } },
        "Project renamed"
      )
    ) {
      setTaskProjectRenameId("");
      setTaskProjectRenameName("");
    }
  }

  async function deleteTaskEditorProject(projectId: string) {
    if (!draft || busy) return;

    const project = projects.find(
      (item) => item.id === projectId
    );
    if (!project) return;

    if (
      tasks.some((item) => item.projectId === projectId) ||
      sections.some((item) => item.projectId === projectId)
    ) {
      setError(
        "This project contains tasks or sections. Move or remove them before deleting the project."
      );
      return;
    }

    if (
      !window.confirm(
        `Delete the empty project "${project.name}"?`
      )
    ) return;

    if (
      await mutate(
        { action: "deleteProject", id: projectId },
        "Project deleted"
      )
    ) {
      if (draft.projectId === projectId) {
        const next = projects.find(
          (item) => item.id !== projectId
        );
        setDraft((current) =>
          current
            ? {
                ...current,
                projectId: next?.id ?? "",
                sectionId: "",
                customValues: {},
              }
            : current
        );
      }
      setTaskProjectRenameId("");
      setTaskProjectRenameName("");
    }
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
  // STEP 18F.23H.6 - PHONE DISPLAY FORMAT
function formatPersonPhone(value: string): string {
  let digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);

  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}


  // STEP 18F.23I.17A - PERSON PROFILE PICTURE
  async function selectPersonPhoto(file?: File) {
    if (!file || !personDraft) return;

    const personId = personDraft.id;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP profile picture.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Profile pictures must be smaller than 10 MB.");
      return;
    }

    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () =>
          reject(new Error("Could not read the picture."));

        reader.onload = () => {
          if (typeof reader.result !== "string") {
            reject(new Error("Could not read the picture."));
            return;
          }

          const image = new Image();

          image.onerror = () =>
            reject(new Error("Could not open the picture."));

          image.onload = () => {
            const crop = Math.min(image.width, image.height);

            if (!crop) {
              reject(new Error("Invalid picture dimensions."));
              return;
            }

            const canvas = document.createElement("canvas");
            canvas.width = 256;
            canvas.height = 256;

            const context = canvas.getContext("2d");

            if (!context) {
              reject(new Error("Could not process the picture."));
              return;
            }

            context.drawImage(
              image,
              (image.width - crop) / 2,
              (image.height - crop) / 2,
              crop,
              crop,
              0,
              0,
              256,
              256,
            );

            const result = canvas.toDataURL("image/webp", 0.8);

            if (result.length > 300000) {
              reject(new Error("The processed picture is too large."));
              return;
            }

            resolve(result);
          };

          image.src = reader.result;
        };

        reader.readAsDataURL(file);
      });

      setPersonDraft((current) =>
        current?.id === personId
          ? { ...current, avatarData: data }
          : current
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not process the picture."
      );
    }
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
  // P36C.1G - Section management.
  // P36C.1H.1 - Classification management functions.
  function storeClassificationOptions(options: string[]) {
    setClassificationOptions(options);
    try {
      window.localStorage.setItem(
        "my-life-v2-classification-options",
        JSON.stringify(options)
      );
    } catch {
      setError("Could not save classifications in this browser.");
    }
  }

  function addClassification() {
    const name = newClassificationName.trim();

    if (!name) return;

    if (
      classificationOptions.some(
        (option) => option.toLowerCase() === name.toLowerCase()
      )
    ) {
      setError("That classification already exists.");
      return;
    }

    const currentColors = {
      ...readClassificationColors(),
      ...classificationColors,
    };
    const color = nextClassificationColor(
      classificationOptions,
      currentColors
    );
    if (!persistClassificationColors({
      ...currentColors,
      [name]: color,
    })) return;

    storeClassificationOptions([...classificationOptions, name]);

    setDraft((current) =>
      current ? { ...current, classification: name } : current
    );

    setNewClassificationName("");
    setError("");
  }

  function renameClassification() {
    const name = classificationRenameName.trim();
    const oldName = classificationRenameOld;

    if (!oldName || !name) return;

    if (
      classificationOptions.some(
        (option) =>
          option !== oldName &&
          option.toLowerCase() === name.toLowerCase()
      )
    ) {
      setError("That classification already exists.");
      return;
    }

    const currentColors = {
      ...readClassificationColors(),
      ...classificationColors,
    };
    const oldColor =
      currentColors[oldName] || legacyClassificationColor(oldName);

    // Keep the old mapping too: previously saved tasks may still use
    // the old Classification name until they are reassigned.
    if (!persistClassificationColors({
      ...currentColors,
      [oldName]: oldColor,
      [name]: oldColor,
    })) return;

    storeClassificationOptions(
      classificationOptions.map((option) =>
        option === oldName ? name : option
      )
    );

    setDraft((current) =>
      current && current.classification === oldName
        ? { ...current, classification: name }
        : current
    );

    setClassificationRenameOld("");
    setClassificationRenameName("");
    setError("");
  }

  function deleteClassification(name: string) {
    if (classificationOptions.length <= 1) {
      setError("At least one classification must remain.");
      return;
    }

    if (
      tasks.some((task) => task.classification === name)
    ) {
      setError(
        "This classification is assigned to tasks. Reassign those tasks before deleting it."
      );
      return;
    }

    if (
      !window.confirm(
        `Delete classification "${name}" from this browser's list?`
      )
    ) return;

    const next = classificationOptions.filter(
      (option) => option !== name
    );

    const currentColors = {
      ...readClassificationColors(),
      ...classificationColors,
    };
    const nextColors = { ...currentColors };
    delete nextColors[name];
    if (!persistClassificationColors(nextColors)) return;

    storeClassificationOptions(next);

    setDraft((current) =>
      current && current.classification === name
        ? { ...current, classification: next[0] ?? "Task" }
        : current
    );

    setClassificationRenameOld("");
    setClassificationRenameName("");
    setError("");
  }

  async function renameTaskEditorSection() {
    if (!draft || busy) return;
    const section = sections.find(
      (item) =>
        item.id === taskSectionRenameId &&
        item.projectId === draft.projectId
    );
    const name = taskSectionRenameName.trim();
    if (!section || !name) {
      setError("Choose a section and enter a name.");
      return;
    }
    if (
      sections.some(
        (item) =>
          item.projectId === draft.projectId &&
          item.id !== section.id &&
          item.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      setError("A section with that name already exists.");
      return;
    }
    if (
      await mutate(
        { action: "saveSection", section: { ...section, name } },
        "Section renamed"
      )
    ) {
      setTaskSectionRenameId("");
      setTaskSectionRenameName("");
    }
  }

  async function deleteTaskEditorSection(sectionId: string) {
    if (!draft || busy) return;
    const section = sections.find(
      (item) => item.id === sectionId && item.projectId === draft.projectId
    );
    if (!section) return;
    if (tasks.some((item) => item.sectionId === sectionId)) {
      setError(
        "This section contains tasks. Move them to another section before deleting it."
      );
      return;
    }
    if (
      !window.confirm(
        `Delete the empty section "${section.name}"?`
      )
    ) return;
    if (
      await mutate(
        { action: "deleteSection", id: sectionId },
        "Section deleted"
      )
    ) {
      if (draft.sectionId === sectionId) {
        setDraft((current) =>
          current ? { ...current, sectionId: "" } : current
        );
      }
      setTaskSectionRenameId("");
      setTaskSectionRenameName("");
    }
  }

  // STEP 18F.23I.43I-P35C - Create a section for the task's selected project.
  async function createTaskSection() {
    if (!draft || busy) return;

    const name = taskSectionName.trim();
    const projectId = draft.projectId;

    if (!name) {
      setError("Enter a section name.");
      return;
    }

    if (!projects.some((item) => item.id === projectId)) {
      setError("Please select a valid project.");
      return;
    }

    const existing = sections.find(
      (section) =>
        section.projectId === projectId &&
        section.name.trim().toLowerCase() === name.toLowerCase(),
    );

    if (existing) {
      setDraft((current) =>
        current && current.projectId === projectId
          ? { ...current, sectionId: existing.id }
          : current,
      );
      setTaskSectionName("");
      setTaskSectionCreating(false);
      setError("");
      return;
    }

    const section: Section = {
      id: crypto.randomUUID(),
      projectId,
      name,
      sortOrder: sections.filter(
        (item) => item.projectId === projectId,
      ).length,
    };

    const saved = await mutate(
      { action: "saveSection", section },
      "Section created",
    );

    if (saved) {
      setDraft((current) =>
        current && current.projectId === projectId
          ? { ...current, sectionId: section.id }
          : current,
      );
      setTaskSectionName("");
      setTaskSectionCreating(false);
    }
  }

  function newSection() {
    // STEP 18F.23I.43I-P29 - Master List can create project sections.
    const selectedProjectId = project?.id ?? "";
    setSectionDraft({
      id: crypto.randomUUID(),
      projectId: selectedProjectId,
      name: "",
      sortOrder: project
        ? projectSections.length
        : 0,
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
    // P29 - Never save a section without an existing project.
    if (
      !sectionDraft ||
      !projects.some((item) => item.id === sectionDraft.projectId)
    ) {
      setError("Please select a valid project for this section.");
      return;
    }
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

    if (unit === "weeks") {
      const date = new Date(Date.UTC(year, month - 1, day));
      date.setUTCDate(date.getUTCDate() + amount * 7);
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

    if (saved && status === "Done" && t.status !== "Done") {
      celebrateTaskCompletion();
    }
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
    attachments: [],
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
    targetId?: string,
  ) {
    // STEP 18F.23I.37E - Resolve the task's own project in global List.
    const movedTask = tasks.find((task) => task.id === taskId);
    if (!movedTask) return;

    const reorderProjectId = project?.id ?? movedTask.projectId;

    // Never reorder a task outside the currently selected project.
    if (project && movedTask.projectId !== project.id) return;

    const projectTasks = tasks.filter(
      (task) => task.projectId === reorderProjectId,
    );
    const moved = projectTasks.find((task) => task.id === taskId);
    if (!moved) return;

    const target = targetId
      ? projectTasks.find((task) => task.id === targetId)
      : undefined;

    if (targetId && !target) return;
    if (target && target.id === moved.id) return;
    if (target && target.sectionId !== sectionId) return;

    const sourceSectionId = moved.sectionId;

    const ordered = (id: string) =>
      projectTasks
        .filter((task) => task.sectionId === id && task.id !== moved.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const destination = ordered(sectionId);
    const targetIndex = target
      ? destination.findIndex((task) => task.id === target.id)
      : destination.length;

    const movingDown =
      target &&
      sourceSectionId === sectionId &&
      moved.sortOrder < target.sortOrder;

    const insertionIndex = targetIndex + (movingDown ? 1 : 0);

    if (insertionIndex < 0) return;

    destination.splice(insertionIndex, 0, moved);
    const items: Array<{
      id: string;
      sectionId: string;
      sortOrder: number;
    }> = [];

    if (sourceSectionId !== sectionId) {
      ordered(sourceSectionId).forEach((task, index) => {
        items.push({
          id: task.id,
          sectionId: sourceSectionId,
          sortOrder: index,
        });
      });
    }

    destination.forEach((task, index) => {
      items.push({
        id: task.id,
        sectionId,
        sortOrder: index,
      });
    });

    const changed = items.filter((item) => {
      const previous = projectTasks.find((task) => task.id === item.id);
      return (
        previous &&
        (previous.sectionId !== item.sectionId ||
          previous.sortOrder !== item.sortOrder)
      );
    });

    if (!changed.length) return;

    await mutate(
      {
        action: "reorderListTasks",
        projectId: reorderProjectId,
        items: changed,
      },
      "Task reordered",
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
    gridTemplateColumns: `${orderedListColumnIds
      .map((id) =>
        id === "task-name"
          ? "minmax(260px,2.6fr)"
          : "minmax(145px,1fr)",
      )
      .join(" ")} 105px`,
  };
  const renderListRow = (t: Task) => (
    <div
      className="list-row"
      style={listGrid}
      key={t.id}
      draggable={!busy}
      onDragStart={(e) => {
        if ((e.target as HTMLElement).closest("button, input, select, textarea, [role='combobox']")) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.effectAllowed = "move";
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

        if (data.startsWith("task-list:")) {
          const draggedTaskId = data.slice(10);

          if (draggedTaskId === t.id) return;

          void moveTaskToSection(
            draggedTaskId,
            t.sectionId,
            t.id,
          );
        }
      }}
    >
      {orderedListColumnIds.map((columnId) => {
        if (columnId === "task-name") {
          return (
            <div className="list-name" key={columnId}>
              <span
                className="list-task-drag-handle"
                draggable={!busy}
                role="button"
                aria-label={`Drag ${t.title}`}
                title="Drag task"
                onDragStart={(e) => {
                  e.stopPropagation();
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", `task-list:${t.id}`);
                  setDragging(t.id);
                }}
                onDragEnd={() => setDragging(null)}
              >
                <GripVertical size={14} />
              </span>
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
          );
        }

        const field = projectFields.find(
          (item) => `field:${item.id}` === columnId,
        );

        if (!field) return null;

        if (field.type === "Choice") {
          return (
            <ChoiceDropdown
              key={columnId}
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
                      customValues: {
                        ...t.customValues,
                        [field.id]: value,
                      },
                    },
                  },
                  `${field.name} updated`,
                )
              }
              onEdit={() => editField(field)}
            />
          );
        }

        return (
          <button
            className="custom-value-cell"
            key={columnId}
            onClick={() => editTask(t)}
            title={fieldValue(t, field)}
          >
            {fieldValue(t, field)}
          </button>
        );
      })}
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
  const calendarTimelineHours = Array.from({ length: 24 }, (_, hour) => hour);
  const calendarHourHeight = 64;

  const calendarTimeToMinutes = (value: string) => {
    if (!value) return null;

    const [hourText, minuteText] = value.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (
      !Number.isInteger(hour) ||
      !Number.isInteger(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      return null;
    }

    return hour * 60 + minute;
  };

  const calendarHourLabel = (hour: number) => {
    const date = new Date(2000, 0, 1, hour, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const taskOccursOnDate = (task: Task, dateKey: string) => {
    if (!task.due) return false;
    const movedToThisDate = taskRecurrenceExceptions.some(
      (item) =>
        item.taskId === task.id &&
        item.movedDate === dateKey,
    );

    if (movedToThisDate) return true;

    const movedFromThisDate = taskRecurrenceExceptions.some(
      (item) =>
        item.taskId === task.id &&
        item.originalDate === dateKey &&
        item.movedDate !== dateKey,
    );

    if (movedFromThisDate) return false;

    if (task.due === dateKey) return true;

    // A completed recurring task remains visible on its real due date,
    // but must not generate future calendar previews. The next real
    // occurrence is created when the task is completed.
    if (task.status === "Done") return false;

    const unit = task.recurrenceUnit || "none";
    if (unit === "none" || dateKey < task.due) return false;

    let occurrence = task.due;
    let guard = 0;

    while (occurrence < dateKey && guard < 10000) {
      const next = nextRecurringDate(
        occurrence,
        task.recurrenceInterval || 1,
        unit,
      );

      if (next <= occurrence) return false;

      occurrence = next;
      guard += 1;
    }

    return occurrence === dateKey;
  };

  // STEP P36C.1N.1E - Read-only live notification projection.
  // Reuses the Calendar's recurrence and moved-occurrence rules.
  const notificationItems = (() => {
    const result: Array<{
      id: string;
      taskId: string;
      title: string;
      detail: string;
      category: "overdue" | "today" | "appointment";
    }> = [];

    const now = new Date();
    const localDate = (date: Date) =>
      [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

    const today = localDate(now);
    const dates = Array.from({ length: 8 }, (_, offset) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + offset
      );
      return localDate(date);
    });

    for (const task of tasks) {
      if (task.status === "Done") continue;

      const appointment =
        (task.classification || "Task").trim().toLowerCase() ===
        "appointment";

      if (!appointment && task.due && task.due < today &&
          (task.recurrenceUnit || "none") === "none" &&
          !taskRecurrenceExceptions.some(
            (exception) =>
              exception.taskId === task.id &&
              exception.originalDate === task.due &&
              exception.movedDate !== task.due
          )) {
        result.push({
          id: `overdue:${task.id}:${task.due}`,
          taskId: task.id,
          title: task.title || "Untitled task",
          detail: `Overdue since ${task.due}`,
          category: "overdue",
        });
      }

      if (!appointment && taskOccursOnDate(task, today)) {
        result.push({
          id: `today:${task.id}:${today}`,
          taskId: task.id,
          title: task.title || "Untitled task",
          detail: task.dueTime
            ? `Due today at ${task.dueTime}`
            : "Due today",
          category: "today",
        });
      }

      if (appointment) {
        for (const date of dates) {
          if (!taskOccursOnDate(task, date)) continue;

          const exception = taskRecurrenceExceptions.find(
            (item) =>
              item.taskId === task.id &&
              item.movedDate === date
          );
          const time = exception?.movedDueTime ?? task.dueTime;

          result.push({
            id: `appointment:${task.id}:${date}`,
            taskId: task.id,
            title: task.title || "Untitled appointment",
            detail: `${date === today ? "Today" : date}${
              time ? ` at ${time}` : ""
            }`,
            category: "appointment",
          });
        }
      }
    }

    const priority = {
      overdue: 0,
      today: 1,
      appointment: 2,
    };

    return result
      .sort((a, b) =>
        priority[a.category] - priority[b.category] ||
        a.detail.localeCompare(b.detail) ||
        a.title.localeCompare(b.title)
      )
      .slice(0, 100);
  })();

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
    <div className="app-shell ml-v2">
      <TaskCompletionCelebration trigger={celebrationId} />
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

      <div className="main-content ml-v2-compat-main">
        <MyLifeAppShell
          activeView={active === "all" && view === "List" ? "list" : active}
          navigation={[
            {
              id: "home",
              label: "Overview",
              icon: Home,
            },
            {
              id: "mine",
              label: "My tasks",
              icon: CircleCheck,
              badge: tasks.filter(
                (task) =>
                  task.assignee.toLowerCase() ===
                    currentPersonName.toLowerCase() &&
                  task.status !== "Done",
              ).length,
            },
            {
              id: "all",
              label: "All tasks",
              icon: LayoutGrid,
            },
            // STEP 18F.23I.34C-R2 - LIST SIDEBAR
            {
              id: "list",
              label: "List",
              icon: List,
            },
            // STEP 18F.23I.31C.6S - CALENDAR SIDEBAR
            {
              id: "calendar",
              label: "Calendar",
              icon: CalendarDays,
            },
            ...projects.map((item) => ({
              id: item.id,
              label: item.name,
              icon: projectIcons[item.icon || "folder"],
              badge: tasks.filter(
                (task) =>
                  task.projectId === item.id &&
                  task.status !== "Done",
              ).length,
              section: "projects" as const,
              color: item.color,
              textColor: item.sidebarFontColor ?? undefined,
            })),
          ]}
          title={
            active === "home"
              ? "Overview"
              : active === "notes"
                ? "Notes"
                : active === "calendar"
                  ? "Calendar"
                  : project?.name || title
          }
          subtitle={
            project?.description ||
            (active === "calendar"
              ? "Your tasks and schedule in one place."
              : active === "mine"
              ? "A clear view of the work assigned to you."
              : active === "home"
                ? "Everything important, all in one place."
                : "Keep your projects moving, one small step at a time.")
          }
          userName={currentUser?.name}
          userRole={currentUser?.role}
          appVersion={appVersion}
          isDevelopment={packageJson.version !== "2.0.0"}
          exportDisabled={loading}

          summaryTiles={{
            dueToday: dueToday,
            overdue: overdue,
            upcomingCount: upcoming,
            projectsCount: projects.length,
            peopleNames: people.map((person) => person.name),
            peopleAvatars: people.map((person) => ({
              id: person.id,
              name: person.name,
              avatarData: person.avatarData ?? null,
            })),
            onShowDueToday: () => {
              navigate("all");
              setView("List");
              setStatusFilter("All statuses");
              setTaskDateFilter("today");
            },
            onShowOverdue: () => {
              navigate("all");
              setView("List");
              setStatusFilter("All statuses");
              setTaskDateFilter("overdue");
            },
            onShowUpcoming: () => {
              navigate("all");
              setView("List");
              setTaskDateFilter("upcoming");
            },
            onShowProjects: () => {
              navigate("all");
              setView("Board");
            },
            onShowPeople: () => {
              setPersonDraft(null);
              setPeopleOpen(true);
            },
          }}
          onNavigate={(id) => {
            // STEP 18F.23I.38D - Restore List sidebar navigation.
            if (id === "list") {
              navigate("all");
              setView("List");
              setTaskDateFilter("all");
              setStatusFilter("All statuses");
              return;
            }
            // STEP 18F.23I.38E - All Tasks opens its Board view.
            if (id === "all") {
              navigate("all");
              setView("Board");
              setTaskDateFilter("all");
              setStatusFilter("All statuses");
              return;
            }
            // STEP 18F.23I.43I-P7 - Sidebar projects always open Board.
            if (projects.some((item) => item.id === id)) {
              navigate(id);
              setView("Board");
              return;
            }
            navigate(id);
          }}
          searchItems={globalSearchItems}
          notificationItems={notificationItems}
          onSearchOpen={openGlobalSearchResult}
          onAccountClick={() => setAccountOpen(true)}
          onAddTask={() => newTask()}
          onPeopleClick={() => {
            setPersonDraft(null);
            setPeopleOpen(true);
          }}
          onCreateProject={newProject}
          onRenameProject={(id) => {
            const selectedProject = projects.find((p) => p.id === id);
            if (!selectedProject) return;
            setProjectDraft({
              ...selectedProject,
              sidebarFontColor:
                selectedProject.sidebarFontColor ?? "#ffffff",
            });
            setConfirmDelete(false);
          }}
          onExport={exportWorkspace}
          onAdminClick={() => {
            setAdminUsersOpen(true);
            void loadAdminUsers();
          }}
          onHelpClick={() => setHelp(true)}
          onLogout={async () => {
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
        {/* STEP 18F.23I.31C.2B - NOTES ROUTING */}
        {active === "notes" ? (
          <MyLifeNotesWorkspace
            initialNoteId={overviewNoteIdRef.current}
            selectionSignal={globalNoteSelection}
          />
        ) : (
          <>
        {active !== "home" && active !== "calendar" && (
          <section className={`project-header${project ? " project-header--project" : ""}`}>
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
                âš  {overdue} Overdue
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
                … {dueToday} Due Today
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
        )}
        {active !== "home" && active !== "calendar" && <div className={`viewbar${project ? " ml-v2-project-legacy-bar" : ""}`}>
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
        </div>}
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
            {/* 18F.20L.40N */}
            {active !== "home" && (
            <div className={`toolbar${project ? " ml-v2-project-legacy-toolbar" : ""}`}>
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
                {project && (
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Edit project"
                    title="Edit project"
                    onClick={() => {
                      setProjectDraft({
                        ...project,
                        sidebarFontColor:
                          project.sidebarFontColor ?? "#ffffff",
                      });
                      setConfirmDelete(false);
                    }}
                  >
                    <Settings size={14} />
                  </Button>
                )}
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
                {/* STEP 18F.23I.41F-R1 - List top actions */}
                {view === "List" ? (
                  <>
                    <Button
                      className="ml-v2-standard-button"
                      variant="outline"
                      size="sm"
                      onClick={() => newTask()}
                      disabled={busy}
                    >
                      <Plus size={15} />
                      Add Task
                    </Button>
                    <span
                      title={
                        project
                          ? "Add a section to this project"
                          : "Select a project to add a section"
                      }
                    >
                      <Button
                        className="ml-v2-standard-button"
                        variant="outline"
                        size="sm"
                        onClick={newSection}
                        disabled={busy || !project}
                      >
                        <Plus size={15} />
                        Add Section
                      </Button>
                    </span>
                  </>
                ) : (
                  <Button onClick={() => newTask()} disabled={busy}>
                    <Plus size={15} />
                    Add task
                  </Button>
                )}
              </div>
            </div>
            )}
            {/* STEP 18F.23I.43I-P12 - Project view switcher */}
            {/* STEP 18F.23I.43I-P31 - Project Board and Calendar toolbar */}
            {project && (view === "Board" || view === "Calendar") && (
              <div
                className="ml-v2-project-view-switcher"
                role="group"
                aria-label="Project display view"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                }}
              >
                {([
                  { name: "Board", icon: LayoutGrid },
                  { name: "List", icon: List },
                  { name: "Calendar", icon: CalendarDays },
                ] as const).map(({ name, icon: Icon }) => (
                  <Button
                    key={name}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-v2-standard-button"
                    aria-pressed={view === name}
                    onClick={() => setView(name)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      backgroundColor:
                        view === name ? "#7656db" : undefined,
                      color:
                        view === name ? "#ffffff" : undefined,
                      borderColor:
                        view === name ? "#7656db" : undefined,
                    }}
                  >
                    <Icon size={15} />
                    {name}
                  </Button>
                ))}
              </div>
            )}
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
                  <div className="list-customize ml-v2-project-legacy-customize">
                    <span>
                      Organize this list with sections and your own columns.
                    </span>
                    <Button className="ml-v2-standard-button" variant="outline" size="sm" onClick={newSection}>
                      <Plus size={14} />
                      Add section
                    </Button>
                    <Button
                      className="ml-v2-standard-button"
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
                  {/* STEP 18F.23I.41P - Actions outside draggable grid */}
                  <div className="ml-v2-list-action-bar">
                    {/* STEP 18F.23I.43I-P15 - Consolidated project controls */}
                    {project && (
                      <div
                        className="ml-v2-project-unified-actions"
                        role="group"
                        aria-label="Project views and actions"
                      >
                        {([
                          { name: "Board", icon: LayoutGrid },
                          { name: "List", icon: List },
                          { name: "Calendar", icon: CalendarDays },
                        ] as const).map(({ name, icon: Icon }) => (
                          <Button
                            key={name}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="ml-v2-standard-button"
                            aria-pressed={view === name}
                            onClick={() => setView(name)}
                            style={{
                              backgroundColor:
                                view === name ? "#7656db" : undefined,
                              color:
                                view === name ? "#ffffff" : undefined,
                              borderColor:
                                view === name ? "#7656db" : undefined,
                            }}
                          >
                            <Icon size={14} />
                            {name}
                          </Button>
                        ))}
                        <Button
                          type="button"
                          className="ml-v2-standard-button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => newTask()}
                        >
                          <Plus size={14} />
                          Add Task
                        </Button>
                        <Button
                          type="button"
                          className="ml-v2-standard-button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={newSection}
                        >
                          <Plus size={14} />
                          Add Section
                        </Button>
                        <Button
                          type="button"
                          className="ml-v2-standard-button"
                          variant="outline"
                          size="sm"
                          onClick={() => setColumnsOpen(true)}
                        >
                          <Columns3 size={14} />
                          Add Columns
                        </Button>
                      </div>
                    )}
                    {!project && (
                    <>
                    {/* STEP 18F.23I.41J - List header task and section actions */}
                    <div className="ml-v2-list-header-actions">
                      <button
                        type="button"
                        className="ml-v2-standard-button"
                        disabled={busy}
                        onClick={() => newTask()}
                      >
                        <Plus size={13} />
                        Add Task
                      </button>
                      <span
                        title={
                          project
                            ? "Add a section to this project"
                            : "Select a project to add a section"
                        }
                      >
                        <button
                          type="button"
                          className="ml-v2-standard-button"
                          disabled={busy || projects.length === 0}
                          onClick={newSection}
                        >
                          <Plus size={13} />
                          Add Section
                        </button>
                      </span>
                      {/* STEP 18F.23I.43I-P27 - Master List columns */}
                      <button
                        type="button"
                        className="ml-v2-standard-button"
                        onClick={() => setColumnsOpen(true)}
                      >
                        <Columns3 size={13} />
                        Add Columns
                      </button>
                    </div>
                    </>
                    )}
                  </div>
                  <div className="list-head" style={listGrid}>
                    {orderedListColumnIds.map((columnId) => {
                      const dragProps = {
                        "data-list-column-id": columnId,
                      };

                      if (columnId === "task-name") {
                        return (
                          <span
                            key={columnId}
                            className={`draggable-column-head ${
                              listColumnDragging === columnId ? "is-dragging" : ""
                            }`}
                            {...dragProps}
                          >
                            <span
                              className="column-drag-handle"
                              title="Drag to move Task name"
                              onPointerDown={(e) =>
                                startListColumnPointerDrag(columnId, e)
                              }
                            >
                              <GripVertical size={14} />
                            </span>
                            <span>Task name</span>
                          </span>
                        );
                      }

                      const field = projectFields.find(
                        (item) =>
                          `field:${item.id}` === columnId,
                      );

                      if (!field) return null;

                      return (
                        <button
                          key={columnId}
                          className={`custom-column-head draggable-column-head ${
                            listColumnDragging === columnId ? "is-dragging" : ""
                          }`}
                          onClick={() => {
                          if (listColumnDragMovedRef.current) {
                            listColumnDragMovedRef.current = false;
                            return;
                          }
                          editField(field);
                        }}
                          title={`Drag to move or click to edit ${field.name}`}
                          {...dragProps}
                        >
                          <span
                            className="column-drag-handle"
                            title={`Drag to move ${field.name}`}
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) =>
                              startListColumnPointerDrag(columnId, e)
                            }
                          >
                            <GripVertical size={14} />
                          </span>
                          <span>{field.name}</span>
                          <small>{field.type}</small>
                        </button>
                      );
                    })}
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
                        const sectionTasks = filtered
                          .filter((t) => t.sectionId === section.id)
                          .sort((a, b) => a.sortOrder - b.sortOrder),
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
                                <span
                                  className="section-grip"
                                  draggable={!busy}
                                  role="button"
                                  aria-label={`Drag ${section.name} section`}
                                  title="Drag section"
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    e.dataTransfer.effectAllowed = "move";
                                    e.dataTransfer.setData(
                                      "text/plain",
                                      `section:${section.id}`,
                                    );
                                    setDragging(section.id);
                                  }}
                                  onDragEnd={() => setDragging(null)}
                                >
                                  <GripVertical size={15} />
                                </span>
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
                                className="section-add-task ml-v2-standard-button"
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
                    // STEP 18F.23I.43I-P32B - Display all project sections in Master List.
                    <>
                      {projects.map((listProject) => {
                        const listProjectSections = sections
                          .filter((section) => section.projectId === listProject.id)
                          .sort((a, b) => a.sortOrder - b.sortOrder);
                        const listProjectTasks = filtered.filter(
                          (task) => task.projectId === listProject.id,
                        );
                        const unsectionedTasks = listProjectTasks
                          .filter((task) =>
                            !listProjectSections.some(
                              (section) => section.id === task.sectionId,
                            ),
                          )
                          .sort((a, b) => a.sortOrder - b.sortOrder);

                        if (!listProjectSections.length && !listProjectTasks.length) {
                          return null;
                        }

                        return (
                          <div key={listProject.id}>
                            <div className="list-section-head">
                              <strong>{listProject.name}</strong>
                              <span>{listProjectTasks.length}</span>
                            </div>
                            {unsectionedTasks.map(renderListRow)}
                            {listProjectSections.map((section) => {
                              const sectionTasks = listProjectTasks
                                .filter((task) => task.sectionId === section.id)
                                .sort((a, b) => a.sortOrder - b.sortOrder);
                              const collapsed = collapsedSections.includes(section.id);

                              return (
                                <section className="list-section" key={section.id}>
                                  <div className="list-section-head">
                                    <button
                                      type="button"
                                      aria-label={
                                        collapsed
                                          ? `Expand ${section.name}`
                                          : `Collapse ${section.name}`
                                      }
                                      onClick={() =>
                                        setCollapsedSections((current) =>
                                          current.includes(section.id)
                                            ? current.filter((id) => id !== section.id)
                                            : [...current, section.id],
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
                                  </div>
                                  {!collapsed && sectionTasks.map(renderListRow)}
                                </section>
                              );
                            })}
                          </div>
                        );
                      })}
                      {filtered
                        .filter((task) =>
                          !projects.some(
                            (listProject) => listProject.id === task.projectId,
                          ),
                        )
                        .map(renderListRow)}
                    </>
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
                      className="add-column-task ml-v2-standard-button"
                      onClick={() => newTask()}
                    >
                      <Plus size={14} />
                      Add task
                    </button>
                    {project && (
                      <button className="add-column-task ml-v2-standard-button" onClick={newSection}>
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
                    {/* STEP 18F.23I.40Q - Calendar Add Task, right of Today. */}
                    <Button
                      className="ml-v2-standard-button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => newTask()}
                    >
                      <Plus size={15} />
                      Add Task
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
                {calendarMode === "month" ? (
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
                          if (task && !busy && task.due !== key) {
                            if (
                              task.recurrenceUnit !== "none" &&
                              calendarDragOccurrence?.taskId === task.id
                            ) {
                              setCalendarMoveChoice({
                                taskId: task.id,
                                occurrenceDate:
                                  calendarDragOccurrence.occurrenceDate,
                                targetDate: key,
                              });
                            } else {
                              void mutate(
                                {
                                  action: "saveTask",
                                  task: { ...task, due: key },
                                },
                                `Moved to ${dateText(key)}`,
                              );
                            }
                          }
                          setDragging(null);
                        }}
                      >
                        <span className={key === todayKey() ? "today" : ""}>
                          {d.getDate()}
                        </span>
                        {filtered
                          .filter((t) => taskOccursOnDate(t, key))
                          .map((t) => {
                            const isOriginalOccurrence = t.due === key;

                            const occurrenceException =
                              taskRecurrenceExceptions.find(
                                (item) =>
                                  item.taskId === t.id &&
                                  item.movedDate === key,
                              );

                            const occurrenceDueTime =
                              occurrenceException?.movedDueTime ??
                              t.dueTime;

                            const occurrenceEndTime =
                              occurrenceException?.movedEndTime ??
                              t.endTime;

                            return (
                            <div
                              className="calendar-entry"
                              key={`${t.id}:${key}`}
                            >
                              <button
                                draggable={!busy}
                                onDragStart={(e) => {
                                  setCalendarDragOccurrence({
                                    taskId: t.id,
                                    occurrenceDate:
                                      taskRecurrenceExceptions.find(
                                        (item) =>
                                          item.taskId === t.id &&
                                          item.movedDate === key,
                                      )?.originalDate ?? key,
                                  });
                                  setDragging(t.id);
                                  e.dataTransfer.setData("text/plain", t.id);
                                  e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragEnd={() => {
                                  setCalendarDragOccurrence(null);
                                  setDragging(null);
                                }}
                                className={`calendar-task ${t.status === "Done" ? "struck" : ""} ${dragging === t.id && calendarDragOccurrence?.occurrenceDate === key ? "dragging" : ""}`}
                                style={{
                                  background: t.color || "#e5e5e5",
                                  ...taskTextStyle(t, "calendar"),
                                }}
                                onClick={() => editTask(t)}
                              >
                                {occurrenceDueTime && (
                                  <span className="calendar-entry-time">
                                    {occurrenceDueTime}
                                    {occurrenceEndTime &&
                                      `–${occurrenceEndTime}`}
                                  </span>
                                )}
                                <span className="calendar-task-title">
                                  {t.title}
                                  {t.emoji && ` ${t.emoji}`}
                                </span>
                              </button>
                            </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
                ) : (
                  <div className={`calendar-timeline calendar-timeline--${calendarMode}`}>
                    <div
                      className="calendar-timeline-header"
                      style={{
                        gridTemplateColumns: `72px repeat(${calendarDates.length}, minmax(140px, 1fr))`,
                      }}
                    >
                      <div className="calendar-timeline-time-header" />

                      {calendarDates.map((date) => {
                        const dateKey = `${date.getFullYear()}-${String(
                          date.getMonth() + 1,
                        ).padStart(2, "0")}-${String(date.getDate()).padStart(
                          2,
                          "0",
                        )}`;

                        return (
                          <div
                            className={`calendar-timeline-date-header ${
                              dateKey === todayKey() ? "today" : ""
                            }`}
                            key={dateKey}
                          >
                            <span>
                              {date.toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </span>
                            <strong>{date.getDate()}</strong>
                          </div>
                        );
                      })}
                    </div>

                    <div
                      className="calendar-timeline-body"
                      style={{
                        gridTemplateColumns: `72px repeat(${calendarDates.length}, minmax(140px, 1fr))`,
                      }}
                    >
                      <div className="calendar-timeline-hours">
                        {calendarTimelineHours.map((hour) => (
                          <div
                            className="calendar-timeline-hour-label"
                            key={hour}
                            style={{ height: `${calendarHourHeight}px` }}
                          >
                            {calendarHourLabel(hour)}
                          </div>
                        ))}
                      </div>

                      {calendarDates.map((date) => {
                        const dateKey = `${date.getFullYear()}-${String(
                          date.getMonth() + 1,
                        ).padStart(2, "0")}-${String(date.getDate()).padStart(
                          2,
                          "0",
                        )}`;

                        const timelineTasks = filtered.filter(
                          (task) =>
                            taskOccursOnDate(task, dateKey) &&
                            Boolean(task.dueTime),
                        );

                        return (
                          <div
                            className={`calendar-timeline-day ${
                              dateKey === todayKey() ? "today" : ""
                            }`}
                            key={dateKey}
                            onDragOver={(e) => {
                              e.preventDefault();

                              const bounds =
                                e.currentTarget.getBoundingClientRect();

                              const dragY = Math.max(
                                0,
                                Math.min(
                                  e.clientY - bounds.top,
                                  24 * calendarHourHeight,
                                ),
                              );

                              const rawTargetMinutes =
                                (dragY / calendarHourHeight) * 60;

                              const targetMinutes = Math.max(
                                0,
                                Math.min(
                                  Math.round(rawTargetMinutes / 15) * 15,
                                  23 * 60 + 45,
                                ),
                              );

                              setCalendarTimelineDropTarget((current) =>
                                current?.date === dateKey &&
                                current.minutes === targetMinutes
                                  ? current
                                  : {
                                      date: dateKey,
                                      minutes: targetMinutes,
                                    },
                              );
                            }}
                            onDrop={(e) => {
                              e.preventDefault();


                              const task = tasks.find(
                                (item) =>
                                  item.id ===
                                  e.dataTransfer.getData("text/plain"),
                              );

                              if (task && !busy) {
                                const bounds =
                                  e.currentTarget.getBoundingClientRect();

                                const dropY = Math.max(
                                  0,
                                  Math.min(
                                    e.clientY - bounds.top,
                                    24 * calendarHourHeight,
                                  ),
                                );

                                const rawMinutes =
                                  (dropY / calendarHourHeight) * 60;

                                const snappedMinutes =
                                  calendarTimelineDropTarget?.date === dateKey
                                    ? calendarTimelineDropTarget.minutes
                                    : Math.max(
                                        0,
                                        Math.min(
                                          Math.round(rawMinutes / 15) * 15,
                                          23 * 60 + 45,
                                        ),
                                      );

                                const originalStart =
                                  calendarTimeToMinutes(task.dueTime) ?? 0;

                                const parsedOriginalEnd =
                                  calendarTimeToMinutes(task.endTime);

                                const duration =
                                  parsedOriginalEnd !== null &&
                                  parsedOriginalEnd > originalStart
                                    ? parsedOriginalEnd - originalStart
                                    : 60;

                                const newEndMinutes = Math.min(
                                  snappedMinutes + duration,
                                  24 * 60 - 1,
                                );

                                const minutesToTime = (minutes: number) => {
                                  const hour = Math.floor(minutes / 60);
                                  const minute = minutes % 60;

                                  return `${String(hour).padStart(
                                    2,
                                    "0",
                                  )}:${String(minute).padStart(2, "0")}`;
                                };

                                const newDueTime =
                                  minutesToTime(snappedMinutes);

                                const newEndTime =
                                  minutesToTime(newEndMinutes);

                                if (
                                  task.recurrenceUnit !== "none" &&
                                  calendarDragOccurrence?.taskId === task.id
                                ) {
                                  setCalendarMoveChoice({
                                    taskId: task.id,
                                    occurrenceDate:
                                      calendarDragOccurrence.occurrenceDate,
                                    targetDate: dateKey,
                                    targetDueTime: newDueTime,
                                    targetEndTime: newEndTime,
                                  });
                                } else {
                                  void mutate(
                                    {
                                      action: "saveTask",
                                      task: {
                                        ...task,
                                        due: dateKey,
                                        dueTime: newDueTime,
                                        endTime: newEndTime,
                                      },
                                    },
                                    `Moved to ${dateText(
                                      dateKey,
                                    )} at ${newDueTime}`,
                                  );
                                }
                              }

                              setCalendarTimelineDropTarget(null);
                              setDragging(null);
                            }}
                            style={{
                              height: `${24 * calendarHourHeight}px`,
                              backgroundSize: `100% ${calendarHourHeight}px`,
                            }}
                          >
                            {calendarTimelineDropTarget?.date === dateKey && (
                            <div
                              className="calendar-timeline-drop-target"
                              style={{
                                top: `${
                                  (calendarTimelineDropTarget.minutes / 60) *
                                  calendarHourHeight
                                }px`,
                                height: `${calendarHourHeight / 4}px`,
                              }}
                            >
                              <span>
                                {calendarHourLabel(
                                  Math.floor(
                                    calendarTimelineDropTarget.minutes / 60,
                                  ),
                                ).replace(
                                  ":00",
                                  `:${String(
                                    calendarTimelineDropTarget.minutes % 60,
                                  ).padStart(2, "0")}`,
                                )}
                              </span>
                            </div>
                          )}

                          {timelineTasks.map((task) => {
                              const occurrenceException =
                                taskRecurrenceExceptions.find(
                                  (item) =>
                                    item.taskId === task.id &&
                                    item.movedDate === dateKey,
                                );

                              const occurrenceDueTime =
                                occurrenceException?.movedDueTime ??
                                task.dueTime;

                              const occurrenceEndTime =
                                occurrenceException?.movedEndTime ??
                                task.endTime;

                              const startMinutes =
                                calendarTimeToMinutes(occurrenceDueTime);

                              if (startMinutes === null) return null;

                              const parsedEndMinutes =
                                calendarTimeToMinutes(occurrenceEndTime);

                              const endMinutes =
                                parsedEndMinutes !== null &&
                                parsedEndMinutes > startMinutes
                                  ? parsedEndMinutes
                                  : Math.min(startMinutes + 60, 24 * 60);

                              const top =
                                (startMinutes / 60) * calendarHourHeight;

                              const height = Math.max(
                                ((endMinutes - startMinutes) / 60) *
                                  calendarHourHeight,
                                28,
                              );

                              return (
                                <button
                                  draggable={!busy}
                                  onDragStart={(e) => {

                                    setCalendarDragOccurrence({
                                      taskId: task.id,
                                      occurrenceDate:
                                        taskRecurrenceExceptions.find(
                                          (item) =>
                                            item.taskId === task.id &&
                                            item.movedDate === dateKey,
                                        )?.originalDate ?? dateKey,
                                    });
                                    setDragging(task.id);
                                    e.dataTransfer.setData(
                                      "text/plain",
                                      task.id,
                                    );
                                    e.dataTransfer.effectAllowed = "move";
                                  }}
                                  onDragEnd={() => {
                                    setCalendarTimelineDropTarget(null);
                                    setCalendarDragOccurrence(null);
                                    setDragging(null);
                                  }}
                                  className={`calendar-timeline-task ${
                                    task.status === "Done" ? "struck" : ""
                                  } ${
                                    dragging === task.id &&
                                    calendarDragOccurrence?.occurrenceDate ===
                                      dateKey
                                      ? "dragging"
                                      : ""
                                  }`}
                                  key={`${task.id}:${dateKey}`}
                                  style={{
                                    top: `${top}px`,
                                    height: `${height}px`,
                                    background: task.color || "#e5e5e5",
                                    ...taskTextStyle(task, "calendar"),
                                  }}
                                  onClick={() => editTask(task)}
                                  title={`${task.title} ${occurrenceDueTime}${
                                    occurrenceEndTime
                                      ? ` - ${occurrenceEndTime}`
                                      : ""
                                  }`}
                                >
                                  <span className="calendar-timeline-task-time">
                                    {occurrenceDueTime}
                                    {occurrenceEndTime &&
                                      ` - ${occurrenceEndTime}`}
                                  </span>

                                  <span className="calendar-timeline-task-title">
                                    {task.title}
                                    {task.emoji && ` ${task.emoji}`}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <p className="calendar-note">
                  Drag a task to another day to reschedule it -{" "}
                  {filtered.filter((t) => !t.due).length} tasks without a due
                  date.
                </p>
              </div>
            )}
            {view === "Overview" && (
              <MyLifeDashboard
                userName={currentUser?.name}
                // STEP 18F.23I.43F - Real project To Do tasks.
                projectTodoTasks={tasks.map((task) => ({
                  id: task.id,
                  projectId: task.projectId ?? "",
                  title: task.title,
                  status: task.status,
                  emoji: task.emoji,
                }))}
                onOpenProjectList={(projectId) => {
                  navigate(projectId);
                  setView("List");
                  setTaskDateFilter("all");
                  setStatusFilter("All statuses");
                }}
                // STEP 18F.23I.43I-P4 - Open task's project List.
                onOpenProjectTask={(taskId, projectId) => {
                  const task = tasks.find((item) => item.id === taskId);
                  if (!task || task.projectId !== projectId) return;
                  navigate(projectId);
                  setView("List");
                  setTaskDateFilter("all");
                  setStatusFilter("All statuses");
                }}
                inProgress={
                  scope.filter((task) => task.status === "In progress").length
                }
                dueToday={dueToday}
                overdue={overdue}
                completed={completed}
                upcomingCount={upcoming}
                peopleNames={people.map((person) => person.name)}
                peopleAvatars={people.map((person) => ({
                  id: person.id,
                  name: person.name,
                  avatarData: person.avatarData ?? null,
                }))}
                onShowUpcoming={() => {
                  navigate("all");
                  setView("List");
                  setTaskDateFilter("upcoming");
                }}
                onShowProjects={() => {
                  navigate("all");
                  setView("Board");
                }}
                // STEP 18F.23I.21C - DASHBOARD TODAY TO FULL CALENDAR
                onOpenCalendarToday={() => {
                  // STEP 18F.23I.40H - Keep Calendar sidebar selection in sync.
                  navigate("calendar");
                  setMonth(new Date());
                  setView("Calendar");
                }}
                onShowPeople={() => {
                  setPersonDraft(null);
                  setPeopleOpen(true);
                }}
                onShowInProgress={() => {
                  setTaskDateFilter("all");
                  setStatusFilter("In progress");
                }}
                onShowDueToday={() => {
                  navigate("all");
                  setView("List");
                  setStatusFilter("All statuses");
                  setTaskDateFilter("today");
                }}
                onShowOverdue={() => {
                  navigate("all");
                  setView("List");
                  setStatusFilter("All statuses");
                  setTaskDateFilter("overdue");
                }}
                onShowNotes={() => {
                  overviewNoteIdRef.current = null;
                  navigate("notes");
                }}
                onOpenNote={openOverviewNote}
                onShowCompleted={() => {
                  setTaskDateFilter("all");
                  setStatusFilter("Done");
                }}
                calendarTaskOccursOnDate={(taskId, date) => {
                  const task = tasks.find((item) => item.id === taskId);
                  return task ? taskOccursOnDate(task, date) : false;
                }}
                calendarTaskTimeForDate={(taskId, date) => {
                  const exception = taskRecurrenceExceptions.find(
                    (item) => item.taskId === taskId && item.movedDate === date,
                  );
                  return {
                    dueTime: exception?.movedDueTime ?? undefined,
                    endTime: exception?.movedEndTime ?? undefined,
                  };
                }}
                calendarTasks={tasks
                  .filter((task) => !!task.due)
                  .map((task) => ({
                    id: task.id,
                    title: task.title,
                    classification: task.classification || "Task",
                    classificationColorRevision: Object.keys(classificationColors).length,
                    emoji: task.emoji,
                    due: task.due,
                    dueTime: task.dueTime,
                    endTime: task.endTime,
                    status: task.status,
                    statusColor: workflowOption(task.status).color,
                    textStyle: taskTextStyle(task, "overview"),
                  }))}
                onCompleteTodayTask={async (id) => {
                  const task = tasks.find((item) => item.id === id);
                  if (!task || task.status === "Done" || busy) return;
                  await changeStatus(task, "Done");
                }}
                comingUpTasks={filtered
                  .filter(
                    (task) =>
                      task.status !== "Done",
                  )
                  .sort((a, b) =>
                    (a.due || "9999").localeCompare(
                      b.due || "9999",
                    ),
                  )
                  .map((task) => ({
                    id: task.id,
                    // STEP 18F.23I.43I-P19 - Resolve saved People avatars.
                    // Prefer exact matches; accept a unique first name only.
                    ...(() => {
                      const assignee = task.assignee.trim();
                      const normalized = assignee.toLocaleLowerCase();
                      const exactPerson = people.find(
                        (person) =>
                          person.id === assignee ||
                          person.name.trim().toLocaleLowerCase() === normalized,
                      );
                      const firstNameMatches = exactPerson
                        ? []
                        : people.filter(
                            (person) =>
                              person.name.trim().split(/\s+/)[0]
                                .toLocaleLowerCase() === normalized,
                          );
                      const matchedPerson =
                        exactPerson ??
                        (firstNameMatches.length === 1
                          ? firstNameMatches[0]
                          : undefined);

                      return {
                        assignee: matchedPerson?.name ?? task.assignee,
                        avatarData: matchedPerson?.avatarData ?? null,
                      };
                    })(),
                    dueTime:
                      taskRecurrenceExceptions.find(
                        (item) =>
                          item.taskId === task.id &&
                          item.movedDate === todayKey(),
                      )?.movedDueTime ?? task.dueTime,
                    title: task.title,
                    due: task.due,
                    status: task.status,
                    statusColor: workflowOption(task.status).color,
                    textStyle: taskTextStyle(task, "overview"),
                  }))}
                projects={(project ? [project] : projects).map(
                  (item) => {
                    const projectTasks = tasks.filter(
                      (task) => task.projectId === item.id,
                    );

                    const projectCompleted = projectTasks.filter(
                      (task) => task.status === "Done",
                    ).length;

                    return {
                      id: item.id,
                      name: item.name,
                      color: item.color,
                      completed: projectCompleted,
                      total: projectTasks.length,
                    };
                  },
                )}
                today={todayKey()}
                formatDate={dateText}
                onTaskClick={(taskId) => {
                  const task = tasks.find(
                    (item) => item.id === taskId,
                  );

                  if (task) editTask(task);
                }}
                onProjectClick={navigate}
                onCreateProject={newProject}
              />
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
            </>
        )}
      </MyLifeAppShell>
      </div>
      {notice && (
        <div className="toast" role="status">
          <CircleCheck size={16} />
          {notice}
        </div>
      )}
      <Dialog
        open={peopleOpen}
        onOpenChange={(open) => {
          // STEP 18F.23H.9 - RESET PEOPLE EDITOR
          setPeopleOpen(open);
          if (!open) setPersonDraft(null);
        }}
      >
        <DialogContent className="ml-v2-people-dialog">
          <DialogTitle>People</DialogTitle>
          <DialogDescription>Add people you assign tasks to. SMS is sent only when an assignee changes and their notifications are enabled.</DialogDescription>
          {personDraft ? (
            <form onSubmit={savePerson} className="editor-form">
              <div className="ml-person-photo-editor">
                <div className="ml-person-photo-preview">
                  {personDraft.avatarData ? (
                    <img
                      src={personDraft.avatarData}
                      alt="Profile picture preview"
                    />
                  ) : (
                    <span>
                      {personDraft.name.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                </div>

                <div className="ml-person-photo-actions">
                  <strong>Profile picture</strong>

                  <label className="ml-person-photo-browse ml-v2-standard-button">
                    {personDraft.avatarData ? "Replace photo" : "Browse photo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        void selectPersonPhoto(file);
                        event.target.value = "";
                      }}
                    />
                  </label>

                  {personDraft.avatarData && (
                    <button
                      type="button"
                      className="ml-person-photo-remove ml-v2-standard-button"
                      onClick={() =>
                        setPersonDraft({
                          ...personDraft,
                          avatarData: null,
                        })
                      }
                    >
                      Remove photo
                    </button>
                  )}

                  <small>
                    JPEG, PNG or WebP. Automatically resized.
                  </small>
                </div>
              </div>

              <label>Name<Input autoFocus required maxLength={100} value={personDraft.name} onChange={(e) => setPersonDraft({ ...personDraft, name: e.target.value })} /></label>
              <label>Mobile phone number<Input required type="tel" value={formatPersonPhone(personDraft.phone)} onChange={(e) => setPersonDraft({ ...personDraft, phone: formatPersonPhone(e.target.value) })} /></label>
              <label className="checkbox-row"><input type="checkbox" checked={personDraft.smsEnabled} onChange={(e) => setPersonDraft({ ...personDraft, smsEnabled: e.target.checked })} /> Send SMS notifications for new assignments</label>
              <div className="editor-footer"><Button className="ml-v2-standard-button" type="button" variant="ghost" onClick={() => setPersonDraft(null)}>Cancel</Button><Button className="ml-v2-standard-button" type="submit" disabled={busy}>Save person</Button></div>
            </form>
          ) : (
            <>
              <Button className="ml-v2-standard-button ml-v2-people-add-button" onClick={newPerson}><Plus size={15} /> Add person</Button>
              <div className="people-list">
                {/* STEP 18F.23I.19B - PEOPLE LIST AVATARS */}
                {people.map((person) => <div className="person-row" key={person.id}><span className="ml-person-list-avatar" aria-hidden="true">{person.avatarData ? <img src={person.avatarData} alt="" /> : (person.name.trim().charAt(0).toUpperCase() || "?")}</span><div><strong>{person.name}</strong><small>{formatPersonPhone(person.phone)} · SMS {person.smsEnabled ? "on" : "off"}</small></div><Button variant="ghost" size="sm" disabled={!person.smsEnabled || busy} onClick={() => void testSms(person)}>Test SMS</Button><Button variant="ghost" size="icon" aria-label={`Edit ${person.name}`} onClick={() => setPersonDraft({ ...person })}><Pencil size={14} /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${person.name}`} onClick={() => void mutate({ action: "deletePerson", id: person.id }, "Person deleted")}><Trash2 size={14} /></Button></div>)}
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
            <form onSubmit={saveTask} className="editor-form ml-v2-task-editor-form">
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
                  {/* P36C.1I.1 - Project management controls. */}
                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                    <Input
                      aria-label="New project name"
                      placeholder="New project name"
                      maxLength={100}
                      value={newTaskProjectName}
                      onChange={(event) =>
                        setNewTaskProjectName(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void addTaskEditorProject();
                        }
                        if (event.key === "Escape") {
                          setNewTaskProjectName("");
                          setTaskProjectsManaging(false);
                        }
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="ml-v2-standard-button"
                        style={{ padding: "7px 11px" }}
                        disabled={busy || !newTaskProjectName.trim()}
                        onClick={() => void addTaskEditorProject()}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className="ml-v2-standard-button"
                        style={{ padding: "7px 11px" }}
                        aria-expanded={taskProjectsManaging}
                        onClick={() =>
                          setTaskProjectsManaging((value) => !value)
                        }
                      >
                        Manage Projects
                      </button>
                      <button
                        type="button"
                        className="ml-v2-standard-button"
                        style={{ padding: "7px 11px" }}
                        disabled={busy}
                        onClick={() => {
                          setNewTaskProjectName("");
                          setTaskProjectsManaging(false);
                          setTaskProjectRenameId("");
                          setTaskProjectRenameName("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>

                    {taskProjectsManaging && (
                      <div style={{ display: "grid", gap: 8 }}>
                        {projects.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ flex: "1 1 100px" }}>
                              {item.name}
                            </span>
                            <button
                              type="button"
                              className="ml-v2-standard-button"
                              disabled={busy}
                              onClick={() => {
                                setTaskProjectRenameId(item.id);
                                setTaskProjectRenameName(item.name);
                              }}
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              className="ml-v2-standard-button"
                              disabled={
                                busy ||
                                tasks.some(
                                  (task) => task.projectId === item.id
                                ) ||
                                sections.some(
                                  (section) => section.projectId === item.id
                                )
                              }
                              title={
                                tasks.some(
                                  (task) => task.projectId === item.id
                                ) ||
                                sections.some(
                                  (section) => section.projectId === item.id
                                )
                                  ? "Project contains tasks or sections"
                                  : "Delete empty project"
                              }
                              onClick={() =>
                                void deleteTaskEditorProject(item.id)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        ))}

                        {taskProjectRenameId && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <Input
                              aria-label="Rename project"
                              value={taskProjectRenameName}
                              onChange={(event) =>
                                setTaskProjectRenameName(event.target.value)
                              }
                            />
                            <button
                              type="button"
                              className="ml-v2-standard-button"
                              disabled={busy}
                              onClick={() =>
                                void renameTaskEditorProject()
                              }
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </label>
                {/* P36C.1H.1 - Classification management. */}
                <label>
                  Classification
                  <NativeSelect
                    value={draft.classification ?? "Task"}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        classification: event.target.value,
                      })
                    }
                  >
                    {classificationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </NativeSelect>

                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                    <Input
                      aria-label="New classification name"
                      placeholder="New classification name"
                      maxLength={100}
                      value={newClassificationName}
                      onChange={(event) =>
                        setNewClassificationName(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addClassification();
                        }
                        if (event.key === "Escape") {
                          setNewClassificationName("");
                          setClassificationsManaging(false);
                        }
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="ml-v2-standard-button"
                        style={{ padding: "7px 11px" }}
                        disabled={!newClassificationName.trim()}
                        onClick={addClassification}
                      >
                        Add
                      </button>

                      <button
                        type="button"
                        className="ml-v2-standard-button"
                        style={{ padding: "7px 11px" }}
                        aria-expanded={classificationsManaging}
                        onClick={() =>
                          setClassificationsManaging((value) => !value)
                        }
                      >
                        Manage Classifications
                      </button>

                      <button
                        type="button"
                        className="ml-v2-standard-button"
                        style={{ padding: "7px 11px" }}
                        onClick={() => {
                          setNewClassificationName("");
                          setClassificationsManaging(false);
                          setClassificationRenameOld("");
                          setClassificationRenameName("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>

                    {classificationsManaging && (
                      <div style={{ display: "grid", gap: 8 }}>
                        {classificationOptions.map((option) => (
                          <div
                            key={option}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ flex: "1 1 100px" }}>
                              {option}
                            </span>
                            <input
                              type="color"
                              aria-label={`Color for ${option}`}
                              title={`Change ${option} color`}
                              value={
                                classificationColors[option] ||
                                legacyClassificationColor(option)
                              }
                              onChange={(event) => {
                                const currentColors = {
                                  ...readClassificationColors(),
                                  ...classificationColors,
                                };
                                persistClassificationColors({
                                  ...currentColors,
                                  [option]: event.target.value,
                                });
                              }}
                              style={{
                                width: 34,
                                height: 30,
                                padding: 2,
                                border: "1px solid #ddd6f0",
                                borderRadius: 7,
                                background: "#ffffff",
                                cursor: "pointer",
                              }}
                            />

                            <button
                              type="button"
                              className="ml-v2-standard-button"
                              onClick={() => {
                                setClassificationRenameOld(option);
                                setClassificationRenameName(option);
                              }}
                            >
                              Rename
                            </button>

                            <button
                              type="button"
                              className="ml-v2-standard-button"
                              disabled={classificationOptions.length <= 1}
                              onClick={() => deleteClassification(option)}
                            >
                              Delete
                            </button>
                          </div>
                        ))}

                        {classificationRenameOld && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <Input
                              aria-label="Rename classification"
                              value={classificationRenameName}
                              onChange={(event) =>
                                setClassificationRenameName(event.target.value)
                              }
                            />

                            <button
                              type="button"
                              className="ml-v2-standard-button"
                              onClick={renameClassification}
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                  {/* P36C.1G.4 - Clean section controls. */}
                  <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                    <Input
                      aria-label="New section name"
                      placeholder="New section name"
                      maxLength={100}
                      value={taskSectionName}
                      onChange={(event) => setTaskSectionName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void createTaskSection();
                        }
                        if (event.key === "Escape") {
                          setTaskSectionName("");
                          setTaskSectionsManaging(false);
                        }
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="ml-v2-standard-button"
                        style={{ padding: "7px 11px" }}
                        disabled={busy || !taskSectionName.trim()}
                        onClick={() => void createTaskSection()}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className="ml-v2-standard-button"
                        style={{ padding: "7px 11px" }}
                        aria-expanded={taskSectionsManaging}
                        onClick={() =>
                          setTaskSectionsManaging((value) => !value)
                        }
                      >
                        Manage Sections
                      </button>
                      <button
                        type="button"
                        className="ml-v2-standard-button"
                        style={{ padding: "7px 11px" }}
                        disabled={busy}
                        onClick={() => {
                          setTaskSectionName("");
                          setTaskSectionsManaging(false);
                          setTaskSectionRenameId("");
                          setTaskSectionRenameName("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  {taskSectionsManaging && (
                    <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                      {sections
                        .filter((item) => item.projectId === draft.projectId)
                        .map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ flex: "1 1 100px" }}>
                              {item.name}
                            </span>
                            <button
                              type="button"
                              className="ml-v2-standard-button"
                              onClick={() => {
                                setTaskSectionRenameId(item.id);
                                setTaskSectionRenameName(item.name);
                              }}
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              className="ml-v2-standard-button"
                              disabled={busy}
                              onClick={() => void deleteTaskEditorSection(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      {taskSectionRenameId && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <Input
                            aria-label="Rename section"
                            value={taskSectionRenameName}
                            onChange={(event) =>
                              setTaskSectionRenameName(event.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="ml-v2-standard-button"
                            disabled={busy}
                            onClick={() => void renameTaskEditorSection()}
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  </div>
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
                    step={60}
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
                    step={60}
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
                    <option value="weeks">Weeks</option>
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
                          : draft.recurrenceUnit === "weeks"
                            ? "week(s)"
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
              <div className="attachments-editor">
                <strong>
                  Attachments / Screenshots{" "}
                  <small>{draft.attachments.length}/5</small>
                </strong>

                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  hidden
                  onChange={(e) => {
                    if (e.target.files) {
                      void addTaskAttachments(e.target.files);
                    }
                    e.target.value = "";
                  }}
                />

                <div
                  className="attachment-dropzone"
                  onClick={() => attachmentInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files.length) {
                      void addTaskAttachments(e.dataTransfer.files);
                    }
                  }}
                  onPaste={(e) => {
                    const images = Array.from(e.clipboardData.files).filter(
                      (file) => file.type.startsWith("image/"),
                    );

                    if (images.length) {
                      e.preventDefault();
                      void addTaskAttachments(images);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      attachmentInputRef.current?.click();
                    }
                  }}
                >
                  <Plus size={18} />
                  <span>
                    Add screenshot, drag an image here, or paste with Ctrl+V
                  </span>
                </div>

                {draft.attachments.length > 0 && (
                  <div className="attachment-grid">
                    {draft.attachments.map((attachment) => (
                      <div className="attachment-item" key={attachment.id}>
                        <img
                          src={attachment.data}
                          alt={attachment.name}
                          title={attachment.name}
                        />
                        <button
                          type="button"
                          className="attachment-remove"
                          title="Remove attachment"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              attachments: draft.attachments.filter(
                                (item) => item.id !== attachment.id,
                              ),
                            })
                          }
                        >
                          <X size={14} />
                        </button>
                        <span>{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
              {/* STEP 18F.23I.43I-P29 - Choose project from Master List. */}
              {!sections.some((section) => section.id === sectionDraft.id) &&
                !project && (
                  <label>
                    Project
                    <select
                      required
                      className="ml-v2-standard-button"
                      style={{
                        display: "block",
                        width: "100%",
                        minHeight: "40px",
                        textAlign: "left",
                      }}
                      value={sectionDraft.projectId}
                      onChange={(event) => {
                        const projectId = event.target.value;
                        setSectionDraft({
                          ...sectionDraft,
                          projectId,
                          sortOrder: sections.filter(
                            (section) => section.projectId === projectId,
                          ).length,
                        });
                      }}
                    >
                      <option value="">Select a project</option>
                      {projects.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
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
                  disabled={
                    busy ||
                    !sectionDraft.name.trim() ||
                    !projects.some(
                      (item) => item.id === sectionDraft.projectId,
                    )
                  }
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
            {orderedListColumnIds.map((columnId) => {
              const field =
                columnId === "task-name"
                  ? null
                  : projectFields.find(
                      (item) => `field:${item.id}` === columnId,
                    );

              if (columnId !== "task-name" && !field) return null;

              return (
                <button
                  key={columnId}
                  className="column-manager-row"
                  draggable={!!project && !busy}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData(
                      "text/plain",
                      `column:${columnId}`,
                    );
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const data =
                      e.dataTransfer.getData("text/plain");

                    if (data.startsWith("column:")) {
                      void moveListColumn(
                        data.slice(7),
                        columnId,
                      );
                    }
                  }}
                  onClick={() => {
                    if (field) editField(field);
                  }}
                  title={
                    field
                      ? `Drag to move or click to edit ${field.name}`
                      : "Drag to move Task name"
                  }
                >
                  <span>
                    <GripVertical size={16} />
                    <strong>
                      {columnId === "task-name"
                        ? "Task name"
                        : field?.name}
                    </strong>
                  </span>
                  <small>
                    {columnId === "task-name"
                      ? "Built-in"
                      : field?.type}
                    {field && <ChevronRight size={14} />}
                  </small>
                </button>
              );
            })}

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
      <Dialog
        open={calendarMoveChoice !== null}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setCalendarMoveChoice(null);
            setCalendarDragOccurrence(null);
          }
        }}
      >
        <DialogContent style={{ maxWidth: "480px" }}>
          <DialogTitle>Move recurring task</DialogTitle>
          <DialogDescription>
            This task repeats. What would you like to move?
          </DialogDescription>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "20px",
            }}
          >
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setCalendarMoveChoice(null);
                setCalendarDragOccurrence(null);
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void moveCalendarOccurrence()}
            >
              This occurrence
            </Button>

            <Button
              type="button"
              disabled={busy}
              onClick={() => void moveCalendarSeries()}
            >
              Entire series
            </Button>
          </div>
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









