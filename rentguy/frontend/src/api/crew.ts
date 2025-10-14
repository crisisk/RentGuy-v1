import apiClient from './client';
import { TeamMember, TimeEntry } from '../types';

// Mock data for initial integration
const mockCrew: TeamMember[] = [
    { id: 'c1', name: 'John Doe', email: 'john@rg.com', role: 'crew', skills: ['Audio', 'Lighting'], location: { address: 'Amsterdam', latitude: 52.37, longitude: 4.89 } },
    { id: 'c2', name: 'Jane Smith', email: 'jane@rg.com', role: 'manager', skills: ['Video', 'Project Management'], location: { address: 'Utrecht', latitude: 52.09, longitude: 5.12 } },
];

const mockTimeEntries: TimeEntry[] = [
    { id: 't1', crewId: 'c1', projectId: 'p1', startTime: '2025-10-10T08:00:00Z', endTime: '2025-10-10T16:00:00Z', duration: 28800, status: 'pending' },
    { id: 't2', crewId: 'c2', projectId: 'p2', startTime: '2025-10-11T09:00:00Z', endTime: '2025-10-11T17:00:00Z', duration: 28800, status: 'approved' },
];

export const crewAPI = {
  getAll: async (): Promise<TeamMember[]> => {
    // const response = await apiClient.get('/crew');
    // return response.data;
    return mockCrew;
  },

  getById: async (id: string): Promise<TeamMember> => {
    // const response = await apiClient.get(`/crew/${id}`);
    // return response.data;
    const member = mockCrew.find(c => c.id === id);
    if (!member) throw new Error('Crew member not found');
    return member;
  },

  updateAvailability: async (crewId: string, availability: any) => {
    // const response = await apiClient.patch(`/crew/${crewId}/availability`, availability);
    // return response.data;
    console.log(`Mock: Updated availability for ${crewId}`);
    return { success: true };
  },

  // Time Registration
  getTimeEntries: async (filters: {
    crewId?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
    status?: 'pending' | 'approved' | 'rejected';
  }): Promise<TimeEntry[]> => {
    // const response = await apiClient.get('/time-entries', { params: filters });
    // return response.data;
    let filteredEntries = mockTimeEntries;
    if (filters?.status) {
        filteredEntries = filteredEntries.filter(e => e.status === filters.status);
    }
    return filteredEntries;
  },

  approveTimeEntry: async (entryId: string): Promise<void> => {
    // await apiClient.post(`/time-entries/${entryId}/approve`);
    const entry = mockTimeEntries.find(e => e.id === entryId);
    if (entry) entry.status = 'approved';
  },

  rejectTimeEntry: async (entryId: string, reason: string): Promise<void> => {
    // await apiClient.post(`/time-entries/${entryId}/reject`, { reason });
    const entry = mockTimeEntries.find(e => e.id === entryId);
    if (entry) entry.status = 'rejected';
  },

  bulkApprove: async (entryIds: string[]): Promise<void> => {
    // await apiClient.post('/time-entries/bulk-approve', { entryIds });
    entryIds.forEach(id => {
        const entry = mockTimeEntries.find(e => e.id === id);
        if (entry) entry.status = 'approved';
    });
  },

  exportToAFAS: async (entryIds: string[]): Promise<Blob> => {
    // const response = await apiClient.post('/time-entries/export/afas', 
    //   { entryIds },
    //   { responseType: 'blob' }
    // );
    // return response.data;
    
    // Mock implementation: return a dummy blob
    const mockCsv = "EntryID,CrewID,Hours\nt1,c1,8\nt2,c2,8";
    return new Blob([mockCsv], { type: 'text/csv' });
  },
};

