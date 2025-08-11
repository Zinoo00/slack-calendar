import React, { useState, useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import WorkspaceLayout from "../Workspace/WorkspaceLayout";
import CalendarView from "./CalendarView";
import { EventPopover } from "@/components/Calendar/EventPopover";
import { Skeleton } from "../ui/skeleton";

export const CalendarPage: React.FC = () => {
  const [popoverState, setPopoverState] = useState<{
    visible: boolean;
    date: Date | null;
    position: { x: number; y: number } | null;
  }>({ visible: false, date: null, position: null });

  const { initializeWorkspace, isLoading: workspaceLoading } =
    useWorkspaceStore();

  useEffect(() => {
    initializeWorkspace();
  }, [initializeWorkspace]);

  const handleDateClick = (date: Date, position: { x: number; y: number }) => {
    setPopoverState({ visible: true, date, position });
  };

  const handlePopoverClose = () => {
    setPopoverState({ visible: false, date: null, position: null });
  };

  const handleNewEvent = () => {
    // Create a new event at the current date
    const today = new Date();
    const rect = document.body.getBoundingClientRect();
    handleDateClick(today, { x: rect.width / 2, y: rect.height / 2 });
  };

  if (workspaceLoading) {
    return (
      <div className="h-screen bg-background">
        <div className="border-b">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
          <div className="border-t px-4 py-2">
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-lg p-2 h-32">
                <Skeleton className="h-4 w-6 mb-2" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <WorkspaceLayout>
        <CalendarView
          onEventClick={() => {}}
          onEventPopover={(event, pos) => {
            setPopoverState({
              visible: true,
              date: event.startTime,
              position: pos,
            });
          }}
          onCreateEvent={handleDateClick}
          onNewEvent={handleNewEvent}
        />
      </WorkspaceLayout>
      {popoverState.visible && popoverState.date && (
        <EventPopover
          date={popoverState.date}
          position={popoverState.position!}
          onClose={handlePopoverClose}
          isOpen={popoverState.visible}
        />
      )}
    </>
  );
};
