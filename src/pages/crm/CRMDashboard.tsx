Here's a comprehensive CRMDashboard component:

```typescript
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useCrmStore } from '@/stores/crmStore';
import { CustomerCard } from '@/components/CustomerCard';
import { LeadFunnelChart } from '@/components/LeadFunnelChart';
import { QuickAddCustomerModal } from '@/components/QuickAddCustomerModal';
import { 
  Card, 
  Table, 
  TableHeader, 
  TableBody, 
  TableColumn, 
  TableRow, 
  Spinner 
} from '@nextui-org/react';

interface CustomerStats {
  total: number;
  newThisMonth: number;
  activeCustomers: number;
}

const CRMDashboard: React.FC = observer(() => {
  const crmStore = useCrmStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customerStats, setCustomerStats] = useState<CustomerStats>({
    total: 0,
    newThisMonth: 0,
    activeCustomers: 0
  });

  // Fetch initial dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        await crmStore.fetchCustomers();
        await crmStore.fetchRecentActivities();
        
        // Calculate customer stats
        setCustomerStats({
          total: crmStore.customers.length,
          newThisMonth: crmStore.getNewCustomersThisMonth(),
          activeCustomers: crmStore.getActiveCustomers()
        });
      } catch (error) {
        console.error('Dashboard data fetch failed', error);
      }
    };

    fetchDashboardData();
  }, [crmStore]);

  // Render loading state
  if (crmStore.isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Customer Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-xl font-semibold">Total Customers</h3>
          <p className="text-3xl">{customerStats.total}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-xl font-semibold">New This Month</h3>
          <p className="text-3xl">{customerStats.newThisMonth}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-xl font-semibold">Active Customers</h3>
          <p className="text-3xl">{customerStats.activeCustomers}</p>
        </Card>
      </div>

      {/* Lead Funnel & Recent Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="text-2xl font-bold mb-4">Lead Funnel</h2>
          <LeadFunnelChart data={crmStore.leadFunnelData} />
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Recent Activities</h2>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary"
            >
              + Add Customer
            </button>
          </div>
          <Table>
            <TableHeader>
              <TableColumn>Customer</TableColumn>
              <TableColumn>Activity</TableColumn>
              <TableColumn>Date</TableColumn>
            </TableHeader>
            <TableBody>
              {crmStore.recentActivities.map(activity => (
                <TableRow key={activity.id}>
                  <TableColumn>{activity.customerName}</TableColumn>
                  <TableColumn>{activity.type}</TableColumn>
                  <TableColumn>{activity.date}</TableColumn>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Quick Add Customer Modal */}
      <QuickAddCustomerModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCustomer={crmStore.addCustomer}
      />
    </div>
  );
});

export default CRMDashboard;
```

Key Features:
- MobX store integration
- TypeScript typing
- Responsive grid layout
- Loading state handling
- Error boundary placeholder
- Modal for quick customer addition
- Performance-optimized with observer pattern
- Modular component design

Note: This assumes corresponding store methods and component implementations exist in your project structure.
