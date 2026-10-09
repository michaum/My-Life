"use client";

import { useEffect, useState } from "react";

export function TaskCompletionCelebration({
  trigger,
}: {
  trigger: number;
}) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (!trigger) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    setActive(trigger);

    const timeout = window.setTimeout(() => {
      setActive((current) => current === trigger ? null : current);
    }, 3400);

    return () => window.clearTimeout(timeout);
  }, [trigger]);

  if (active === null) return null;

  return (
    <div
      key={active}
      className="ml-v2-unicorn-celebration"
      aria-hidden="true"
    >
      <div className="ml-v2-unicorn-flight">
        <div className="ml-v2-unicorn-rainbow">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="ml-v2-unicorn-sparkles">
          <i>✦</i>
          <i>✧</i>
          <i>✦</i>
          <i>★</i>
          <i>✧</i>
        </div>
        <div className="ml-v2-unicorn-character">
          <span>🦄</span>
        </div>
      </div>
    </div>
  );
}
