"use client";

import { useEffect, useState } from "react";

/* STEP 18F.23I.31C.6L - LOCAL TIME GREETING */

function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function MyLifeTimeGreeting({
  userName,
}: {
  userName?: string | null;
}) {
  // Stable initial text avoids server/client hydration mismatch.
  const [greeting, setGreeting] = useState("Good Day");

  useEffect(() => {
    const update = () => {
      setGreeting(greetingForHour(new Date().getHours()));
    };

    update();

    // Refresh automatically, including after waking the computer.
    const interval = window.setInterval(update, 30_000);

    const onVisible = () => {
      if (document.visibilityState === "visible") update();
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <>
      {greeting}
      {userName ? `, ${userName}` : ""}.
    </>
  );
}
