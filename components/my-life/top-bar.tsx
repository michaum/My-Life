"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell, Menu, Search, UserRound, X, CheckCheck, Inbox,
  CheckCircle2, Folder, Users, NotebookPen, Layers,
} from "lucide-react";

// STEP P36C.1N.1E - Live notification data.
export type MyLifeNotification = {
  id: string;
  taskId: string;
  title: string;
  detail: string;
  category: "overdue" | "today" | "appointment";
};

export type GlobalSearchResult = {
  id: string;
  type: "task" | "project" | "person" | "section" | "note";
  title: string;
  detail?: string;
  searchable?: string;
};

type MyLifeTopBarProps = {
  title: string;
  subtitle?: string;
  userName?: string;
  onSearch?: (value: string) => void;
  searchItems?: GlobalSearchResult[];
  notificationItems?: MyLifeNotification[];
  onSearchOpen?: (item: GlobalSearchResult) => void;
  onAccountClick?: () => void;
  onAddTask?: () => void;
  onMenuClick?: () => void;
};

const icons = {
  task: CheckCircle2,
  project: Folder,
  person: Users,
  section: Layers,
  note: NotebookPen,
};

export function MyLifeTopBar({
  title, subtitle, userName, onSearch, searchItems = [],
  onSearchOpen, onAccountClick, onAddTask, onMenuClick,
  notificationItems = [],
}: MyLifeTopBarProps) {
  const initial = userName?.trim().charAt(0).toUpperCase() || "M";
  const [term, setTerm] = useState("");
  const [visible, setVisible] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [notes, setNotes] = useState<GlobalSearchResult[]>([]);
  const [notesError, setNotesError] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  // STEP P36C.1N.1C - Notification Center foundation.
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationReadIds, setNotificationReadIds] =
    useState<string[]>([]);
  const [notificationStorageReady, setNotificationStorageReady] =
    useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        "my-life-v2-notification-read-ids"
      );
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        setNotificationReadIds(
          parsed.filter((id): id is string => typeof id === "string")
        );
      }
    } catch {
      // A corrupt local preference must not break notifications.
    }
    setNotificationStorageReady(true);
  }, []);

  useEffect(() => {
    if (!notificationStorageReady) return;
    try {
      localStorage.setItem(
        "my-life-v2-notification-read-ids",
        JSON.stringify(notificationReadIds.slice(-1000))
      );
    } catch {
      // Storage may be unavailable; keep the session working.
    }
  }, [notificationReadIds, notificationStorageReady]);
  const notificationButton = useRef<HTMLButtonElement>(null);
  const notificationPanel = useRef<HTMLDivElement>(null);
  const [notificationPosition, setNotificationPosition] = useState({
    top: 0,
    right: 8,
  });

  const unreadCount = notificationItems.filter(
    (item) => !notificationReadIds.includes(item.id)
  ).length;

  useLayoutEffect(() => {
    if (!notificationsOpen) return;

    function positionPanel() {
      const button = notificationButton.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();

      setNotificationPosition({
        top: rect.bottom + 10,
        right: Math.max(
          8,
          document.documentElement.clientWidth - rect.right
        ),
      });
    }

    positionPanel();

    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);

    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;

    function handleOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !notificationButton.current?.contains(target) &&
        !notificationPanel.current?.contains(target)
      ) {
        setNotificationsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [notificationsOpen]);

  const container = useRef<HTMLDivElement>(null);
  const dropdown = useRef<HTMLDivElement>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 420,
    maxHeight: 480,
  });

  // STEP P36C.1M.2H - Position results outside header stacking contexts.
  useEffect(() => {
    setPortalReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!visible || !term.trim()) return;

    let frame = 0;

    function updatePosition() {
      const field = container.current;
      if (!field) return;

      const rect = field.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight;

      const width = Math.min(420, viewportWidth - 16);
      const left = Math.max(
        8,
        Math.min(rect.right - width, viewportWidth - width - 8)
      );

      const top = rect.bottom + 8;

      setDropdownPosition({
        top,
        left,
        width,
        maxHeight: Math.max(
          100,
          Math.min(480, viewportHeight - top - 12)
        ),
      });
    }

    function schedulePosition() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updatePosition);
    }

    updatePosition();

    window.addEventListener("resize", schedulePosition);
    window.addEventListener("scroll", schedulePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedulePosition);
      window.removeEventListener("scroll", schedulePosition, true);
    };
  }, [visible, term]);

  useEffect(() => {
    function closeOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !container.current?.contains(target) &&
        !dropdown.current?.contains(target)
      ) {
        setVisible(false);
      }
    }
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  useEffect(() => {
    if (!visible || !term.trim()) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingNotes(true);
      setNotesError(false);
      try {
        const response = await fetch("/api/notes", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Notes unavailable");
        const data = await response.json() as {
          notes?: Array<{ id: string; title: string; content: string }>;
        };
        if (!controller.signal.aborted) {
          setNotes((data.notes ?? []).map((note) => ({
            id: note.id,
            type: "note" as const,
            title: note.title || "Untitled note",
            detail: "Note",
            searchable: `${note.title} ${note.content.replace(/<[^>]*>/g, " ")}`,
          })));
        }
      } catch {
        if (!controller.signal.aborted) {
          setNotesError(true);
          setNotes([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingNotes(false);
      }
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term, visible]);

  const matches = useMemo(() => {
    const q = term.trim().toLocaleLowerCase();
    if (!q) return [];
    const words = q.split(/\s+/);
    return [...searchItems, ...notes]
      .filter((item) => words.every((word) =>
        `${item.title} ${item.detail ?? ""} ${item.searchable ?? ""}`
          .toLocaleLowerCase().includes(word)
      ))
      .sort((a, b) => {
        const aStarts = a.title.toLocaleLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.title.toLocaleLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts || a.title.localeCompare(b.title);
      })
      .slice(0, 40);
  }, [searchItems, notes, term]);

  function openResult(item: GlobalSearchResult) {
    onSearchOpen?.(item);
    setTerm("");
    setVisible(false);
    setHighlight(0);
  }

  return (
    <header className="ml-v2-topbar">
      <div className="ml-v2-mobile-brand">
        <button type="button" className="ml-v2-icon-button ml-v2-mobile-menu"
          aria-label="Open navigation" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <strong>My Life</strong>
      </div>

      <div className="ml-v2-heading">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>

      <div className="ml-v2-topbar-actions">
        <div className="ml-v2-global-search" ref={container}>
          <label className="ml-v2-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search anything..."
              aria-label="Global search"
              aria-expanded={visible && !!term.trim()}
              aria-controls="ml-v2-global-search-results"
              autoComplete="off"
              value={term}
              onFocus={() => setVisible(true)}
              onChange={(event) => {
                setTerm(event.target.value);
                setHighlight(0);
                setVisible(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setVisible(false);
                } else if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setVisible(true);
                  setHighlight((n) => Math.min(n + 1, matches.length - 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setHighlight((n) => Math.max(n - 1, 0));
                } else if (event.key === "Enter" && matches.length) {
                  event.preventDefault();
                  openResult(matches[Math.max(0, highlight)]);
                }
              }}
            />
          </label>

          {portalReady && visible && !!term.trim() && createPortal(
            <div
              ref={dropdown}
              className="ml-v2-global-results ml-v2-global-results-portal"
              id="ml-v2-global-search-results"
              style={{
                position: "fixed",
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                maxHeight: dropdownPosition.maxHeight,
                zIndex: 2147483000,
                pointerEvents: "auto",
              }}
            >
              <div className="ml-v2-global-results-heading">
                Search results
                <span>{matches.length === 40 ? "40+" : matches.length}</span>
              </div>
              {matches.map((item, index) => {
                const Icon = icons[item.type];
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    className={`ml-v2-global-result${index === highlight ? " is-highlighted" : ""}`}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => openResult(item)}
                  >
                    <Icon size={17} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.detail || item.type}</small>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </button>
                );
              })}
              {!matches.length && (
                <p className="ml-v2-global-empty">
                  {loadingNotes ? "Searching notes..." : "No matching items found."}
                </p>
              )}
              {notesError && (
                <p className="ml-v2-global-notice">
                  Notes could not be searched right now.
                </p>
              )}
            </div>,
            document.body
          )}
        </div>

        <button
          ref={notificationButton}
          type="button"
          className="ml-v2-icon-button ml-v2-notification-trigger"
          aria-label="Notifications"
          aria-expanded={notificationsOpen}
          aria-controls="ml-v2-notification-panel"
          onClick={() => setNotificationsOpen((open) => !open)}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="ml-v2-notification-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {portalReady && notificationsOpen && createPortal(
          <div
            ref={notificationPanel}
            id="ml-v2-notification-panel"
            className="ml-v2-notification-panel"
            style={{
              position: "fixed",
              top: notificationPosition.top,
              right: notificationPosition.right,
              zIndex: 2147483001,
            }}
          >
            <div className="ml-v2-notification-heading">
              <div>
                <strong>Notifications</strong>
                <small>
                  {unreadCount
                    ? `${unreadCount} unread`
                    : "You're all caught up"}
                </small>
              </div>
              <button
                type="button"
                className="ml-v2-notification-close"
                aria-label="Close notifications"
                onClick={() => setNotificationsOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ml-v2-notification-toolbar">
              <span>All notifications</span>
              <button
                type="button"
                disabled={unreadCount === 0}
                onClick={() => setNotificationReadIds(
                  notificationItems.map((item) => item.id)
                )}
              >
                <CheckCheck size={15} />
                Mark all as read
              </button>
            </div>

            {notificationItems.length ? (
              <div className="ml-v2-notification-list">
                {notificationItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="ml-v2-notification-item"
                    onClick={() => setNotificationReadIds(
                      (current) => current.includes(item.id)
                        ? current
                        : [...current, item.id]
                    )}
                  >
                    <span className="ml-v2-notification-item-title">
                      {item.title}
                    </span>
                    <small>{item.detail}</small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="ml-v2-notification-empty">
                <Inbox size={34} />
                <strong>All caught up!</strong>
                <p>
                  Your task and appointment reminders
                  will appear here.
                </p>
              </div>
            )}
          </div>,
          document.body
        )}

        <button type="button" className="ml-v2-account-button"
          onClick={onAccountClick} aria-label="Open account">
          <span className="ml-v2-avatar">{initial}</span>
          <span className="ml-v2-account-copy">
            <strong>{userName || "My account"}</strong>
            <span>Account</span>
          </span>
          <UserRound className="ml-v2-account-icon" size={16} />
        </button>
      </div>
    </header>
  );
}
