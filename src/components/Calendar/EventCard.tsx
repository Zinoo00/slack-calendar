"use client";

import React, { useState, useCallback } from "react";
import { format, differenceInMinutes, addDays } from "date-fns";
import { CalendarEvent } from "@/types/calendar.types";
import clsx from "clsx";
import { lightenColor } from "@/lib/utils";

interface EventCardProps {
  event: CalendarEvent;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => void;
  style?: React.CSSProperties;
  size?: "small" | "medium" | "large";
  showTime?: boolean;
  showAttendees?: boolean;
  className?: string;
}

const getEventColor = (color?: string): string => {
  const colorMap: Record<string, string> = {
    "#4285f4": "blue",
    "#34a853": "green",
    "#fbbc04": "yellow",
    "#ea4335": "red",
    "#9c27b0": "purple",
    "#ff9800": "orange",
    "#e91e63": "pink",
    "#009688": "teal",
  };

  return colorMap[color || "#4285f4"] || "blue";
};

const formatEventTime = (event: CalendarEvent): string => {
  if (event.allDay) {
    return "All day";
  }

  const duration = differenceInMinutes(event.endTime, event.startTime);
  const startTime = format(event.startTime, "h:mm a");

  if (duration < 60) {
    return `${startTime} (${duration}m)`;
  } else {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    const durationStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    return `${startTime} (${durationStr})`;
  }
};

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isSelected = false,
  onClick,
  onDragStart,
  onEventUpdate,
  style,
  size = "medium",
  showTime = true,
  showAttendees = false,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  // Base color from event (fallback blue)
  const baseColor = event.color || "#3b82f6";
  const pastelColor = lightenColor(baseColor, 0.65); // 65% lighter for pastel tone

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      setIsDragging(true);
      e.dataTransfer.setData("application/json", JSON.stringify(event));
      e.dataTransfer.effectAllowed = "move";
      onDragStart?.(e);
    },
    [event, onDragStart]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick?.(e);
    },
    [onClick]
  );

  const handleResizeStart = (e: React.MouseEvent, handle: "left" | "right") => {
    e.stopPropagation();

    const startX = e.clientX;
    const { startTime, endTime } = event;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const daysDelta = Math.round(dx / 40); // 40px per day, adjust as needed

      if (handle === "left") {
        const newStartTime = addDays(startTime, daysDelta);
        if (newStartTime < endTime) {
          onEventUpdate?.(event.id, { startTime: newStartTime });
        }
      } else {
        const newEndTime = addDays(endTime, daysDelta);
        if (newEndTime > startTime) {
          onEventUpdate?.(event.id, { endTime: newEndTime });
        }
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const sizeClasses = {
    small: "text-xs px-2 py-1",
    medium: "text-sm px-3 py-2",
    large: "text-base px-4 py-3",
  };

  return (
    <div
      className={clsx(
        "relative cursor-default transition-all duration-200 mb-1 rounded-lg mx-1 shadow",
        {
          "opacity-70 scale-95": isDragging,
          "ring-2 ring-white shadow-lg scale-105": isSelected,
        },
        className
      )}
      style={{
        backgroundColor: pastelColor,
        color: "#111827", // Tailwind gray-900 equivalent for readability
        padding:
          size === "small"
            ? "2px 6px"
            : size === "medium"
            ? "4px 8px"
            : "6px 12px",
      }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDoubleClick={handleDoubleClick}
      title={`${event.title}${
        event.description ? `\n${event.description}` : ""
      }`}
    >
      {/* Event content */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex-1 min-w-0">
          {/* Event title */}
          <div
            className={clsx("font-medium truncate", {
              "text-xs": size === "small",
              "text-sm": size === "medium",
              "text-base": size === "large",
            })}
          >
            {event.title}
          </div>

          {/* Event time - only show if requested and not all-day */}
          {showTime && size !== "small" && (
            <div className="text-xs opacity-90 mt-1">
              {formatEventTime(event)}
            </div>
          )}

          {/* Event location */}
          {event.metadata?.location && size === "large" && (
            <div className="text-xs opacity-80 mt-1 truncate">
              📍 {event.metadata.location}
            </div>
          )}
        </div>

        {/* Event indicators */}
        <div className="flex items-center space-x-1 ml-2">
          {/* Event indicators */}
          {event.isRecurring && (
            <span className="text-xs opacity-80" title="Recurring event">
              🔄
            </span>
          )}

          {event.externalSource && (
            <span
              className="text-xs opacity-80"
              title={`Synced from ${event.externalSource}`}
            >
              {event.externalSource === "outlook" && "📧"}
              {event.externalSource === "google" && "📅"}
              {event.externalSource === "slack" && "💬"}
            </span>
          )}

          {showAttendees && event.attendees.length > 0 && size !== "small" && (
            <span
              className="text-xs opacity-80"
              title={`${event.attendees.length} attendees`}
            >
              👥 {event.attendees.length}
            </span>
          )}
        </div>
      </div>

      {/* Attendees list (for large size) */}
      {showAttendees && size === "large" && event.attendees.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/20">
          <div className="text-xs opacity-90">
            {event.attendees
              .slice(0, 3)
              .map((attendee) => attendee.name)
              .join(", ")}
            {event.attendees.length > 3 &&
              ` +${event.attendees.length - 3} more`}
          </div>
        </div>
      )}

      {event.isResizable && event.allDay && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
            onMouseDown={(e) => handleResizeStart(e, "left")}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
            onMouseDown={(e) => handleResizeStart(e, "right")}
          />
        </>
      )}
    </div>
  );
};
