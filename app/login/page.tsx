"use client";

import { FormEvent, useEffect, useState } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { getVersion } from "@tauri-apps/api/app";
import { initializeMyLifeTheme } from "@/components/my-life/theme/theme-controller";

async function setLoginWindowMode() {
  if (!("__TAURI_INTERNALS__" in window || "__TAURI__" in window)) return;

  const appWindow = getCurrentWindow();

  await appWindow.unmaximize();
  await appWindow.setDecorations(false);
  await appWindow.setResizable(false);
  await appWindow.setSize(new LogicalSize(420, 430));
  await appWindow.center();
}

async function setWorkspaceWindowMode() {
  if (!("__TAURI_INTERNALS__" in window || "__TAURI__" in window)) return;

  const appWindow = getCurrentWindow();

  await appWindow.setDecorations(true);
  await appWindow.setResizable(true);
  await appWindow.maximize();
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    const stopThemeSync = initializeMyLifeTheme();
    const previousHtmlBackground = document.documentElement.style.background;
    const previousBodyBackground = document.body.style.background;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyMargin = document.body.style.margin;

    document.documentElement.style.background = "transparent";
    document.documentElement.style.overflow = "hidden";

    document.body.style.background = "transparent";
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";

    void setLoginWindowMode();

    const isDesktop =
      "__TAURI_INTERNALS__" in window || "__TAURI__" in window;

    if (isDesktop) {
      void getVersion()
        .then((version) => setAppVersion(version))
        .catch((error) => console.error("Could not read app version:", error));
    }

    const savedEmail = localStorage.getItem("mylife-remember-email");
    const savedPassword = localStorage.getItem("mylife-remember-password");

    if (savedEmail !== null && savedPassword !== null) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }

    fetch("/api/auth/session", { credentials: "include" }).then((response) => {
      if (response.ok) {
        void setWorkspaceWindowMode().then(() => {
          window.location.href = "/";
        });
      }
    }).catch(() => { /* Sign-in remains available if session lookup fails. */ });

    return () => {
      stopThemeSync();
      document.documentElement.style.background = previousHtmlBackground;
      document.body.style.background = previousBodyBackground;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.margin = previousBodyMargin;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (response.ok) {
        if (rememberMe) {
          localStorage.setItem("mylife-remember-email", email);
          localStorage.setItem("mylife-remember-password", password);
        } else {
          localStorage.removeItem("mylife-remember-email");
          localStorage.removeItem("mylife-remember-password");
        }
      }

      if (!response.ok) {
        setError(data?.error ?? "Unable to sign in.");
        return;
      }

      await setWorkspaceWindowMode();
      window.location.href = "/";
    } catch {
      setError("Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        boxSizing: "border-box",
        display: "grid",
        placeItems: "center",
        padding: "0",
        background: "transparent",
      }}
    >
      <style>{`
        .ml-v2-login-form { background: var(--ml-color-surface); color: var(--ml-color-text); border: 1px solid var(--ml-color-border); box-shadow: 0 18px 55px rgba(10, 12, 26, .18); }
        .ml-v2-login-subtitle, .ml-v2-login-version { color: var(--ml-color-text-muted); }
        .ml-v2-login-input { background: var(--ml-field-bg); color: var(--ml-field-text); border: 1px solid var(--ml-field-border); }
        .ml-v2-login-input:focus-visible { outline: 2px solid #7656db; outline-offset: 2px; }
        .ml-v2-login-button { background: #7656db; color: #fff; }
        .ml-v2-login-button:focus-visible { outline: 2px solid var(--ml-color-focus); outline-offset: 3px; }
        [data-ml-theme="dark"] .ml-v2-login-form { background: #202436; border-color: #544b67; box-shadow: 0 18px 55px rgba(0, 0, 0, .35); }
        [data-ml-theme="dark"] .ml-v2-login-input { background: #292e46; border-color: #665778; color: #f2effb; }
      `}</style>
      <form
        className="ml-v2-login-form"
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: "420px",
          boxSizing: "border-box",
          padding: "32px",
          borderRadius: "20px",
          position: "relative",
        }}
      >
        <button
          type="button"
          aria-label="Close My Life"
          title="Close"
          onClick={() => {
            if ("__TAURI_INTERNALS__" in window || "__TAURI__" in window) {
              void getCurrentWindow().close();
            }
          }}
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            width: "34px",
            height: "34px",
            padding: 0,
            border: 0,
            borderRadius: "50%",
            background: "#7656db",
            color: "#ffffff",
            fontSize: "25px",
            fontWeight: 400,
            lineHeight: "32px",
            textAlign: "center",
            cursor: "pointer",
            zIndex: 100,
            boxShadow: "0 3px 10px rgba(0,0,0,0.22)",
          }}
        >
          ×
        </button>

        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ margin: 0, fontSize: "32px" }}>My Life</h1>
          <p className="ml-v2-login-subtitle" style={{ margin: "8px 0 0", fontWeight: 500 }}>
            Sign in to your shared workspace.
          </p>
        </div>

        <label style={{ display: "block", marginBottom: "18px" }}>
          <span style={{ display: "block", marginBottom: "7px" }}>
            Email
          </span>
          <input
            className="ml-v2-login-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              borderRadius: "10px",
              fontSize: "16px",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "18px" }}>
          <span style={{ display: "block", marginBottom: "7px" }}>
            Password
          </span>
          <input
            className="ml-v2-login-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              borderRadius: "10px",
              fontSize: "16px",
            }}
          />
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            margin: "-4px 0 18px",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{
              width: "17px",
              height: "17px",
              accentColor: "#7656db",
              cursor: "pointer",
            }}
          />
          Remember me
        </label>

        {error ? (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 12px",
              borderRadius: "10px",
              background: "#fff1f1",
              color: "#a40000",
            }}
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          className="ml-v2-login-button"
          disabled={busy}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: 0,
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: busy ? "wait" : "pointer",
            boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
          }}
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
        {appVersion && (
          <div
            className="ml-v2-login-version"
            style={{
              marginTop: "18px",
              textAlign: "center",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            My Life v{appVersion}
          </div>
        )}
      </form>
    </main>
  );
}
