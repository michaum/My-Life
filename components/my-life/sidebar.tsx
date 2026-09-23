"use client";

import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CheckSquare2,
  ChevronLeft,
  CircleHelp,
  Download,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";

export type MyLifeNavigationItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
  section?: "workspace" | "projects";
  color?: string;
  textColor?: string;
};

type MyLifeSidebarProps = {
  activeView: string;
  navigation: MyLifeNavigationItem[];
  userName?: string;
  userRole?: string;
  appVersion?: string;
  isDevelopment?: boolean;
  exportDisabled?: boolean;
  onNavigate: (id: string) => void;
  onPeopleClick?: () => void;
  onCreateProject?: () => void;
  onExport?: () => void;
  onAdminClick?: () => void;
  onHelpClick?: () => void;
  onLogout?: () => void;
  onAccountClick?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

const defaultIcons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  tasks: CheckSquare2,
  calendar: CalendarDays,
};

function NavigationButton({
  item,
  selected,
  onClick,
}: {
  item: MyLifeNavigationItem;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon =
    item.icon ??
    defaultIcons[item.id] ??
    CheckSquare2;

  return (
    <button
      type="button"
      className={`ml-v2-nav-item${selected ? " is-active" : ""}`}
      onClick={onClick}
      aria-current={selected ? "page" : undefined}
      title={item.label}
    >
      <span
        className="ml-v2-nav-icon"
        style={item.color ? { color: item.color } : undefined}
      >
        <Icon size={18} strokeWidth={2} />
      </span>

      <span
        className="ml-v2-nav-text"
        style={item.textColor ? { color: item.textColor } : undefined}
      >
        {item.label}
      </span>

      {item.badge !== undefined ? (
        <span className="ml-v2-nav-badge">{item.badge}</span>
      ) : null}
    </button>
  );
}

export function MyLifeSidebar({
  activeView,
  navigation,
  userName,
  userRole,
  appVersion,
  isDevelopment = false,
  exportDisabled = false,
  onNavigate,
  onPeopleClick,
  onCreateProject,
  onExport,
  onAdminClick,
  onHelpClick,
  onLogout,
  onAccountClick,
  collapsed = false,
  onCollapsedChange,
  mobileOpen = false,
  onMobileClose,
}: MyLifeSidebarProps) {
  const initial =
    userName?.trim().charAt(0).toUpperCase() || "M";

  const workspaceItems =
    navigation.filter(
      (item) => item.section !== "projects",
    );

  const projectItems =
    navigation.filter(
      (item) => item.section === "projects",
    );

  return (
    <aside
      className={`ml-v2-sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""}`}
      data-collapsed={collapsed ? "true" : "false"}
      data-mobile-open={mobileOpen ? "true" : "false"}
    >
      {isDevelopment ? (
        <div className="ml-v2-sidebar-dev-banner" role="status">
          <strong>DEV V2</strong>
          <span>Development</span>
        </div>
      ) : null}

      <button
        type="button"
        className="ml-v2-mobile-close"
        aria-label="Close navigation"
        title="Close navigation"
        onClick={onMobileClose}
      >
        <span aria-hidden="true">?</span>
      </button>

      <div className="ml-v2-brand">
        <div className="ml-v2-brand-mark">
          <Sparkles size={20} strokeWidth={2.2} />
        </div>

        <div className="ml-v2-brand-copy">
          <strong>My Life</strong>
          <span>
            {appVersion
              ? `Everything in one place - v${appVersion}`
              : "Everything in one place"}
          </span>
        </div>
      </div>

      <nav
        className="ml-v2-navigation"
        aria-label="Main navigation"
      >
        <div className="ml-v2-nav-label">Workspace</div>

        {workspaceItems.map((item) => (
          <NavigationButton
            key={item.id}
            item={item}
            selected={activeView === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}

        {onPeopleClick ? (
          <button
            type="button"
            className="ml-v2-nav-item"
            onClick={onPeopleClick}
            title="People"
          >
            <span className="ml-v2-nav-icon">
              <Users size={18} strokeWidth={2} />
            </span>
            <span className="ml-v2-nav-text">
              People
            </span>
          </button>
        ) : null}
      </nav>

      <div className="ml-v2-project-heading">
        <span className="ml-v2-nav-label">
          Projects
        </span>

        {onCreateProject ? (
          <button
            type="button"
            className="ml-v2-project-add"
            aria-label="Create project"
            title="Create project"
            onClick={onCreateProject}
          >
            <Plus size={16} />
          </button>
        ) : null}
      </div>

      <nav
        className="ml-v2-navigation ml-v2-project-navigation"
        aria-label="Projects"
      >
        {projectItems.map((item) => (
          <NavigationButton
            key={item.id}
            item={item}
            selected={activeView === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}

        {onCreateProject ? (
          <button
            type="button"
            className="ml-v2-nav-item ml-v2-create-project"
            onClick={onCreateProject}
            title="Create a project"
          >
            <span className="ml-v2-nav-icon">
              <Plus size={17} />
            </span>
            <span className="ml-v2-nav-text">
              Create a project
            </span>
          </button>
        ) : null}
      </nav>

      <div className="ml-v2-sidebar-spacer" />

      <div className="ml-v2-sidebar-tools">
        {onExport ? (
          <button
            type="button"
            className="ml-v2-nav-item"
            onClick={onExport}
            disabled={exportDisabled}
          >
            <span className="ml-v2-nav-icon">
              <Download size={17} />
            </span>
            <span className="ml-v2-nav-text">
              Export workspace
            </span>
          </button>
        ) : null}

        {userRole === "admin" && onAdminClick ? (
          <button
            type="button"
            className="ml-v2-nav-item"
            onClick={onAdminClick}
            title="Admin Panel"
          >
            <span className="ml-v2-nav-icon">
              <Settings2 size={17} />
            </span>
            <span className="ml-v2-nav-text">
              Admin Panel
            </span>
          </button>
        ) : null}

        {onHelpClick ? (
          <button
            type="button"
            className="ml-v2-nav-item"
            onClick={onHelpClick}
            title="Help & getting started"
          >
            <span className="ml-v2-nav-icon">
              <CircleHelp size={17} />
            </span>
            <span className="ml-v2-nav-text">
              Help & getting started
            </span>
          </button>
        ) : null}

        {onLogout ? (
          <button
            type="button"
            className="ml-v2-nav-item"
            onClick={onLogout}
            title="Log out"
          >
            <span className="ml-v2-nav-icon">
              <LogOut size={17} />
            </span>
            <span className="ml-v2-nav-text">
              Log out
            </span>
          </button>
        ) : null}
      </div>

      <button
        type="button"
        className="ml-v2-profile"
        onClick={onAccountClick}
        aria-label="Open account"
        title={userName ? `${userName} account` : "Open account"}
      >
        <span className="ml-v2-profile-avatar">
          {initial}
        </span>

        <span className="ml-v2-profile-copy">
          <strong>{userName || "User"}</strong>
          <span>
            {userRole === "admin"
              ? "Administrator"
              : "Your personal space"}
          </span>
        </span>

        <span
          className="ml-v2-profile-online"
          aria-label="Online"
        />
      </button>

      <button
        type="button"
        className="ml-v2-collapse-button"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        onClick={() => onCollapsedChange?.(!collapsed)}
      >
        <ChevronLeft
          className="ml-v2-collapse-icon"
          size={17}
        />
        <span>{collapsed ? "Expand" : "Collapse"}</span>
      </button>
    </aside>
  );
}
