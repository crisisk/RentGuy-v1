import { create } from 'zustand';
import { produce } from 'immer';
import axios from 'axios';
import type { PersonaKey, PersonaPreset } from '@rg-types/projectTypes';
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  startDate: string;
  endDate: string;
}
export interface TimelineEvent {
  id: string;
  projectId: string;
  title: string;
  description: string;
  date: string;
  type: 'milestone' | 'deadline' | 'event';
}
interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  timeline: TimelineEvent[];
  loading: boolean;
  error: string | null;
  
  fetchProjects: () => Promise<void>;
  createProject: (data: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  fetchTimeline: (projectId: string) => Promise<void>;
  addTimelineEvent: (data: Omit<TimelineEvent, 'id'>) => Promise<void>;
}
const API_BASE = 'http://localhost:8000/api/v1/projects';

export const defaultProjectPresets: Record<PersonaKey, PersonaPreset> = {
  all: {
    label: 'Alle persona\'s',
    description: 'Volledige cockpit zonder filters voor snelle oriëntatie.',
    kpis: [
      {
        id: 'portfolio-size',
        label: 'Projecten actief',
        metric: 'totalProjects',
        hint: 'Inclusief pipeline, actieve en afgeronde projecten.',
        suffix: ' projecten',
      },
      {
        id: 'live-operations',
        label: 'Live operaties',
        metric: 'activeProjects',
        hint: 'Projecten met actieve of risicosignalen.',
        suffix: ' live',
      },
    ],
  },
  operations: {
    label: 'Operations manager',
    description: 'Focus op voorraadblokkades en lopende uitvoeringen.',
    statusFilter: 'active',
    riskFilter: 'critical',
    sortKey: 'risk',
    sortDir: 'desc',
    timeFilter: 'today',
    kpis: [
      {
        id: 'critical-queue',
        label: 'Kritieke blokkades',
        metric: 'criticalProjects',
        hint: 'Voorraadissues die onmiddellijke actie vragen.',
      },
      {
        id: 'alerts',
        label: 'Actieve alerts',
        metric: 'eventsWithAlerts',
        hint: 'Projecten met voorraad- of crewwaarschuwingen.',
      },
    ],
  },
  support: {
    label: 'Support lead',
    description: 'Crew briefings en klantcommunicatie voor komende shows.',
    statusFilter: 'active',
    riskFilter: 'warning',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'next7',
    kpis: [
      {
        id: 'handoffs',
        label: 'Shows binnen 7 dagen',
        metric: 'upcoming7Days',
        hint: 'Projecten die crew-briefings nodig hebben.',
        suffix: ' gepland',
      },
      {
        id: 'open-alerts',
        label: 'Alerts te volgen',
        metric: 'eventsWithAlerts',
        hint: 'Let op communicatie richting klant en crew.',
      },
    ],
  },
  cfo: {
    label: 'CFO / Finance',
    description: 'Afrondingen en facturatie-ready projecten.',
    statusFilter: 'completed',
    riskFilter: 'all',
    sortKey: 'end',
    sortDir: 'desc',
    timeFilter: 'past30',
    kpis: [
      {
        id: 'billing-ready',
        label: 'Afgerond (30 dagen)',
        metric: 'completed30Days',
        hint: 'Projecten klaar voor facturatie of analyse.',
        suffix: ' afgerond',
      },
      {
        id: 'critical-followup',
        label: 'Nog te escaleren',
        metric: 'criticalProjects',
        hint: 'Kritieke cases die facturatie kunnen blokkeren.',
      },
    ],
  },
  sales: {
    label: 'Sales director',
    description: 'Pipeline en bevestigde deals voor de komende weken.',
    statusFilter: 'upcoming',
    riskFilter: 'all',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'next14',
    kpis: [
      {
        id: 'upcoming-pipeline',
        label: 'Pipeline (14 dagen)',
        metric: 'upcoming14Days',
        hint: 'Shows die nog afstemming met klant vereisen.',
        suffix: ' in pipeline',
      },
      {
        id: 'active-portfolio',
        label: 'Actieve accounts',
        metric: 'activeProjects',
        hint: 'Projecten in uitvoering bij strategische klanten.',
      },
    ],
  },
  compliance: {
    label: 'Compliance officer',
    description: 'Audit- en escalatieoverzicht voor governance.',
    statusFilter: 'all',
    riskFilter: 'critical',
    sortKey: 'risk',
    sortDir: 'desc',
    timeFilter: 'all',
    kpis: [
      {
        id: 'at-risk',
        label: 'Risicoprojecten',
        metric: 'atRiskProjects',
        hint: 'Projecten die governance review vereisen.',
      },
      {
        id: 'watchlist',
        label: 'Waarschuwingen',
        metric: 'warningProjects',
        hint: 'Monitor voor compliance check-ins.',
      },
    ],
  },
};
export const projectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  timeline: [],
  loading: false,
  error: null,
  fetchProjects: async () => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));
    
    try {
      const response = await axios.get(`${API_BASE}`);
      set(produce((state: ProjectState) => {
        state.projects = response.data;
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = axios.isAxiosError(error) ? 'Failed to fetch projects' : error instanceof Error ? error.message : 'Failed to fetch projects';
      }));
    }
  },
  createProject: async (data) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));
    
    try {
      const response = await axios.post(`${API_BASE}`, data);
      set(produce((state: ProjectState) => {
        state.projects.push(response.data);
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = axios.isAxiosError(error) ? 'Failed to create project' : error instanceof Error ? error.message : 'Failed to create project';
      }));
    }
  },
  updateProject: async (id, data) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));
    
    try {
      const response = await axios.put(`${API_BASE}/${id}`, data);
      set(produce((state: ProjectState) => {
        const index = state.projects.findIndex(p => p.id === id);
        if (index !== -1) state.projects[index] = response.data;
        if (state.currentProject?.id === id) state.currentProject = response.data;
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = axios.isAxiosError(error) ? 'Failed to update project' : error instanceof Error ? error.message : 'Failed to update project';
      }));
    }
  },
  deleteProject: async (id) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));
    
    try {
      await axios.delete(`${API_BASE}/${id}`);
      set(produce((state: ProjectState) => {
        state.projects = state.projects.filter(p => p.id !== id);
        if (state.currentProject?.id === id) state.currentProject = null;
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = axios.isAxiosError(error) ? 'Failed to delete project' : error instanceof Error ? error.message : 'Failed to delete project';
      }));
    }
  },
  fetchTimeline: async (projectId) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));
    
    try {
      const response = await axios.get(`${API_BASE}/${projectId}/timeline`);
      set(produce((state: ProjectState) => {
        state.timeline = response.data;
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = axios.isAxiosError(error) ? 'Failed to fetch timeline' : error instanceof Error ? error.message : 'Failed to fetch timeline';
      }));
    }
  },
  addTimelineEvent: async (data) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));
    try {
      const response = await axios.post(`${API_BASE}/${data.projectId}/timeline`, data);
      set(produce((state: ProjectState) => {
        state.timeline.push(response.data);
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = axios.isAxiosError(error) ? 'Failed to add timeline event' : error instanceof Error ? error.message : 'Failed to add timeline event';
      }));
    }
  },
}));
const store = {
  ...projectStore,
  getProjects: async () => {
    await projectStore.getState().fetchProjects();
    return projectStore.getState().projects;
  },
  getStats: async () => {
    const projects = projectStore.getState().projects;
    return {
      totalTasks: projects.length * 10,
      completedTasks: projects.length * 7,
    };
  },
  getRecentActivities: async () => {
    const projects = projectStore.getState().projects;
    return projects.slice(0, 5).map(p => ({
      id: p.id,
      title: p.name,
      date: p.startDate,
      status: p.status === 'completed' ? 'completed' : 'in-progress',
    }));
  },
  getProjectById: async (id: string) => {
    const project = projectStore.getState().projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    return {
      ...project,
      crewMembers: [],
      equipment: [],
    };
  },
};
export default store;
