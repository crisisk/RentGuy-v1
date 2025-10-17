// crewStore.ts
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
      const response = await fetch('http://localhost:8000/api/crew/members');
      if (!response.ok) throw new Error('Failed to fetch crew');
      const crew = await response.json();
      
      set(produce((state: CrewState) => {
        state.crew = crew;
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: CrewState) => {
        state.error = error instanceof Error ? error.message : 'Unknown error';
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
      const response = await fetch('http://localhost:8000/api/crew/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create crew member');
      const newMember = await response.json();
      
      set(produce((state: CrewState) => {
        state.crew.push(newMember);
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: CrewState) => {
        state.error = error instanceof Error ? error.message : 'Unknown error';
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
      const response = await fetch('http://localhost:8000/api/crew/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to assign shift');
      const newShift = await response.json();
      
      set(produce((state: CrewState) => {
        state.shifts.push(newShift);
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: CrewState) => {
        state.error = error instanceof Error ? error.message : 'Unknown error';
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
      const response = await fetch('http://localhost:8000/api/crew/time-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to submit time approval');
      const newApproval = await response.json();
      
      set(produce((state: CrewState) => {
        state.timeApprovals.push(newApproval);
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: CrewState) => {
        state.error = error instanceof Error ? error.message : 'Unknown error';
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
      const response = await fetch(`http://localhost:8000/api/crew/time-approvals/${id}/approve`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to approve time');
      
      set(produce((state: CrewState) => {
        const approval = state.timeApprovals.find(a => a.id === id);
        if (approval) approval.status = 'approved';
        state.loading = false;
      }));
    } catch (error) {
      set(produce((state: CrewState) => {
        state.error = error instanceof Error ? error.message : 'Unknown error';
        state.loading = false;
      }));
    }
  },
}));

export default useCrewStore;
