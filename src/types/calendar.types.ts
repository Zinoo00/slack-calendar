export interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  allDay?: boolean;
  attendees: EventAttendee[];
  workspaceId: string;
  createdBy: string;
  externalId?: string;
  externalSource?: "outlook" | "google" | "slack";
  metadata?: Record<string, any>;
  color?: string;
  isRecurring?: boolean;
  isResizable?: boolean;
  recurrencePattern?: RecurrencePattern;
  lastModified: number;
  lastModifiedBy: string;
}

export interface EventAttendee {
  id: string;
  email: string;
  name: string;
  status: "accepted" | "declined" | "tentative" | "pending";
  isOrganizer?: boolean;
}

export interface RecurrencePattern {
  type: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: Date;
  count?: number;
}

export type CalendarView = "day" | "week" | "month" | "agenda";

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  status: "free" | "busy" | "tentative" | "out-of-office";
  subject?: string;
}

export interface AvailabilityMap {
  [userId: string]: AvailabilitySlot[];
}

export interface MeetingTimeSlot {
  start: Date;
  end: Date;
  confidence: number;
  attendeeAvailability: {
    [userId: string]: "available" | "busy" | "unknown";
  };
}

export interface SchedulingConstraints {
  earliestStart: Date;
  latestEnd: Date;
  minimumAttendees?: number;
  requiredAttendees?: string[];
  preferredTimes?: TimeRange[];
  excludedTimes?: TimeRange[];
}

export interface CalendarViewState {
  currentDate: Date;
  view: CalendarView;
  selectedEventId?: string;
  isLoading: boolean;
  error?: string;
}

export interface CreateEventInput {
  title: string;
  type: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  allDay?: boolean;
  attendees?: Omit<EventAttendee, "id" | "status">[];
  color?: string;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
}
