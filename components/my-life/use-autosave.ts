"use client";

// STEP CM.7Q.7I.22Z.16N
// Reusable autosave with serialized writes and explicit close coordination.

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveState = "saved" | "unsaved" | "saving" | "error";

export type AutosaveOptions<T> = {
  save: (value: T) => Promise<void>;
  delay?: number;
};

export function useAutosave<T>({
  save,
  delay = 900,
}: AutosaveOptions<T>) {
  const [state, setState] = useState<AutosaveState>("saved");
  const [error, setError] = useState("");

  const saveRef = useRef(save);
  saveRef.current = save;

  const pendingRef = useRef<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef<Promise<boolean> | null>(null);
  const failedRef = useRef(false);
  const mountedRef = useRef(true);
  const generationRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hasPending = useCallback(() => {
    return pendingRef.current !== null || activeRef.current !== null;
  }, []);

  const flush = useCallback(async (): Promise<boolean> => {
    clearTimer();

    if (activeRef.current !== null) {
      const completed = await activeRef.current;
      if (!completed) return false;
    }

    if (pendingRef.current === null) {
      return !failedRef.current;
    }

    if (failedRef.current) {
      return false;
    }

    const run = async (): Promise<boolean> => {
      while (pendingRef.current !== null) {
        const value: T = pendingRef.current;
        const generation = generationRef.current;

        pendingRef.current = null;

        if (mountedRef.current) {
          setState("saving");
        }

        try {
          await saveRef.current(value);
        } catch (cause) {
          // Keep the newest complete snapshot if more edits arrived.
          if (pendingRef.current === null) {
            pendingRef.current = value;
          }

          failedRef.current = true;

          if (mountedRef.current) {
            setState("error");
            setError(
              cause instanceof Error
                ? cause.message
                : "Unable to save changes."
            );
          }

          return false;
        }

        if (mountedRef.current && generationRef.current !== generation) {
          setState("unsaved");
        }
      }

      if (mountedRef.current) {
        setState("saved");
        setError("");
      }

      return true;
    };

    const operation = run();
    activeRef.current = operation;

    try {
      return await operation;
    } finally {
      if (activeRef.current === operation) {
        activeRef.current = null;
      }
    }
  }, [clearTimer]);

  const schedule = useCallback(
    (value: T, immediate = false) => {
      pendingRef.current = value;
      generationRef.current += 1;
      failedRef.current = false;

      if (mountedRef.current) {
        setState("unsaved");
        setError("");
      }

      clearTimer();

      if (immediate) {
        void flush();
      } else {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          void flush();
        }, delay);
      }
    },
    [clearTimer, delay, flush]
  );

  const retry = useCallback(async (): Promise<boolean> => {
    failedRef.current = false;
    return flush();
  }, [flush]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, [clearTimer]);

  return {
    state,
    error,
    schedule,
    flush,
    retry,
    hasPending,
  };
}
