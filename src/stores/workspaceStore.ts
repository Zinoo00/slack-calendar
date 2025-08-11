import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Workspace,
  WorkspaceMember,
  WorkspacePermissions,
  WorkspaceSettings,
  WorkspaceRole,
} from "@/types/workspace.types";

interface WorkspaceStore {
  // Current workspace state
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  permissions: WorkspacePermissions;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;

  // Workspace switching
  switchWorkspace: (workspaceId: string) => Promise<void>;

  // Members management
  setMembers: (members: WorkspaceMember[]) => void;
  addMember: (member: WorkspaceMember) => void;
  updateMember: (id: string, updates: Partial<WorkspaceMember>) => void;
  removeMember: (id: string) => void;

  // Settings management
  updateSettings: (settings: Partial<WorkspaceSettings>) => Promise<void>;

  // Permissions
  calculatePermissions: (
    workspace: Workspace | null,
    userId: string
  ) => WorkspacePermissions;
  hasPermission: (permission: keyof WorkspacePermissions) => boolean;

  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Initialization
  initializeWorkspace: (workspaceId?: string) => Promise<void>;
  createWorkspace: (
    name: string,
    settings?: Partial<WorkspaceSettings>
  ) => Promise<Workspace>;
}

const defaultPermissions: WorkspacePermissions = {
  canCreateEvents: false,
  canEditEvents: false,
  canDeleteEvents: false,
  canManageMembers: false,
  canManageIntegrations: false,
  canManageSettings: false,
  canViewAllEvents: false,
  canExportCalendar: false,
};

const calculatePermissionsByRole = (
  role: WorkspaceRole
): WorkspacePermissions => {
  switch (role) {
    case "owner":
      return {
        canCreateEvents: true,
        canEditEvents: true,
        canDeleteEvents: true,
        canManageMembers: true,
        canManageIntegrations: true,
        canManageSettings: true,
        canViewAllEvents: true,
        canExportCalendar: true,
      };
    case "admin":
      return {
        canCreateEvents: true,
        canEditEvents: true,
        canDeleteEvents: true,
        canManageMembers: true,
        canManageIntegrations: true,
        canManageSettings: false,
        canViewAllEvents: true,
        canExportCalendar: true,
      };
    case "member":
      return {
        canCreateEvents: true,
        canEditEvents: true,
        canDeleteEvents: false,
        canManageMembers: false,
        canManageIntegrations: false,
        canManageSettings: false,
        canViewAllEvents: true,
        canExportCalendar: false,
      };
    case "viewer":
      return {
        canCreateEvents: false,
        canEditEvents: false,
        canDeleteEvents: false,
        canManageMembers: false,
        canManageIntegrations: false,
        canManageSettings: false,
        canViewAllEvents: true,
        canExportCalendar: false,
      };
    default:
      return defaultPermissions;
  }
};

