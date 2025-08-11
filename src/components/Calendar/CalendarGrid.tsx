import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSaturday,
  isSunday,
  isSameDay,
  addDays,
  differenceInDays,
} from "date-fns";
import { useCalendarStore } from "@/stores/calendarStore";
import { CalendarEvent } from "@/types/calendar.types";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  onEventClick: (event: CalendarEvent) => void;
  onEventPopover: (
    event: CalendarEvent,
    position: { x: number; y: number }
  ) => void;
  onDateClick: (date: Date, position: { x: number; y: number }) => void;
  moveEvent: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
}

interface SelectedDay {
  date: Date;
  element: HTMLElement;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  onEventClick,
  onEventPopover,
  onDateClick,
  moveEvent,
  updateEvent,
}) => {
  const { viewDate, getFilteredEvents, currentView } = useCalendarStore();
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // macOS Calendar uses Sunday as first day of week in US locale
  const weekStartsOn = 0; // 0 = Sunday, 1 = Monday

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn });
  const endDate = endOfWeek(monthEnd, { weekStartsOn });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Auto-select today on initial load (must run after days is defined)
  useEffect(() => {
    if (!selectedDay) {
      const today = new Date();
      const todayElement = document.querySelector(
        `[data-date="${format(today, "yyyy-MM-dd")}"]`
      ) as HTMLElement | null;
      if (todayElement) {
        setSelectedDay({ date: today, element: todayElement });
      }
    }
  }, [days, selectedDay]);

  const events = getFilteredEvents();

  // Group events by date and handle multi-day events
  const eventsByDate = useMemo(() => {
    const grouped: { [key: string]: CalendarEvent[] } = {};
    const multiDayEvents: CalendarEvent[] = [];

    events.forEach((event) => {
      const startDateKey = format(event.startTime, "yyyy-MM-dd");
      const endDateKey = format(event.endTime, "yyyy-MM-dd");

      if (event.allDay || startDateKey !== endDateKey) {
        // Multi-day event
        multiDayEvents.push(event);

        // Add to each day it spans
        let currentDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);

        while (currentDate <= endDate) {
          const dateKey = format(currentDate, "yyyy-MM-dd");
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          if (!grouped[dateKey].some((e) => e.id === event.id)) {
            grouped[dateKey].push(event);
          }
          currentDate = addDays(currentDate, 1);
        }
      } else {
        // Single day event
        if (!grouped[startDateKey]) {
          grouped[startDateKey] = [];
        }
        grouped[startDateKey].push(event);
      }
    });

    return grouped;
  }, [events]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedDay) return;

      let newDate: Date | null = null;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          newDate = addDays(selectedDay.date, -1);
          break;
        case "ArrowRight":
          e.preventDefault();
          newDate = addDays(selectedDay.date, 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          newDate = addDays(selectedDay.date, -7);
          break;
        case "ArrowDown":
          e.preventDefault();
          newDate = addDays(selectedDay.date, 7);
          break;
        case " ": // Space bar - go to today
          e.preventDefault();
          newDate = new Date();
          break;
        case "Enter": // Enter - create event
          e.preventDefault();
          handleDayDoubleClick(selectedDay.date, selectedDay.element);
          return;
      }

      if (newDate) {
        // Find the corresponding day element
        const dayElement = document.querySelector(
          `[data-date="${format(newDate, "yyyy-MM-dd")}"]`
        ) as HTMLElement;
        if (dayElement) {
          setSelectedDay({ date: newDate, element: dayElement });
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [selectedDay]);

  const handleDayClick = useCallback((day: Date, element: HTMLElement) => {
    setSelectedDay({ date: day, element });
  }, []);

  const handleDayDoubleClick = useCallback(
    (day: Date, element: HTMLElement) => {
      // Double-click creates new event - macOS behavior
      const rect = element.getBoundingClientRect();
      onDateClick(day, {
        x: rect.right,
        y: rect.top + rect.height / 2,
      });
    },
    [onDateClick]
  );

  const handleEventClick = useCallback(
    (e: React.MouseEvent, event: CalendarEvent) => {
      e.stopPropagation();
      onEventClick(event);
    },
    [onEventClick]
  );

  const handleEventDoubleClick = useCallback(
    (e: React.MouseEvent, event: CalendarEvent) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      onEventPopover(event, {
        x: rect.right,
        y: rect.top + rect.height / 2,
      });
    },
    [onEventPopover]
  );

  const getEventStyle = useCallback(
    (event: CalendarEvent, isMultiDay: boolean) => {
      return {
        backgroundColor: event.color || "#007AFF",
        color: "white",
        borderRadius: isMultiDay ? "2px" : "3px",
        fontSize: "11px",
        fontWeight: "500",
        padding: isMultiDay ? "1px 4px" : "2px 4px",
        margin: "1px 0",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap" as const,
        cursor: "pointer",
        border: "none",
        boxShadow: "none",
      };
    },
    []
  );

  // Get current time position for today indicator
  const getCurrentTimePosition = useCallback(() => {
    if (currentView !== "month") {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      return ((hours * 60 + minutes) / (24 * 60)) * 100; // percentage from top
    }
    return null;
  }, [currentView]);

  return (
    <div className="flex flex-col h-full bg-white" ref={gridRef}>
      {/* Day Headers - macOS style */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
          <div
            key={day}
            className={cn(
              "py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-100 last:border-r-0",
              (index === 0 || index === 6) && "text-gray-400" // Weekend styling
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - macOS style with minimal borders */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate[dateKey] || [];
          const isWeekend = isSaturday(day) || isSunday(day);
          const isCurrentMonth = isSameMonth(day, viewDate);
          const isTodayCell = isToday(day);
          const isSelected = selectedDay && isSameDay(selectedDay.date, day);

          return (
            <div
              key={day.toString()}
              data-date={dateKey}
              className={cn(
                "relative border-r border-b border-gray-100 last:border-r-0 p-1 cursor-pointer transition-colors",
                "hover:bg-gray-50",
                !isCurrentMonth && "bg-gray-50/50",
                isSelected && "bg-blue-50 ring-1 ring-blue-200",
                isTodayCell && !isSelected && "bg-yellow-50"
              )}
              onClick={(e) => handleDayClick(day, e.currentTarget)}
              onDoubleClick={(e) => handleDayDoubleClick(day, e.currentTarget)}
              style={{ minHeight: "80px" }}
            >
              {/* Date Number - macOS style */}
              <div
                className={cn(
                  "text-sm w-6 h-6 flex items-center justify-center rounded-full text-center mb-1",
                  isTodayCell && "bg-red-500 text-white font-semibold",
                  !isTodayCell && isCurrentMonth && "text-gray-900",
                  !isTodayCell && !isCurrentMonth && "text-gray-400",
                  !isTodayCell && isWeekend && isCurrentMonth && "text-gray-600"
                )}
              >
                {format(day, "d")}
              </div>

              {/* Current time indicator - red line for today */}
              {isTodayCell && currentView === "month" && (
                <div
                  className="absolute left-1 right-1 h-px bg-red-500 z-10"
                  style={{
                    top: `${20 + (getCurrentTimePosition() || 0) * 0.6}px`, // Approximate position
                  }}
                >
                  <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
                </div>
              )}

              {/* Events - macOS style simple bars */}
              <div className="space-y-px overflow-hidden">
                {dayEvents.slice(0, 4).map((event) => {
                  const isMultiDay =
                    event.allDay ||
                    format(event.startTime, "yyyy-MM-dd") !==
                      format(event.endTime, "yyyy-MM-dd");

                  return (
                    <div
                      key={`${event.id}-${dateKey}`}
                      className="text-xs leading-tight truncate select-none"
                      style={getEventStyle(event, isMultiDay)}
                      onClick={(e) => handleEventClick(e, event)}
                      onDoubleClick={(e) => handleEventDoubleClick(e, event)}
                    >
                      {event.allDay && (
                        <span className="text-[10px] opacity-75 mr-1">•</span>
                      )}
                      {event.title}
                    </div>
                  );
                })}

                {/* Show more indicator */}
                {dayEvents.length > 4 && (
                  <div
                    className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      onDateClick(day, {
                        x: rect.right,
                        y: rect.top + rect.height / 2,
                      });
                    }}
                  >
                    +{dayEvents.length - 4} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
