"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarHeader,
  CalendarView,
  EventPopover,
} from "@/components/Calendar";

// Placeholder for future timeline view - render nothing for now
const TimelineView = ({
  className,
  onEventClick,
}: {
  className?: string;
  onEventClick: (e: any) => void;
}) => null;
import { useCalendarStore } from "@/stores/calendarStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import {
  CalendarEvent,
  CalendarView as CalendarViewType,
} from "@/types/calendar.types";

export default function CalendarPage() {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [popoverDate, setPopoverDate] = useState<Date>(new Date());
  const [popoverEvent, setPopoverEvent] = useState<CalendarEvent | undefined>();
  const { currentView, isLoading, error, setView } = useCalendarStore();

  const {
    currentWorkspace,
    initializeWorkspace,
    isLoading: workspaceLoading,
  } = useWorkspaceStore();

  // Initialize workspace on mount
  useEffect(() => {
    initializeWorkspace();
  }, [initializeWorkspace]);

  // Sample data for demonstration
  useEffect(() => {
    // TODO: Load real data from API
    const sampleEvents: CalendarEvent[] = [
      {
        id: "1",
        title: "5",
        description: "Daily standup meeting",
        startTime: new Date(2025, 7, 5, 9, 0),
        endTime: new Date(2025, 7, 5, 9, 30),
        workspaceId: "demo-workspace",
        createdBy: "user-1",
        attendees: [],
        color: "#bfdbfe",
        lastModified: Date.now(),
        lastModifiedBy: "user-1",
        type: "event",
      },
    ];

    // Simulate API delay
    setTimeout(() => {
      useCalendarStore.getState().setEvents(sampleEvents);
    }, 500);
  }, []);

  const handleEventPopover = (
    event: CalendarEvent,
    position: { x: number; y: number }
  ) => {
    setPopoverEvent(event);
    setPopoverDate(event.startTime);
    setPopoverPosition(position);
    setShowPopover(true);
  };

  const handleDateCreate = (date: Date, position: { x: number; y: number }) => {
    setPopoverEvent(undefined);
    setPopoverDate(date);
    setPopoverPosition(position);
    setShowPopover(true);
  };

  const handleClosePopover = () => {
    setShowPopover(false);
  };

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading workspace...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="p-4 rounded-lg shadow-md bg-white text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-black text-white">
        <div className="flex items-center space-x-4">
          <button
            onClick={() =>
              handleDateCreate(new Date(), {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
              })
            }
            className="text-sm font-medium"
          >
            + ADD
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => useCalendarStore.getState().navigatePrevious()}
              className="text-lg"
            >
              ‹
            </button>
            <button
              onClick={() => useCalendarStore.getState().navigateNext()}
              className="text-lg"
            >
              ›
            </button>
            <button
              onClick={() => useCalendarStore.getState().goToToday()}
              className="text-sm"
            >
              TODAY
            </button>
          </div>
          <h2 className="text-lg font-semibold">
            {new Date(useCalendarStore.getState().viewDate).toLocaleDateString(
              "en-US",
              {
                month: "long",
                year: "numeric",
              }
            )}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">Calendar</h1>
          <button className="text-sm font-medium">EDIT</button>
          <div className="flex items-center space-x-1 bg-gray-800 rounded-full p-1">
            <button
              onClick={() => setView("month")}
              className={`text-sm px-3 py-1 rounded-full ${
                currentView === "month"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300"
              }`}
            >
              MONTH
            </button>
            <button
              onClick={() => setView("week")}
              className={`text-sm px-3 py-1 rounded-full ${
                currentView === "week"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300"
              }`}
            >
              LIST
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading events...</div>
          </div>
        ) : currentView === "week" ? (
          <TimelineView onEventClick={() => {}} className="h-full" />
        ) : (
          <CalendarView
            onEventClick={() => {}}
            onEventPopover={handleEventPopover}
            onCreateEvent={handleDateCreate}
            onNewEvent={() =>
              handleDateCreate(new Date(), {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
              })
            }
          />
        )}
      </main>

      {/* Event Popover */}
      {showPopover && popoverPosition && (
        <EventPopover
          isOpen={showPopover}
          onClose={handleClosePopover}
          date={popoverDate}
          position={popoverPosition}
          event={popoverEvent}
        />
      )}
    </div>
  );
}
