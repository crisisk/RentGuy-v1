import apiClient from './client';

// Mock data for initial integration
const mockOverview = {
    totalProjects: 50,
    activeProjects: 12,
    totalRevenue: 150000,
    profitMargin: 0.35,
};

const mockRevenueAnalysis = [
    { period: 'Week 40', revenue: 15000 },
    { period: 'Week 41', revenue: 18000 },
    { period: 'Week 42', revenue: 22000 },
];

export const reportsAPI = {
  getOverview: async (dateRange: { start: string; end: string }) => {
    // const response = await apiClient.get('/reports/overview', { params: dateRange });
    // return response.data;
    return mockOverview;
  },

  getRevenueAnalysis: async (period: 'week' | 'month' | 'quarter' | 'year') => {
    // const response = await apiClient.get('/reports/revenue', { params: { period } });
    // return response.data;
    return mockRevenueAnalysis;
  },

  getCrewPerformance: async () => {
    // const response = await apiClient.get('/reports/crew-performance');
    // return response.data;
    return [
        { name: 'John Doe', hours: 160, rating: 4.5 },
        { name: 'Jane Smith', hours: 140, rating: 4.8 },
    ];
  },

  getEquipmentUtilization: async () => {
    // const response = await apiClient.get('/reports/equipment-utilization');
    // return response.data;
    return [
        { name: 'Speaker Set A', utilization: 0.85 },
        { name: 'LED Screen 5x3', utilization: 0.60 },
    ];
  },

  exportToExcel: async (reportType: string, filters: any): Promise<Blob> => {
    // const response = await apiClient.post(`/reports/${reportType}/export`, filters, {
    //   responseType: 'blob',
    // });
    // return response.data;
    
    // Mock implementation: return a dummy blob
    const mockExcel = `Report Type: ${reportType}\nData: Mock Data Exported`;
    return new Blob([mockExcel], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },
};

