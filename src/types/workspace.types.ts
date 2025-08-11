export interface Workspace {
  id: string;
  name: string;
  slug: string;
  planType: 'free' | 'pro' | 'enterprise';
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceSettings {
  timezone: string;
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
  workingDays: number[]; // [1,2,3,4,5] for Mon-Fri
  defaultEventDuration: number; // minutes
  allowExternalCalendarSync: boolean;
  requireApprovalForEvents: boolean;
  defaultEventColor: string;
  integrations: {
    slack: SlackIntegration;
    microsoft: MicrosoftIntegration;
  };
}

export interface SlackIntegration {
  enabled: boolean;
  teamId?: string;
  teamName?: string;
  botToken?: string;
  installedBy?: string;
  installedAt?: Date;
  scopes: string[];
}

export interface MicrosoftIntegration {
  enabled: boolean;
  tenantId?: string;
  clientId?: string;
  connectedUsers: ConnectedUser[];
}

export interface ConnectedUser {
  userId: string;
  email: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  calendarId?: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  email: string;
  name: string;
  role: WorkspaceRole;
  permissions: WorkspacePermissions;
  joinedAt: Date;
  isActive: boolean;
}

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface WorkspacePermissions {
  canCreateEvents: boolean;
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canManageMembers: boolean;
  canManageIntegrations: boolean;
  canManageSettings: boolean;
  canViewAllEvents: boolean;
  canExportCalendar: boolean;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
}

export interface WorkspaceStats {
  totalMembers: number;
  activeMembers: number;
  totalEvents: number;
  eventsThisMonth: number;
  integrationCount: number;
  storageUsed: number; // in MB
  storageLimit: number; // in MB
}

export interface WorkspaceAuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  resourceType: 'event' | 'workspace' | 'member' | 'integration';
  resourceId: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}