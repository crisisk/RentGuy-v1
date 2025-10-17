import { create } from 'zustand';
import { produce } from 'immer';
import axios from 'axios';
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
