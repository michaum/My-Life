"use client";

// CM.7Q.7I.11 - Portal escapes Board/List overflow clipping.
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export type HoverCardPerson = {
  id: string;
  name: string;
  phone?: string;
  avatarData?: string | null;
};

type Props = {
  person: HoverCardPerson;
  children: ReactNode;
  onEdit?: (person: HoverCardPerson) => void;
  onView?: (person: HoverCardPerson) => void;
};

export function PeopleProfileHoverCard({
  person,
  children,
  onEdit,
  onView,
}: Props) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  const initials = person.name
    .trim()
    .split(/\\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const popupWidth = popupRef.current?.offsetWidth ?? 290;
      const popupHeight = popupRef.current?.offsetHeight ?? 145;
      const margin = 8;

      const left = Math.max(
        margin,
        Math.min(rect.left, window.innerWidth - popupWidth - margin),
      );

      const above = rect.top - popupHeight - margin;
      const below = rect.bottom + margin;
      const top =
        above >= margin
          ? above
          : below + popupHeight <= window.innerHeight - margin
            ? below
            : Math.max(
                margin,
                Math.min(below, window.innerHeight - popupHeight - margin),
              );

      setPosition({ left, top });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const showCard = () => {
    cancelClose();
    setOpen(true);
  };

  return (
    <span
      ref={triggerRef}
      className="ml-person-hover-wrapper"
      onMouseEnter={showCard}
      onMouseLeave={scheduleClose}
      onFocus={showCard}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          scheduleClose();
        }
      }}
    >
      {children}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popupRef}
            className="ml-person-hover-card ml-person-hover-card--portal"
            role="group"
            aria-label={`${person.name} profile`}
            style={{ left: position.left, top: position.top }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            onFocus={cancelClose}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                scheduleClose();
              }
            }}
          >
            <span className="ml-person-hover-header">
              <span className="ml-person-hover-avatar">
                {person.avatarData ? (
                  <img src={person.avatarData} alt="" />
                ) : (
                  initials || "?"
                )}
              </span>
              <span className="ml-person-hover-details">
                <strong>{person.name}</strong>
                {person.phone && <small>{person.phone}</small>}
              </span>
            </span>
            <span className="ml-person-hover-actions">
              <button
                type="button"
                disabled={!onEdit}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpen(false);
                  onEdit?.(person);
                }}
              >
                Edit profile
              </button>
              <button
                type="button"
                disabled={!onView}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpen(false);
                  onView?.(person);
                }}
              >
                View profile
              </button>
            </span>
          </div>,
          document.body,
        )}
    </span>
  );
}
