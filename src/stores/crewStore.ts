import axios from 'axios';
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
      const response = await axios.get('http://localhost:8000/api/v1/crew/members');
      set(produce((state: CrewState) => {
        state.crew = response.data;
        state.loading = false;
      }));
    } catch (error) {
      let errorMessage = 'Failed to fetch crew';
      if (axios.isAxiosError(error)) {
        if (!error.response) errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      set(produce((state: CrewState) => {
        state.error = errorMessage;
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
      const response = await axios.post('http://localhost:8000/api/v1/crew/members', data);
      set(produce((state: CrewState) => {
        state.crew.push(response.data);
        state.loading = false;
      }));
    } catch (error) {
      let errorMessage = 'Failed to create crew member';
      if (axios.isAxiosError(error)) {
        if (!error.response) errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      set(produce((state: CrewState) => {
        state.error = errorMessage;
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
      const response = await axios.post('http://localhost:8000/api/v1/crew/shifts', data);
      set(produce((state: CrewState) => {
        state.shifts.push(response.data);
        state.loading = false;
      }));
    } catch (error) {
      let errorMessage = 'Failed to assign shift';
      if (axios.isAxiosError(error)) {
        if (!error.response) errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      set(produce((state: CrewState) => {
        state.error = errorMessage;
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
      const response = await axios.post('http://localhost:8000/api/v1/crew/time-approvals', data);
      set(produce((state: CrewState) => {
        state.timeApprovals.push(response.data);
        state.loading = false;
      }));
    } catch (error) {
      let errorMessage = 'Failed to submit time approval';
      if (axios.isAxiosError(error)) {
        if (!error.response) errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      set(produce((state: CrewState) => {
        state.error = errorMessage;
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
      await axios.patch(`http://localhost:8000/api/v1/crew/time-approvals/${id}/approve`);
      set(produce((state: CrewState) => {
        const approval = state.timeApprovals.find(a => a.id === id);
        if (approval) approval.status = 'approved';
        state.loading = false;
      }));
    } catch (error) {
      let errorMessage = 'Failed to approve time';
      if (axios.isAxiosError(error)) {
        if (!error.response) errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      set(produce((state: CrewState) => {
        state.error = errorMessage;
        state.loading = false;
      }));
    }
  },
}));
export default useCrewStore;
