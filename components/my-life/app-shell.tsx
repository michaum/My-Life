"use client";

import { useState, type ReactNode } from "react";
import { MyLifeSidebar, type MyLifeNavigationItem } from "./sidebar";
import { MyLifeTopBar } from "./top-bar";
import "./v2.css";

type MyLifeAppShellProps = {
  children: ReactNode;
  activeView: string;
  navigation: MyLifeNavigationItem[];
  title: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  appVersion?: string;
  isDevelopment?: boolean;
  exportDisabled?: boolean;
  onNavigate: (id: string) => void;
  onSearch?: (value: string) => void;
  onAccountClick?: () => void;
  onAddTask?: () => void;
  onPeopleClick?: () => void;
  onCreateProject?: () => void;
  onExport?: () => void;
  onAdminClick?: () => void;
  onHelpClick?: () => void;
  onLogout?: () => void;
};

export function MyLifeAppShell({
  children,
  activeView,
  navigation,
  title,
  subtitle,
  userName,
  userRole,
  appVersion,
  isDevelopment,
  exportDisabled,
  onNavigate,
  onSearch,
  onAccountClick,
  onAddTask,
  onPeopleClick,
  onCreateProject,
  onExport,
  onAdminClick,
  onHelpClick,
  onLogout,
}: MyLifeAppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setMobileNavigationOpen(false);
  };

  return (
    <div className={`ml-v2${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}>
      <div
        className={`ml-v2-shell${mobileNavigationOpen ? " is-mobile-nav-open" : ""}`}
      >
        {mobileNavigationOpen ? (
          <button
            type="button"
            className="ml-v2-mobile-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobileNavigationOpen(false)}
          />
        ) : null}

        <MyLifeSidebar
          activeView={activeView}
          navigation={navigation}
          userName={userName}
          userRole={userRole}
          appVersion={appVersion}
          isDevelopment={isDevelopment}
          exportDisabled={exportDisabled}
          onNavigate={handleNavigate}
          mobileOpen={mobileNavigationOpen}
          onMobileClose={() => setMobileNavigationOpen(false)}
          onPeopleClick={onPeopleClick}
          onCreateProject={onCreateProject}
          onExport={onExport}
          onAdminClick={onAdminClick}
          onHelpClick={onHelpClick}
          onLogout={onLogout}
          onAccountClick={onAccountClick}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        <div className="ml-v2-workspace">
          <MyLifeTopBar
            title={title}
            subtitle={subtitle}
            userName={userName}
            onSearch={onSearch}
            onAccountClick={onAccountClick}
            onAddTask={onAddTask}
            onMenuClick={() => setMobileNavigationOpen(true)}
          />

          <main className="ml-v2-content">
            <div className="ml-v2-content-inner">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
