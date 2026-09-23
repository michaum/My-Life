"use client";

import {
  Bell,
  Menu,
  Plus,
  Search,
  UserRound,
} from "lucide-react";

type MyLifeTopBarProps = {
  title: string;
  subtitle?: string;
  userName?: string;
  onSearch?: (value: string) => void;
  onAccountClick?: () => void;
  onAddTask?: () => void;
  onMenuClick?: () => void;
};

export function MyLifeTopBar({
  title,
  subtitle,
  userName,
  onSearch,
  onAccountClick,
  onAddTask,
  onMenuClick,
}: MyLifeTopBarProps) {
  const initial = userName?.trim().charAt(0).toUpperCase() || "M";

  return (
    <header className="ml-v2-topbar">
      <div className="ml-v2-mobile-brand">
        <button
          type="button"
          className="ml-v2-icon-button ml-v2-mobile-menu"
          aria-label="Open navigation"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>

        <strong>My Life</strong>
      </div>

      <div className="ml-v2-heading">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>

      <div className="ml-v2-topbar-actions">
        <label className="ml-v2-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search anything..."
            aria-label="Search"
            onChange={(event) => onSearch?.(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="ml-v2-icon-button"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <button
          type="button"
          className="ml-v2-add-button"
          onClick={onAddTask}
        >
          <Plus size={18} />
          <span>New task</span>
        </button>

        <button
          type="button"
          className="ml-v2-account-button"
          onClick={onAccountClick}
          aria-label="Open account"
        >
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
