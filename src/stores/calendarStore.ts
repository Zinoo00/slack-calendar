import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  CalendarEvent,
  CalendarView,
  CreateEventInput,
  TimeRange,
} from "@/types/calendar.types";

interface CalendarStore {
  // State
  events: CalendarEvent[];
  currentView: CalendarView;
  selectedDate: Date;
  selectedEventId: string | null;
  isLoading: boolean;
  error: string | null;
  workspaceId: string;

  // View state
  viewDate: Date;
  timeRange: TimeRange;

  // Filters
  filters: {
    attendeeIds: string[];
    eventTypes: string[];
    hideDeclined: boolean;
  };

  // Actions
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  setView: (view: CalendarView) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedEvent: (eventId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setWorkspace: (workspaceId: string) => void;

  // Calendar navigation
  navigateToDate: (date: Date) => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
  goToToday: () => void;

  // Event management
  createEvent: (input: CreateEventInput) => Promise<CalendarEvent>;
  duplicateEvent: (eventId: string, newDate?: Date) => Promise<CalendarEvent>;
  moveEvent: (
    eventId: string,
    newStartTime: Date,
    newEndTime: Date
  ) => Promise<void>;

  // Filtering
  setFilters: (filters: Partial<CalendarStore["filters"]>) => void;
  getFilteredEvents: () => CalendarEvent[];

  // Bulk operations
  bulkUpdateEvents: (
    updates: Array<{ id: string; updates: Partial<CalendarEvent> }>
  ) => void;
  clearEvents: () => void;

  // Real-time sync
  syncWithExternal: (source: "outlook" | "google" | "slack") => Promise<void>;
  handleRealtimeUpdate: (
    event: CalendarEvent,
    action: "created" | "updated" | "deleted"
  ) => void;
}

const calculateTimeRange = (date: Date, view: CalendarView): TimeRange => {
  const start = new Date(date);
  const end = new Date(date);

  switch (view) {
    case "day":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week":
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "agenda":
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 30);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
};

const generateId = (): string => {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useCalendarStore = create<CalendarStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    events: [],
    currentView: "month",
    selectedDate: new Date(),
    selectedEventId: null,
    isLoading: false,
    error: null,
    workspaceId: "",
    viewDate: new Date(),
    timeRange: calculateTimeRange(new Date(), "month"),
    filters: {
      attendeeIds: [],
      eventTypes: [],
      hideDeclined: false,
    },

    // Basic setters
    setEvents: (events) => set({ events }),
    setView: (view) => {
      const { viewDate } = get();
      const timeRange = calculateTimeRange(viewDate, view);
      set({ currentView: view, timeRange });
    },
    setSelectedDate: (date) => set({ selectedDate: date }),
    setSelectedEvent: (eventId) => set({ selectedEventId: eventId }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setWorkspace: (workspaceId) => set({ workspaceId }),

    // Event management
    addEvent: (event) => {
      set((state) => ({
        events: [...state.events, event],
      }));
    },

    updateEvent: (id, updates) => {
      set((state) => ({
        events: state.events.map((event) =>
          event.id === id
            ? { ...event, ...updates, lastModified: Date.now() }
            : event
        ),
      }));
    },

    deleteEvent: (id) => {
      set((state) => ({
        events: state.events.filter((event) => event.id !== id),
        selectedEventId:
          state.selectedEventId === id ? null : state.selectedEventId,
      }));
    },

    // Navigation
    navigateToDate: (date) => {
      const { currentView } = get();
      const timeRange = calculateTimeRange(date, currentView);
      set({ viewDate: date, timeRange });
    },

    navigateNext: () => {
      const { viewDate, currentView } = get();
      const newDate = new Date(viewDate);

      switch (currentView) {
        case "day":
          newDate.setDate(newDate.getDate() + 1);
          break;
        case "week":
          newDate.setDate(newDate.getDate() + 7);
          break;
        case "month":
          newDate.setMonth(newDate.getMonth() + 1);
          break;
        case "agenda":
          newDate.setDate(newDate.getDate() + 30);
          break;
      }

      get().navigateToDate(newDate);
    },

    navigatePrevious: () => {
      const { viewDate, currentView } = get();
      const newDate = new Date(viewDate);

      switch (currentView) {
        case "day":
          newDate.setDate(newDate.getDate() - 1);
          break;
        case "week":
          newDate.setDate(newDate.getDate() - 7);
          break;
        case "month":
          newDate.setMonth(newDate.getMonth() - 1);
          break;
        case "agenda":
          newDate.setDate(newDate.getDate() - 30);
          break;
      }

      get().navigateToDate(newDate);
    },

    goToToday: () => {
      get().navigateToDate(new Date());
    },

    // Advanced event operations
    createEvent: async (input: CreateEventInput): Promise<CalendarEvent> => {
      const { workspaceId } = get();

      const event: CalendarEvent = {
        id: generateId(),
        ...input,
        type: input.type || "default",
        workspaceId,
        createdBy: "current-user", // This should come from auth context
        lastModified: Date.now(),
        lastModifiedBy: "current-user",
        attendees:
          input.attendees?.map((attendee) => ({
            ...attendee,
            id: generateId(),
            status: "pending" as const,
          })) || [],
      };

      get().addEvent(event);

      // TODO: Sync with backend
      // await api.createEvent(event);

      return event;
    },

    duplicateEvent: async (
      eventId: string,
      newDate?: Date
    ): Promise<CalendarEvent> => {
      const { events } = get();
      const originalEvent = events.find((e) => e.id === eventId);

      if (!originalEvent) {
        throw new Error("Event not found");
      }

      const duration =
        originalEvent.endTime.getTime() - originalEvent.startTime.getTime();
      const startTime = newDate || new Date(originalEvent.startTime);
      const endTime = new Date(startTime.getTime() + duration);

      return get().createEvent({
        title: `${originalEvent.title} (Copy)`,
        type: originalEvent.type,
        description: originalEvent.description,
        startTime,
        endTime,
        allDay: originalEvent.allDay,
        attendees: originalEvent.attendees.map(
          ({ id, status, ...attendee }) => attendee
        ),
        color: originalEvent.color,
      });
    },

    moveEvent: async (
      eventId: string,
      newStartTime: Date,
      newEndTime: Date
    ): Promise<void> => {
      get().updateEvent(eventId, {
        startTime: newStartTime,
        endTime: newEndTime,
      });

      // TODO: Sync with backend
      // await api.updateEvent(eventId, { startTime: newStartTime, endTime: newEndTime });
    },

    // Filtering
    setFilters: (filters) => {
      set((state) => ({
        filters: { ...state.filters, ...filters },
      }));
    },

    getFilteredEvents: () => {
      const { events, filters } = get();

      return events.filter((event) => {
        // Filter by attendees
        if (filters.attendeeIds.length > 0) {
          const hasMatchingAttendee = event.attendees.some((attendee) =>
            filters.attendeeIds.includes(attendee.id)
          );
          if (!hasMatchingAttendee) return false;
        }

        // Hide declined events
        if (
          filters.hideDeclined &&
          event.attendees.some((a) => a.status === "declined")
        ) {
          return false;
        }

        if (
          filters.eventTypes.length > 0 &&
          !filters.eventTypes.includes(event.type)
        ) {
          return false;
        }

        return true;
      });
    },

    // Bulk operations
    bulkUpdateEvents: (updates) => {
      set((state) => ({
        events: state.events.map((event) => {
          const update = updates.find((u) => u.id === event.id);
          return update
            ? { ...event, ...update.updates, lastModified: Date.now() }
            : event;
        }),
      }));
    },

    clearEvents: () => set({ events: [] }),

    // Real-time sync
    syncWithExternal: async (source) => {
      set({ isLoading: true, error: null });

      try {
        // TODO: Implement external sync
        console.log(`Syncing with ${source}...`);

        // const syncedEvents = await api.syncExternalCalendar(source);
        // set({ events: syncedEvents });
      } catch (error) {
        set({ error: `Failed to sync with ${source}` });
      } finally {
        set({ isLoading: false });
      }
    },

    handleRealtimeUpdate: (event, action) => {
      switch (action) {
        case "created":
          get().addEvent(event);
          break;
        case "updated":
          get().updateEvent(event.id, event);
          break;
        case "deleted":
          get().deleteEvent(event.id);
          break;
      }
    },
  }))
);
