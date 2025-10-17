import { create } from 'zustand';
import { produce } from 'immer';

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

const API_BASE = 'http://localhost:8000/api/projects';

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
      const response = await fetch(`${API_BASE}`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const projects = await response.json();
      
      set(produce((state: ProjectState) => {
        state.projects = projects;
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = error instanceof Error ? error.message : 'Failed to fetch projects';
      }));
    }
  },

  createProject: async (data) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));
    
    try {
      const response = await fetch(`${API_BASE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create project');
      const newProject = await response.json();
      
      set(produce((state: ProjectState) => {
        state.projects.push(newProject);
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = error instanceof Error ? error.message : 'Failed to create project';
      }));
    }
  },

  updateProject: async (id, data) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));
    
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update project');
      const updatedProject = await response.json();
      
      set(produce((state: ProjectState) => {
        const index = state.projects.findIndex(p => p.id === id);
        if (index !== -1) state.projects[index] = updatedProject;
        if (state.currentProject?.id === id) state.currentProject = updatedProject;
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = error instanceof Error ? error.message : 'Failed to update project';
      }));
    }
  },

  deleteProject: async (id) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));
    
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete project');
      
      set(produce((state: ProjectState) => {
        state.projects = state.projects.filter(p => p.id !== id);
        if (state.currentProject?.id === id) state.currentProject = null;
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = error instanceof Error ? error.message : 'Failed to delete project';
      }));
    }
  },

  fetchTimeline: async (projectId) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));
    
    try {
      const response = await fetch(`${API_BASE}/${projectId}/timeline`);
      if (!response.ok) throw new Error('Failed to fetch timeline');
      const timeline = await response.json();
      
      set(produce((state: ProjectState) => {
        state.timeline = timeline;
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = error instanceof Error ? error.message : 'Failed to fetch timeline';
      }));
    }
  },

  addTimelineEvent: async (data) => {
    set(produce((state: ProjectState) => {
      state.loading = true;
      state.error = null;
    }));
    
    try {
      const response = await fetch(`${API_BASE}/${data.projectId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add timeline event');
      const newEvent = await response.json();
      
      set(produce((state: ProjectState) => {
        state.timeline.push(newEvent);
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: ProjectState) => {
        state.loading = false;
        state.error = error instanceof Error ? error.message : 'Failed to add timeline event';
      }));
    }
  },
}));
