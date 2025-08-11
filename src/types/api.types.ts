export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

// Slack API types
export interface SlackCommandPayload {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
}

export interface SlackResponse {
  response_type: 'in_channel' | 'ephemeral';
  text: string;
  attachments?: SlackAttachment[];
  blocks?: SlackBlock[];
}

export interface SlackAttachment {
  color?: string;
  text?: string;
  title?: string;
  title_link?: string;
  fields?: SlackField[];
  actions?: SlackAction[];
  footer?: string;
  ts?: number;
}

export interface SlackField {
  title: string;
  value: string;
  short?: boolean;
}

export interface SlackAction {
  type: string;
  text: string;
  url?: string;
  value?: string;
  name?: string;
}

export interface SlackBlock {
  type: 'section' | 'divider' | 'header' | 'actions';
  text?: {
    type: 'mrkdwn' | 'plain_text';
    text: string;
  };
  accessory?: any;
  elements?: any[];
}

// Microsoft Graph API types
export interface GraphEvent {
  id: string;
  subject: string;
  body: {
    contentType: 'HTML' | 'Text';
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees: GraphAttendee[];
  location: {
    displayName: string;
    address?: any;
  };
  categories: string[];
  isAllDay: boolean;
  recurrence?: any;
  createdDateTime: string;
  lastModifiedDateTime: string;
}

export interface GraphAttendee {
  emailAddress: {
    address: string;
    name: string;
  };
  status: {
    response: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded';
    time: string;
  };
}

export interface GraphCalendar {
  id: string;
  name: string;
  color: string;
  canEdit: boolean;
  canShare: boolean;
  canViewPrivateItems: boolean;
  owner: {
    name: string;
    address: string;
  };
}

export interface GraphFreeBusyResponse {
  schedules: Array<{
    scheduleId: string;
    availabilityView: string;
    freeBusyViewType: 'merged' | 'FreeBusy';
    workingHours: {
      daysOfWeek: string[];
      startTime: string;
      endTime: string;
      timeZone: {
        name: string;
      };
    };
  }>;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: 'event.created' | 'event.updated' | 'event.deleted' | 'workspace.member.added' | 'workspace.member.removed';
  workspaceId: string;
  userId?: string;
  data: Record<string, any>;
  timestamp: Date;
  source: 'internal' | 'slack' | 'microsoft' | 'webhook';
}

export interface WebhookSubscription {
  id: string;
  workspaceId: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  createdAt: Date;
  lastDeliveryAt?: Date;
  failureCount: number;
}