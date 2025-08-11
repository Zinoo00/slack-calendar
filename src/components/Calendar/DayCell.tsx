"use client";

import React, { useState, useCallback } from "react";
import { format } from "date-fns";
import { CalendarEvent } from "@/types/calendar.types";
import { EventCard } from "./EventCard";
import clsx from "clsx";

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
  onEventClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
  onEventDrop?: (event: CalendarEvent, newDate: Date) => void;
  selectedEventId?: string | null;
  children?: React.ReactNode;
}

export const DayCell: React.FC<DayCellProps> = ({
  date,
  isCurrentMonth,
  isSelected,
  isToday,
  onClick,
  onEventClick,
  onEventDrop,
  selectedEventId,
  children,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dayNumber = format(date, "d");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      try {
        const eventData = JSON.parse(
          e.dataTransfer.getData("application/json")
        ) as CalendarEvent;
        onEventDrop?.(eventData, date);
      } catch (error) {
        console.error("Error handling drop:", error);
      }
    },
    [date, onEventDrop]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Quick event creation on double-click
      console.log("Quick create event on:", date);
    },
    [date]
  );

  return (
    <div
      className={clsx(
        "min-h-[120px] p-2 cursor-default transition-all duration-200 group border-r border-b border-gray-200",
        {
          "bg-gray-50/30 text-gray-400": !isCurrentMonth,
          "bg-blue-50": isToday,
          "bg-blue-100": isSelected,
          "bg-blue-100 border-2 border-dashed border-blue-300": isDragOver,
        }
      )}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1">
        <div
          className={clsx("flex items-center justify-center", {
            "w-6 h-6 rounded-full bg-blue-500 text-white font-bold": isToday,
          })}
        >
          <span
            className={clsx("text-sm", {
              "text-gray-400": !isCurrentMonth,
              "text-gray-900 font-medium": isCurrentMonth && !isToday,
              "text-white font-bold": isToday,
            })}
          >
            {dayNumber}
          </span>
        </div>

        {/* Quick add button (visible on hover) */}
        <button
          className={clsx(
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "w-4 h-4 text-xs rounded-full bg-blue-500 text-white flex items-center justify-center"
          )}
          onClick={(e) => {
            e.stopPropagation();
            console.log("Quick add event on:", date);
          }}
        >
          +
        </button>
      </div>

      {/* Events */}
      <div className="space-y-1">{children}</div>

      {/* Loading state */}
      {isDragOver && (
        <div className="flex items-center justify-center h-8 text-xs text-gray-400">
          Drop event here
        </div>
      )}
    </div>
  );
};
