// FILE: rentguy/frontend/src/stores/authStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { User } from '../types';
import * as authApi from '../api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const createAuthStore = create<AuthState>()(immer((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const user = await authApi.login(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false });
  },
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const user = await authApi.checkAuth();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
})));

// FILE: rentguy/frontend/src/stores/adminStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { User, Role } from '../types';
import * as adminApi from '../api/admin';

interface AdminState {
  users: User[];
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  fetchRoles: () => Promise<void>;
}

export const createAdminStore = create<AdminState>()(immer((set) => ({
  users: [],
  roles: [],
  isLoading: false,
  error: null,
  fetchUsers: async () => {
    try {
      set({ isLoading: true });
      const users = await adminApi.getUsers();
      set({ users, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  fetchRoles: async () => {
    try {
      set({ isLoading: true });
      const roles = await adminApi.getRoles();
      set({ roles, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
})));

// FILE: rentguy/frontend/src/stores/crmStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Client, Interaction } from '../types';
import * as crmApi from '../api/crm';

interface CrmState {
  clients: Client[];
  interactions: Interaction[];
  isLoading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  fetchInteractions: (clientId: string) => Promise<void>;
}

export const createCrmStore = create<CrmState>()(immer((set) => ({
  clients: [],
  interactions: [],
  isLoading: false,
  error: null,
  fetchClients: async () => {
    try {
      set({ isLoading: true });
      const clients = await crmApi.getClients();
      set({ clients, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  fetchInteractions: async (clientId) => {
    try {
      set({ isLoading: true });
      const interactions = await crmApi.getInteractions(clientId);
      set({ interactions, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
})));

// FILE: rentguy/frontend/src/stores/crewStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { TeamMember, Schedule } from '../types';
import * as crewApi from '../api/crew';

interface CrewState {
  teamMembers: TeamMember[];
  schedules: Schedule[];
  isLoading: boolean;
  error: string | null;
  fetchTeamMembers: () => Promise<void>;
  fetchSchedules: (date: Date) => Promise<void>;
}

export const createCrewStore = create<CrewState>()(immer((set) => ({
  teamMembers: [],
  schedules: [],
  isLoading: false,
  error: null,
  fetchTeamMembers: async () => {
    try {
      set({ isLoading: true });
      const teamMembers = await crewApi.getTeamMembers();
      set({ teamMembers, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  fetchSchedules: async (date) => {
    try {
      set({ isLoading: true });
      const schedules = await crewApi.getSchedules(date);
      set({ schedules, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
})));

// FILE: rentguy/frontend/src/stores/financeStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Invoice, Payment } from '../types';
import * as financeApi from '../api/finance';

interface FinanceState {
  invoices: Invoice[];
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  fetchPayments: () => Promise<void>;
}

export const createFinanceStore = create<FinanceState>()(immer((set) => ({
  invoices: [],
  payments: [],
  isLoading: false,
  error: null,
  fetchInvoices: async () => {
    try {
      set({ isLoading: true });
      const invoices = await financeApi.getInvoices();
      set({ invoices, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  fetchPayments: async () => {
    try {
      set({ isLoading: true });
      const payments = await financeApi.getPayments();
      set({ payments, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
})));

// FILE: rentguy/frontend/src/stores/projectStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Project, Task } from '../types';
import * as projectApi from '../api/project';

interface ProjectState {
  projects: Project[];
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  fetchTasks: (projectId: string) => Promise<void>;
}

export const createProjectStore = create<ProjectState>()(immer((set) => ({
  projects: [],
  tasks: [],
  isLoading: false,
  error: null,
  fetchProjects: async () => {
    try {
      set({ isLoading: true });
      const projects = await projectApi.getProjects();
      set({ projects, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  fetchTasks: async (projectId) => {
    try {
      set({ isLoading: true });
      const tasks = await projectApi.getTasks(projectId);
      set({ tasks, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
})));