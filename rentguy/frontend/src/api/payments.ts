import apiClient from './client';

export const paymentsAPI = {
  createPayment: async (invoiceId: string, method: string) => {
    // const response = await apiClient.post('/payments/mollie/create', {
    //   invoiceId,
    //   method,
    // });
    // return response.data;
    
    // Mock response
    return {
        checkoutUrl: `https://mollie.com/checkout/${invoiceId}`,
        paymentId: `pay_${invoiceId}_${Date.now()}`,
    };
  },

  getPaymentStatus: async (paymentId: string) => {
    // const response = await apiClient.get(`/payments/mollie/${paymentId}/status`);
    // return response.data;
    
    // Mock response
    return {
        status: 'paid',
        amount: 15000,
        currency: 'EUR',
    };
  },

  getTransactions: async (filters?: {
    status?: 'paid' | 'pending' | 'failed' | 'refunded';
    startDate?: string;
    endDate?: string;
  }) => {
    // const response = await apiClient.get('/payments/transactions', { params: filters });
    // return response.data;
    
    // Mock response
    return [
        { id: 't1', amount: 15000, status: 'paid', date: '2025-10-14' },
        { id: 't2', amount: 5000, status: 'refunded', date: '2025-10-10' },
    ];
  },

  refund: async (paymentId: string, amount?: number) => {
    // const response = await apiClient.post(`/payments/mollie/${paymentId}/refund`, { amount });
    // return response.data;
    
    console.log(`Mock: Refunded ${amount || 'full amount'} for payment ${paymentId}`);
    return { success: true };
  },
};

