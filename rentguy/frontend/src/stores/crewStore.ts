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
      const teamMembers = await crewApi.getAll();
      set({ teamMembers, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  fetchSchedules: async (date) => {
    try {
      set({ isLoading: true });
      const timeEntries = await crewApi.getTimeEntries({ startDate: date.toISOString() });
      const schedules: Schedule[] = timeEntries.map(entry => ({
        id: entry.id,
        teamMemberId: entry.crewId,
        date: entry.startTime.split('T')[0],
        shift: `${entry.startTime.split('T')[1].substring(0, 5)} - ${entry.endTime.split('T')[1].substring(0, 5)}`,
      }));
      set({ schedules, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
})));

