"use client";

import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" }).then((response) => {
      if (response.ok) {
        window.location.href = "/";
      }
    });
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

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "Unable to sign in.");
        return;
      }

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
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "32px",
          borderRadius: "20px",
          background: "white",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ margin: 0, fontSize: "32px" }}>My Life</h1>
          <p style={{ margin: "8px 0 0", opacity: 0.7 }}>
            Sign in to your shared workspace.
          </p>
        </div>

        <label style={{ display: "block", marginBottom: "18px" }}>
          <span style={{ display: "block", marginBottom: "7px" }}>
            Email
          </span>
          <input
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
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "18px" }}>
          <span style={{ display: "block", marginBottom: "7px" }}>
            Password
          </span>
          <input
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
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />
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
          disabled={busy}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: 0,
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
