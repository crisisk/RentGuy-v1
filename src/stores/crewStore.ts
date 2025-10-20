import { api } from '@infra/http/api';
import { mapUnknownToApiError } from '@errors';
import { create } from 'zustand';
import { produce } from 'immer';
export interface CrewMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  createdAt: Date;
}
export interface Shift {
  id: string;
  crewMemberId: string;
  startTime: Date;
  endTime: Date;
  location: string;
  description: string;
}
export interface TimeApproval {
  id: string;
  shiftId: string;
  hours: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
}
interface CrewState {
  crew: CrewMember[];
  shifts: Shift[];
  timeApprovals: TimeApproval[];
  loading: boolean;
  error: string | null;
}
interface CrewActions {
  fetchCrew: () => Promise<void>;
  createCrewMember: (data: Omit<CrewMember, 'id' | 'createdAt'>) => Promise<void>;
  assignShift: (data: Omit<Shift, 'id'>) => Promise<void>;
  submitTimeApproval: (data: Omit<TimeApproval, 'id' | 'status' | 'submittedAt'>) => Promise<void>;
  approveTime: (id: string) => Promise<void>;
}
const CREW_BASE_PATH = '/api/v1/crew';

function resolveError(error: unknown): string {
  return mapUnknownToApiError(error).message;
}

const useCrewStore = create<CrewState & CrewActions>((set) => ({
  crew: [],
  shifts: [],
  timeApprovals: [],
  loading: false,
  error: null,
  fetchCrew: async () => {
    set(produce((state: CrewState) => {
      state.loading = true;
      state.error = null;
    }));
    
    try {
      const response = await api.get(`${CREW_BASE_PATH}/members`);
      set(produce((state: CrewState) => {
        state.crew = Array.isArray(response.data) ? response.data : [];
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: CrewState) => {
        state.error = resolveError(error);
        state.loading = false;
      }));
    }
  },
  createCrewMember: async (data) => {
    set(produce((state: CrewState) => {
      state.loading = true;
      state.error = null;
    }));
    try {
      const response = await api.post(`${CREW_BASE_PATH}/members`, data);
      set(produce((state: CrewState) => {
        if (response.data) {
          state.crew.push(response.data);
        }
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: CrewState) => {
        state.error = resolveError(error);
        state.loading = false;
      }));
    }
  },
  assignShift: async (data) => {
    set(produce((state: CrewState) => {
      state.loading = true;
      state.error = null;
    }));
    try {
      const response = await api.post(`${CREW_BASE_PATH}/shifts`, data);
      set(produce((state: CrewState) => {
        if (response.data) {
          state.shifts.push(response.data);
        }
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: CrewState) => {
        state.error = resolveError(error);
        state.loading = false;
      }));
    }
  },
  submitTimeApproval: async (data) => {
    set(produce((state: CrewState) => {
      state.loading = true;
      state.error = null;
    }));
    try {
      const response = await api.post(`${CREW_BASE_PATH}/time-approvals`, data);
      set(produce((state: CrewState) => {
        if (response.data) {
          state.timeApprovals.push(response.data);
        }
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: CrewState) => {
        state.error = resolveError(error);
        state.loading = false;
      }));
    }
  },
  approveTime: async (id) => {
    set(produce((state: CrewState) => {
      state.loading = true;
      state.error = null;
    }));
    try {
      await api.patch(`${CREW_BASE_PATH}/time-approvals/${id}/approve`);
      set(produce((state: CrewState) => {
        const approval = state.timeApprovals.find(a => a.id === id);
        if (approval) approval.status = 'approved';
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: CrewState) => {
        state.error = resolveError(error);
        state.loading = false;
      }));
    }
  },
}));
export default useCrewStore;
