import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Client, Interaction } from '../types';
import * as crmApi from '../api/crm';

interface CrmState {
  clients: Client[];
  interactions: Interaction[];
  isLoading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  fetchInteractions: (clientId: string) => Promise<void>;
}

export const useCrmStore = create<CrmState>()(immer((set) => ({
  clients: [],
  interactions: [],
  isLoading: false,
  error: null,
  fetchClients: async () => {
    try {
      set({ isLoading: true });
      const clients = await crmApi.getClients();
      set({ clients, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  fetchInteractions: async (clientId) => {
    try {
      set({ isLoading: true });
      const interactions = await crmApi.getInteractions(clientId);
      set({ interactions, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
})));

