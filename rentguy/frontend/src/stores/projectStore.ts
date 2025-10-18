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

