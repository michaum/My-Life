"use client";

import { MyLifeTimeGreeting } from "./time-greeting";
import { MyLifeGreetingClock } from "./greeting-clock";
import { MyLifeGreetingWeather } from "./greeting-weather";
import { MyLifeGreetingSettings } from "./greeting-settings";
import { SmartWallpaper } from "./smart-wallpaper";

import { useEffect, useState, type ReactNode } from "react";
import { initializeMyLifeTheme } from "./theme/theme-controller";
import { MyLifeSidebar, type MyLifeNavigationItem } from "./sidebar";
import {
  MyLifeTopBar,
  type GlobalSearchResult,
  type MyLifeNotification,
} from "./top-bar";
import {
  MyLifeSummaryTiles,
  type MyLifeSummaryTilesProps,
} from "./dashboard/summary-tiles";
import "./v2.css";

type MyLifeAppShellProps = {
  children: ReactNode;
  summaryTiles: MyLifeSummaryTilesProps;
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
  searchItems?: GlobalSearchResult[];
  notificationItems?: MyLifeNotification[];
  onSearchOpen?: (item: GlobalSearchResult) => void;
  onAccountClick?: () => void;
  onAddTask?: () => void;
  onPeopleClick?: () => void;
  onCreateProject?: () => void;
  onRenameProject?: (id: string) => void;
  onExport?: () => void;
  onAdminClick?: () => void;
  onHelpClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
};

export function MyLifeAppShell({
  children,
  summaryTiles,
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
  searchItems,
  notificationItems,
  onSearchOpen,
  onAccountClick,
  onAddTask,
  onPeopleClick,
  onCreateProject,
  onRenameProject,
  onExport,
  onAdminClick,
  onHelpClick,
  onSettingsClick,
  onLogout,
}: MyLifeAppShellProps) {
  useEffect(() => initializeMyLifeTheme(), []);
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
          onRenameProject={onRenameProject}
          onExport={onExport}
          onAdminClick={onAdminClick}
          onHelpClick={onHelpClick}
          onSettingsClick={() => { setMobileNavigationOpen(false); onSettingsClick?.(); }}
          onLogout={onLogout}
          onAccountClick={onAccountClick}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        <div className="ml-v2-workspace">
          <SmartWallpaper />
          <MyLifeTopBar
            title={title}
            subtitle={subtitle}
            userName={userName}
            onSearch={onSearch}
            searchItems={searchItems}
            notificationItems={notificationItems}
            onSearchOpen={onSearchOpen}
            onAccountClick={onAccountClick}
            onAddTask={onAddTask}
            onMenuClick={() => setMobileNavigationOpen(true)}
          />

          {/* STEP 18F.23I.31C.4C - UNIVERSAL V2 HEADER */}
          <section
            className="ml-v2-universal-header"
            aria-label="Current page"
          >
            <div className="ml-v2-dashboard-welcome" style={activeView === "home" ? { position: "relative" } : undefined}>
              <div>
                <span className="ml-v2-dashboard-eyebrow">
                  {activeView === "home"
                    ? "YOUR DAY AT A GLANCE"
                    : activeView === "notes"
                      ? "YOUR NOTES"
                      : "YOUR WORKSPACE"}
                </span>

                <h1>
                  {activeView === "home"
                    ? <MyLifeTimeGreeting userName={userName} />
                    : title}
                </h1>

                <time
                  className="ml-v2-dashboard-current-date"
                  dateTime={new Date().toLocaleDateString("en-CA")}
                  suppressHydrationWarning
                >
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {activeView === "home" ? <MyLifeGreetingClock /> : null}
                  {activeView === "home" ? <MyLifeGreetingWeather /> : null}
                </time>

                <p>
                  {activeView === "home"
                    ? "Here is what needs your attention and what is already moving forward."
                    : activeView === "notes"
                      ? "Capture ideas and keep everything organized."
                      : subtitle || "Keep everything organized and moving forward."}
                </p>
              </div>
              {activeView === "home" ? <MyLifeGreetingSettings /> : null}
            </div>
          </section>

          {/* STEP 18F.23I.31C.5G - UNIVERSAL SUMMARY TILES */}
          <div className="ml-v2-universal-summary">
            <MyLifeSummaryTiles {...summaryTiles} />
          </div>

          <main className="ml-v2-content">
            <div className="ml-v2-content-inner">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
