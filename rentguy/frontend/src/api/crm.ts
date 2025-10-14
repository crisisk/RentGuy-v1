import { Client, Interaction } from '../types';

const mockClients: Client[] = [
  { id: '1', name: 'Client A', email: 'clienta@example.com', segment: 'vip' },
  { id: '2', name: 'Client B', email: 'clientb@example.com', segment: 'regular' },
];

const mockInteractions: Interaction[] = [
  { id: '1', type: 'call', timestamp: '2025-10-14T10:00:00Z', content: 'Initial call' },
  { id: '2', type: 'email', timestamp: '2025-10-14T11:00:00Z', content: 'Follow-up email' },
];

export const getClients = async (): Promise<Client[]> => {
  // const response = await apiClient.get('/clients');
  // return response.data;
  return mockClients;
};

export const getInteractions = async (clientId: string): Promise<Interaction[]> => {
  // const response = await apiClient.get(`/clients/${clientId}/interactions`);
  // return response.data;
  return mockInteractions;
};

