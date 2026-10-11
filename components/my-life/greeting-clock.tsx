"use client";

import { useEffect, useState } from "react";

const TIME_FORMAT_KEY = "my-life-greeting-time-format";
const TIME_FORMAT_EVENT = "my-life-greeting-time-format-change";
type TimeFormat = "12" | "24";

/* CM.7Q.7I.21D.2B - Display one selected time format */
export function MyLifeGreetingClock() {
  const [time, setTime] = useState<string | null>(null);
  const [format, setFormat] = useState<TimeFormat>("12");

  useEffect(() => {
    const loadFormat = () => {
      try {
        const saved = window.localStorage.getItem(TIME_FORMAT_KEY);
        setFormat(saved === "24" ? "24" : "12");
      } catch {
        setFormat("12");
      }
    };

    loadFormat();
    window.addEventListener(TIME_FORMAT_EVENT, loadFormat);
    window.addEventListener("storage", loadFormat);

    return () => {
      window.removeEventListener(TIME_FORMAT_EVENT, loadFormat);
      window.removeEventListener("storage", loadFormat);
    };
  }, []);

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: format === "12",
        }),
      );
    };

    update();
    const interval = window.setInterval(update, 30_000);

    const onVisible = () => {
      if (document.visibilityState === "visible") update();
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [format]);

  return (
    <span className="ml-v2-greeting-clock">
      {time ? ` · ${time}` : ""}
    </span>
  );
}
