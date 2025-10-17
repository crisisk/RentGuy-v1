Here's a comprehensive FinanceDashboard component:

```typescript
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { useFinanceStore } from '@/stores/financeStore';
import { FinancialMetrics, Invoice } from '@/types/finance';

import { 
  Card, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableCell 
} from '@/components/ui';

import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';

const FinanceDashboard: React.FC = observer(() => {
  const financeStore = useFinanceStore();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        await financeStore.fetchDashboardMetrics();
      } catch (err) {
        setError('Failed to load financial data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [financeStore]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;

  const renderRevenueChart = () => (
    <Card className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Monthly Revenue</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={financeStore.revenueData}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#3182ce" 
            strokeWidth={2} 
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderPendingInvoices = () => (
    <Card className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Pending Invoices</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Invoice #</TableCell>
            <TableCell>Client</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {financeStore.pendingInvoices.map((invoice: Invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.number}</TableCell>
              <TableCell>{invoice.clientName}</TableCell>
              <TableCell>${invoice.amount.toFixed(2)}</TableCell>
              <TableCell>
                <span className="text-yellow-500">{invoice.status}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  const renderFinancialSummary = () => {
    const metrics: FinancialMetrics = financeStore.financialMetrics;
    return (
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-100">
          <h3>Total Revenue</h3>
          <p>${metrics.totalRevenue.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-green-100">
          <h3>Profit</h3>
          <p>${metrics.profit.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-red-100">
          <h3>Expenses</h3>
          <p>${metrics.expenses.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-purple-100">
          <h3>Outstanding</h3>
          <p>${metrics.outstandingInvoices.toLocaleString()}</p>
        </Card>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold mb-6">Finance Dashboard</h1>
        
        {renderFinancialSummary()}
        
        <div className="grid grid-cols-2 gap-6">
          {renderRevenueChart()}
          {renderPendingInvoices()}
        </div>
      </div>
    </ErrorBoundary>
  );
});

export default FinanceDashboard;
```

Key Features:
- MobX store integration
- Recharts for revenue visualization
- Responsive Tailwind CSS layout
- Error and loading state management
- TypeScript typing
- Modular component design
- Performance optimized with observer pattern

Note: This assumes corresponding store, type, and UI component implementations exist in your project structure.
