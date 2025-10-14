import apiClient from './client';
import { Equipment, MaintenanceRecord } from '../types';

// Mock data for initial integration
const mockEquipment: Equipment[] = [
    { id: 'e1', name: 'Speaker Set A', category: 'Audio', status: 'in_use', warehouseId: 'w1' },
    { id: 'e2', name: 'LED Screen 5x3', category: 'Video', status: 'available', warehouseId: 'w1' },
    { id: 'e3', name: 'Truss 3m', category: 'Rigging', status: 'maintenance', warehouseId: 'w2' },
];

const mockMaintenance: MaintenanceRecord[] = [
    { id: 'm1', equipmentId: 'e3', date: '2025-10-20', notes: 'Annual checkup' },
];

export const equipmentAPI = {
  getAll: async (filters?: {
    category?: string;
    status?: 'available' | 'in_use' | 'maintenance' | 'retired';
    warehouseId?: string;
  }): Promise<Equipment[]> => {
    // const response = await apiClient.get('/equipment', { params: filters });
    // return response.data;
    
    let filteredEquipment = mockEquipment;
    if (filters?.status) {
        filteredEquipment = filteredEquipment.filter(e => e.status === filters.status);
    }
    return filteredEquipment;
  },

  getById: async (id: string): Promise<Equipment> => {
    // const response = await apiClient.get(`/equipment/${id}`);
    // return response.data;
    const item = mockEquipment.find(e => e.id === id);
    if (!item) throw new Error('Equipment not found');
    return item;
  },

  checkAvailability: async (equipmentId: string, startDate: string, endDate: string) => {
    // const response = await apiClient.get(`/equipment/${equipmentId}/availability`, {
    //   params: { startDate, endDate },
    // });
    // return response.data;
    
    // Mock: always available unless it's the one in maintenance
    return equipmentId === 'e3' ? { available: false, reason: 'Scheduled maintenance' } : { available: true };
  },

  // Maintenance
  getMaintenanceSchedule: async (): Promise<MaintenanceRecord[]> => {
    // const response = await apiClient.get('/equipment/maintenance');
    // return response.data;
    return mockMaintenance;
  },

  scheduleMaintenance: async (equipmentId: string, date: string, notes: string) => {
    // const response = await apiClient.post('/equipment/maintenance', {
    //   equipmentId,
    //   date,
    //   notes,
    // });
    // return response.data;
    console.log(`Mock: Scheduled maintenance for ${equipmentId} on ${date}`);
    return { success: true };
  },

  // Barcode scanning (voor Sprint 6)
  scanBarcode: async (barcode: string) => {
    // const response = await apiClient.get(`/equipment/scan/${barcode}`);
    // return response.data;
    
    // Mock: return equipment e2 for any scan
    return mockEquipment.find(e => e.id === 'e2');
  },
};

