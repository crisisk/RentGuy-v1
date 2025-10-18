import apiClient from './client';

// Mock data for initial integration
const mockCompanyInfo = {
    name: 'RentGuy Enterprise',
    address: '123 Main St, Amsterdam',
    vat: 'NL123456789B01',
};

const mockIntegrations = [
    { name: 'Exact Online', connected: true },
    { name: 'AFAS', connected: false },
    { name: 'Mollie', connected: true },
];

const mockNotifications = {
    email: true,
    sms: false,
    push: true,
};

export const settingsAPI = {
  getCompanyInfo: async () => {
    // const response = await apiClient.get('/settings/company');
    // return response.data;
    return mockCompanyInfo;
  },

  updateCompanyInfo: async (info: any) => {
    // const response = await apiClient.patch('/settings/company', info);
    // return response.data;
    Object.assign(mockCompanyInfo, info);
    return mockCompanyInfo;
  },

  getIntegrations: async () => {
    // const response = await apiClient.get('/settings/integrations');
    // return response.data;
    return mockIntegrations;
  },

  connectIntegration: async (provider: string, credentials: any) => {
    // const response = await apiClient.post(`/settings/integrations/${provider}/connect`, credentials);
    // return response.data;
    const integration = mockIntegrations.find(i => i.name === provider);
    if (integration) integration.connected = true;
    return { success: true };
  },

  disconnectIntegration: async (provider: string) => {
    // await apiClient.post(`/settings/integrations/${provider}/disconnect`);
    const integration = mockIntegrations.find(i => i.name === provider);
    if (integration) integration.connected = false;
  },

  getNotificationSettings: async () => {
    // const response = await apiClient.get('/settings/notifications');
    // return response.data;
    return mockNotifications;
  },

  updateNotificationSettings: async (settings: any) => {
    // const response = await apiClient.patch('/settings/notifications', settings);
    // return response.data;
    Object.assign(mockNotifications, settings);
    return mockNotifications;
  },
};

