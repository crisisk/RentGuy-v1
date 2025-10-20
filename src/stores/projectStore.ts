import { create } from 'zustand'
import { produce } from 'immer'
import { api } from '@infra/http/api'
import { mapUnknownToApiError } from '@errors'
import type { PersonaKey, PersonaPreset } from '@rg-types/projectTypes'

export interface Project {
  id: string
  name: string
  description: string
  status: 'planned' | 'in-progress' | 'completed'
  startDate: string
  endDate: string
}

export interface TimelineEvent {
  id: string
  projectId: string
  title: string
  description: string
  date: string
  type: 'milestone' | 'deadline' | 'event'
}

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  timeline: TimelineEvent[]
  loading: boolean
  error: string | null

  fetchProjects: () => Promise<void>
  createProject: (data: Omit<Project, 'id'>) => Promise<void>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  fetchTimeline: (projectId: string) => Promise<void>
  addTimelineEvent: (data: Omit<TimelineEvent, 'id'>) => Promise<void>
}

const PROJECTS_BASE_PATH = '/api/v1/projects'

function resolveErrorMessage(error: unknown): string {
  return mapUnknownToApiError(error).message
}

export const projectStore = create<ProjectState>(set => ({
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
      const response = await api.get<Project[]>(PROJECTS_BASE_PATH);
      set(produce((state: ProjectState) => {
        state.projects = Array.isArray(response.data) ? response.data : [];
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = resolveErrorMessage(error);
      }));
    }
  },
  createProject: async (data) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));

    try {
      const response = await api.post<Project>(PROJECTS_BASE_PATH, data);
      set(produce((state: ProjectState) => {
        if (response.data) {
          state.projects.push(response.data);
        }
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = resolveErrorMessage(error);
      }));
    }
  },
  updateProject: async (id, data) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));

    try {
      const response = await api.put<Project>(`${PROJECTS_BASE_PATH}/${id}`, data);
      set(produce((state: ProjectState) => {
        const index = state.projects.findIndex(p => p.id === id);
        if (response.data) {
          if (index !== -1) state.projects[index] = response.data;
          if (state.currentProject?.id === id) state.currentProject = response.data;
        }
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = resolveErrorMessage(error);
      }));
    }
  },
  deleteProject: async (id) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));

    try {
      await api.delete(`${PROJECTS_BASE_PATH}/${id}`);
      set(produce((state: ProjectState) => {
        state.projects = state.projects.filter(p => p.id !== id);
        if (state.currentProject?.id === id) state.currentProject = null;
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = resolveErrorMessage(error);
      }));
    }
  },
  fetchTimeline: async (projectId) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));

    try {
      const response = await api.get<TimelineEvent[]>(`${PROJECTS_BASE_PATH}/${projectId}/timeline`);
      set(produce((state: ProjectState) => {
        state.timeline = Array.isArray(response.data) ? response.data : [];
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = resolveErrorMessage(error);
      }));
    }
  },
  addTimelineEvent: async (data) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));
    try {
      const response = await api.post<TimelineEvent>(`${PROJECTS_BASE_PATH}/${data.projectId}/timeline`, data);
      set(produce((state: ProjectState) => {
        if (response.data) {
          state.timeline.push(response.data);
        }
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = resolveErrorMessage(error);
      }));
    }
  },
}));

export const defaultProjectPresets: Record<PersonaKey, PersonaPreset> = {
  all: {
    label: 'Alle persona\'s',
    description: 'Volledige planning zonder filters voor gezamenlijke UAT-sessies.',
    statusFilter: 'all',
    riskFilter: 'all',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'all',
  },
  bart: {
    label: 'Bart · Operations lead',
    description: 'Actieve projecten en voorraadrisico\'s in één overzicht voor directe bijsturing.',
    statusFilter: 'active',
    riskFilter: 'warning',
    sortKey: 'start_offset',
    sortDir: 'asc',
    timeFilter: 'next14',
  },
  anna: {
    label: 'Anna · Planner',
    description: 'Komende projecten chronologisch om draaiboeken te verfijnen.',
    statusFilter: 'upcoming',
    sortKey: 'start_offset',
    sortDir: 'asc',
    timeFilter: 'next30',
  },
  tom: {
    label: 'Tom · Technicus',
    description: 'Focus op lopende producties voor shifts en onsite-briefings.',
    statusFilter: 'active',
    riskFilter: 'ok',
    sortKey: 'start_offset',
    sortDir: 'asc',
    timeFilter: 'today',
  },
  carla: {
    label: 'Carla · Front-office',
    description: 'Sorteer op klantnaam om vragen vanuit klantenservice snel te beantwoorden.',
    statusFilter: 'upcoming',
    sortKey: 'client',
    sortDir: 'asc',
    timeFilter: 'next30',
  },
  frank: {
    label: 'Frank · Finance',
    description: 'Afgeronde projecten voor facturatiecontroles en cashflow updates.',
    statusFilter: 'completed',
    sortKey: 'end',
    sortDir: 'desc',
    timeFilter: 'past30',
  },
  sven: {
    label: 'Sven · System admin',
    description: 'Escalaties en kritieke risico\'s prioriteren voor governance en alerts.',
    statusFilter: 'all',
    riskFilter: 'critical',
    sortKey: 'risk',
    sortDir: 'desc',
    timeFilter: 'all',
  },
  isabelle: {
    label: 'Isabelle · International coordinator',
    description: 'Komende internationale events ruim vooraf inzichtelijk houden.',
    statusFilter: 'upcoming',
    sortKey: 'start_offset',
    sortDir: 'asc',
    timeFilter: 'next30',
  },
  peter: {
    label: 'Peter · Power-user',
    description: 'Voorraadspanning en statusovergangen monitoren voor automatiseringen.',
    riskFilter: 'warning',
    sortKey: 'status',
    sortDir: 'asc',
    timeFilter: 'all',
  },
  nadia: {
    label: 'Nadia · Nieuw teamlid',
    description: 'Beperk zicht tot eenvoudig komende projecten voor een zachte onboarding.',
    statusFilter: 'upcoming',
    sortKey: 'start_offset',
    sortDir: 'asc',
    timeFilter: 'next14',
  },
  david: {
    label: 'David · Developer',
    description: 'Alle statussen zichtbaar houden om API-extensies te testen.',
    statusFilter: 'all',
    sortKey: 'status',
    sortDir: 'asc',
    timeFilter: 'all',
  },
}

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
