import React from "react";
import { useCalendarStore } from "@/stores/calendarStore";
import {
  CalendarEvent,
  CalendarView as CalendarViewType,
} from "@/types/calendar.types";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarGrid } from "./CalendarGrid";
import { Skeleton } from "../ui/skeleton";

interface CalendarViewProps {
  onEventClick: (event: CalendarEvent) => void;
  onEventPopover: (
    event: CalendarEvent,
    position: { x: number; y: number }
  ) => void;
  onCreateEvent: (date: Date, position: { x: number; y: number }) => void;
  onNewEvent?: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  onEventClick,
  onEventPopover,
  onCreateEvent,
  onNewEvent,
}) => {
  const {
    currentView,
    isLoading,
    error,
    setView,
    navigateNext,
    navigatePrevious,
    goToToday,
    viewDate,
    moveEvent,
    updateEvent,
  } = useCalendarStore();

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-4 rounded-lg shadow-md bg-white text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white text-gray-900">
      <CalendarHeader
        currentView={currentView}
        onViewChange={setView}
        onNext={navigateNext}
        onPrev={navigatePrevious}
        onToday={goToToday}
        viewDate={viewDate}
        onNewEvent={onNewEvent}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex flex-col flex-grow">
            {/* Day Headers Skeleton */}
            <div className="grid grid-cols-7 border-b bg-muted/50">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="py-3 text-center border-r border-border last:border-r-0"
                >
                  <Skeleton className="h-4 w-8 mx-auto" />
                </div>
              ))}
            </div>

            {/* Calendar Grid Skeleton */}
            <div className="grid grid-cols-7 grid-rows-6 flex-grow border-l border-t">
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="border-r border-b p-2 min-h-[120px]">
                  <Skeleton className="h-4 w-6 mb-2" />
                  <div className="space-y-1">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <CalendarGrid
            onEventClick={onEventClick}
            onEventPopover={onEventPopover}
            onDateClick={onCreateEvent}
            moveEvent={moveEvent}
            updateEvent={updateEvent}
          />
        )}
      </main>
    </div>
  );
};

export default CalendarView;