const defaultWorkspaceSettings: WorkspaceSettings = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  workingHours: {
    start: "09:00",
    end: "17:00",
  },
  workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  defaultEventDuration: 60,
  allowExternalCalendarSync: true,
  requireApprovalForEvents: false,
  defaultEventColor: "#3b82f6",
  integrations: {
    slack: {
      enabled: false,
      scopes: ["commands", "chat:write", "users:read"],
    },
    microsoft: {
      enabled: false,
      connectedUsers: [],
    },
  },
};

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentWorkspace: null,
      workspaces: [],
      members: [],
      permissions: defaultPermissions,
      isLoading: false,
      error: null,

      // Basic setters
      setCurrentWorkspace: (workspace) => {
        const permissions = workspace
          ? get().calculatePermissions(workspace, "current-user") // TODO: Get from auth
          : defaultPermissions;

        set({
          currentWorkspace: workspace,
          permissions,
        });
      },

      setWorkspaces: (workspaces) => set({ workspaces }),

      addWorkspace: (workspace) => {
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
        }));
      },

      updateWorkspace: (id, updates) => {
        set((state) => ({
          workspaces: state.workspaces.map((workspace) =>
            workspace.id === id ? { ...workspace, ...updates } : workspace
          ),
          currentWorkspace:
            state.currentWorkspace?.id === id
              ? { ...state.currentWorkspace, ...updates }
              : state.currentWorkspace,
        }));
      },

      deleteWorkspace: (id) => {
        set((state) => ({
          workspaces: state.workspaces.filter(
            (workspace) => workspace.id !== id
          ),
          currentWorkspace:
            state.currentWorkspace?.id === id ? null : state.currentWorkspace,
        }));
      },

      // Workspace switching
      switchWorkspace: async (workspaceId: string) => {
        const { workspaces } = get();
        const workspace = workspaces.find((w) => w.id === workspaceId);

        if (!workspace) {
          throw new Error("Workspace not found");
        }

        set({ isLoading: true, error: null });

        try {
          // TODO: Load workspace-specific data
          // const members = await api.getWorkspaceMembers(workspaceId);
          // set({ members });

          get().setCurrentWorkspace(workspace);

          // TODO: Update authentication context
          // await api.setWorkspaceContext(workspaceId);
        } catch (error) {
          set({ error: "Failed to switch workspace" });
        } finally {
          set({ isLoading: false });
        }
      },

      // Members management
      setMembers: (members) => set({ members }),

      addMember: (member) => {
        set((state) => ({
          members: [...state.members, member],
        }));
      },

      updateMember: (id, updates) => {
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id ? { ...member, ...updates } : member
          ),
        }));
      },

      removeMember: (id) => {
        set((state) => ({
          members: state.members.filter((member) => member.id !== id),
        }));
      },

      // Settings management
      updateSettings: async (settings) => {
        const { currentWorkspace } = get();
        if (!currentWorkspace) {
          throw new Error("No workspace selected");
        }

        set({ isLoading: true, error: null });

        try {
          const updatedSettings = {
            ...currentWorkspace.settings,
            ...settings,
          };

          // TODO: Update via API
          // await api.updateWorkspaceSettings(currentWorkspace.id, updatedSettings);

          get().updateWorkspace(currentWorkspace.id, {
            settings: updatedSettings,
            updatedAt: new Date(),
          });
        } catch (error) {
          set({ error: "Failed to update workspace settings" });
        } finally {
          set({ isLoading: false });
        }
      },

      // Permissions
      calculatePermissions: (workspace, userId) => {
        if (!workspace) return defaultPermissions;

        // TODO: Get user's role from members list
        const userMember = get().members.find((m) => m.userId === userId);
        const role = userMember?.role || "viewer";

        return calculatePermissionsByRole(role);
      },

      hasPermission: (permission) => {
        return get().permissions[permission];
      },

      // Loading states
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Initialization
      initializeWorkspace: async (workspaceId) => {
        set({ isLoading: true, error: null });

        try {
          // Mock data for demonstration
          const mockWorkspaces: Workspace[] = [
            {
              id: "ws_1",
              name: "Company Workspace",
              slug: "company-workspace",
              planType: "free",
              settings: defaultWorkspaceSettings,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ];
          set({ workspaces: mockWorkspaces });

          if (workspaceId) {
            await get().switchWorkspace(workspaceId);
          } else if (get().workspaces.length > 0) {
            await get().switchWorkspace(get().workspaces[0].id);
          }
        } catch (error) {
          set({ error: "Failed to initialize workspace" });
        } finally {
          set({ isLoading: false });
        }
      },

      // Workspace creation
      createWorkspace: async (name, settings = {}) => {
        set({ isLoading: true, error: null });

        try {
          const workspace: Workspace = {
            id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            planType: "free",
            settings: { ...defaultWorkspaceSettings, ...settings },
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // TODO: Create via API
          // const createdWorkspace = await api.createWorkspace(workspace);

          get().addWorkspace(workspace);
          get().setCurrentWorkspace(workspace);

          return workspace;
        } catch (error) {
          set({ error: "Failed to create workspace" });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "workspace-storage",
      partialize: (state) => ({
        workspaces: state.workspaces,
        currentWorkspace: state.currentWorkspace,
      }),
    }
  )
);
