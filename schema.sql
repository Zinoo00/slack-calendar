-- Team Calendar App Database Schema
-- Multi-tenant PostgreSQL schema with Row-Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- WORKSPACES & USERS
-- ============================================================================

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan_type VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  timezone VARCHAR(100) DEFAULT 'UTC',
  locale VARCHAR(10) DEFAULT 'en',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- ============================================================================
-- CALENDAR EVENTS
-- ============================================================================

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- External sync fields
  external_id VARCHAR(255),
  external_source VARCHAR(50) CHECK (external_source IN ('outlook', 'google', 'slack')),
  external_metadata JSONB DEFAULT '{}',
  
  -- Event properties
  color VARCHAR(7) DEFAULT '#3b82f6',
  location VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern JSONB,
  recurrence_parent_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_modified_by UUID NOT NULL REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT external_sync_complete CHECK (
    (external_id IS NULL AND external_source IS NULL) OR 
    (external_id IS NOT NULL AND external_source IS NOT NULL)
  )
);

CREATE TABLE event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('accepted', 'declined', 'tentative', 'pending')),
  is_organizer BOOLEAN DEFAULT FALSE,
  response_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, email)
);

-- ============================================================================
-- INTEGRATIONS
-- ============================================================================

CREATE TABLE workspace_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('slack', 'microsoft', 'google')),
  
  -- Integration-specific data
  external_id VARCHAR(255), -- team_id for Slack, tenant_id for Microsoft
  name VARCHAR(255),
  
  -- Tokens and auth
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Configuration
  settings JSONB DEFAULT '{}',
  scopes TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  installed_by UUID NOT NULL REFERENCES users(id),
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(workspace_id, integration_type, external_id)
);

CREATE TABLE user_external_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('slack', 'microsoft', 'google')),
  
  -- External account info
  external_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  
  -- Tokens
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Provider-specific data
  provider_data JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, workspace_id, provider, external_user_id)
);

-- ============================================================================
-- COLLABORATION & REAL-TIME
-- ============================================================================

CREATE TABLE workspace_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Activity details
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('event', 'workspace', 'member', 'integration')),
  resource_id UUID,
  
  -- Change details
  changes JSONB,
  metadata JSONB DEFAULT '{}',
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE event_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  
  -- Subscription settings
  notification_types TEXT[] DEFAULT ARRAY['created', 'updated', 'deleted', 'reminder'],
  channels TEXT[] DEFAULT ARRAY['web', 'email'], -- web, email, slack, push
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(workspace_id, user_id, event_id)
);

-- ============================================================================
-- WEBHOOK & API
-- ============================================================================

CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Webhook details
  url VARCHAR(2000) NOT NULL,
  secret VARCHAR(100) NOT NULL,
  events TEXT[] NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  failure_count INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMP WITH TIME ZONE,
  last_failure_at TIMESTAMP WITH TIME ZONE,
  
  -- Configuration
  retry_policy JSONB DEFAULT '{"max_retries": 3, "backoff": "exponential"}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Key details
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(20) NOT NULL,
  
  -- Permissions
  scopes TEXT[] DEFAULT ARRAY['read'],
  rate_limit INTEGER DEFAULT 1000, -- requests per hour
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Calendar events indexes
CREATE INDEX idx_calendar_events_workspace_time ON calendar_events(workspace_id, start_time, end_time);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX idx_calendar_events_external ON calendar_events(external_source, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_calendar_events_recurring ON calendar_events(recurrence_parent_id) WHERE is_recurring = TRUE;

-- Event attendees indexes
CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_event_attendees_email ON event_attendees(email);

-- Workspace members indexes
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_active ON workspace_members(workspace_id, is_active);

-- Activity and audit indexes
CREATE INDEX idx_workspace_activity_workspace_time ON workspace_activity(workspace_id, created_at DESC);
CREATE INDEX idx_workspace_activity_user ON workspace_activity(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_workspace_activity_resource ON workspace_activity(resource_type, resource_id);

-- Integration indexes
CREATE INDEX idx_workspace_integrations_workspace ON workspace_integrations(workspace_id);
CREATE INDEX idx_workspace_integrations_type ON workspace_integrations(integration_type, is_active);
CREATE INDEX idx_user_external_accounts_user_workspace ON user_external_accounts(user_id, workspace_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tenant-specific tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_external_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace isolation
CREATE POLICY workspace_isolation ON calendar_events
  USING (workspace_id = current_setting('app.current_workspace_id', true)::UUID);

CREATE POLICY workspace_isolation ON workspace_members
  USING (workspace_id = current_setting('app.current_workspace_id', true)::UUID);

CREATE POLICY workspace_isolation ON event_attendees
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events 
      WHERE calendar_events.id = event_attendees.event_id 
      AND calendar_events.workspace_id = current_setting('app.current_workspace_id', true)::UUID
    )
  );

CREATE POLICY workspace_isolation ON workspace_integrations
  USING (workspace_id = current_setting('app.current_workspace_id', true)::UUID);

CREATE POLICY workspace_isolation ON user_external_accounts
  USING (workspace_id = current_setting('app.current_workspace_id', true)::UUID);

CREATE POLICY workspace_isolation ON workspace_activity
  USING (workspace_id = current_setting('app.current_workspace_id', true)::UUID);

CREATE POLICY workspace_isolation ON event_subscriptions
  USING (workspace_id = current_setting('app.current_workspace_id', true)::UUID);

CREATE POLICY workspace_isolation ON webhook_subscriptions
  USING (workspace_id = current_setting('app.current_workspace_id', true)::UUID);

CREATE POLICY workspace_isolation ON api_keys
  USING (workspace_id = current_setting('app.current_workspace_id', true)::UUID);

-- User can access workspaces they're a member of
CREATE POLICY user_workspace_access ON workspaces
  USING (
    id = current_setting('app.current_workspace_id', true)::UUID
    AND EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_members.workspace_id = workspaces.id 
      AND workspace_members.user_id = current_setting('app.current_user_id', true)::UUID
      AND workspace_members.is_active = TRUE
    )
  );

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_integrations_updated_at BEFORE UPDATE ON workspace_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_external_accounts_updated_at BEFORE UPDATE ON user_external_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activity logging function
CREATE OR REPLACE FUNCTION log_workspace_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workspace_activity (
    workspace_id,
    user_id,
    action,
    resource_type,
    resource_id,
    changes
  ) VALUES (
    COALESCE(NEW.workspace_id, OLD.workspace_id),
    current_setting('app.current_user_id', true)::UUID,
    TG_OP,
    TG_TABLE_NAME::TEXT,
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
      ELSE jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply activity logging triggers
CREATE TRIGGER log_calendar_events_activity AFTER INSERT OR UPDATE OR DELETE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION log_workspace_activity();

CREATE TRIGGER log_workspace_members_activity AFTER INSERT OR UPDATE OR DELETE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION log_workspace_activity();

-- ============================================================================
-- SEED DATA (Optional - for development)
-- ============================================================================

-- Insert default workspace settings template
INSERT INTO workspaces (id, name, slug, settings) VALUES (
  uuid_generate_v4(),
  'Default Workspace',
  'default',
  '{
    "timezone": "UTC",
    "workingHours": {"start": "09:00", "end": "17:00"},
    "workingDays": [1,2,3,4,5],
    "defaultEventDuration": 60,
    "allowExternalCalendarSync": true,
    "requireApprovalForEvents": false,
    "defaultEventColor": "#3b82f6",
    "integrations": {
      "slack": {"enabled": false, "scopes": ["commands", "chat:write", "users:read"]},
      "microsoft": {"enabled": false, "connectedUsers": []}
    }
  }'
) ON CONFLICT DO NOTHING;