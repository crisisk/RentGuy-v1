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

export const useCrewStore = create<CrewState>()(immer((set) => ({
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

