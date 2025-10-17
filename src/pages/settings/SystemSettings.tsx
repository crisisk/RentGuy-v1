Here's a comprehensive SystemSettings component:

```typescript
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useAdminStore } from '@/stores/adminStore';
import { useAuthStore } from '@/stores/authStore';

import { 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel, 
  Button, 
  Spinner, 
  Alert 
} from '@/components/ui';

import GeneralSettingsForm from './forms/GeneralSettingsForm';
import EmailSettingsForm from './forms/EmailSettingsForm';
import SecuritySettingsForm from './forms/SecuritySettingsForm';
import IntegrationsSettingsForm from './forms/IntegrationsSettingsForm';

interface SystemSettingsProps {
  className?: string;
}

const SystemSettings: React.FC<SystemSettingsProps> = observer(({ className = '' }) => {
  const adminStore = useAdminStore();
  const authStore = useAuthStore();

  const [activeTab, setActiveTab] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        await adminStore.fetchSystemSettings();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load system settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [adminStore]);

  const handleSaveSettings = async () => {
    try {
      await adminStore.updateSystemSettings();
      // Optional: Show success toast
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert 
        type="error" 
        message={error} 
        onClose={() => setError(null)} 
      />
    );
  }

  return (
    <div className={`system-settings container mx-auto p-6 ${className}`}>
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      <Tabs 
        selectedIndex={activeTab} 
        onSelect={(index) => setActiveTab(index)}
      >
        <TabList className="mb-6 border-b">
          <Tab>General</Tab>
          <Tab>Email</Tab>
          <Tab>Security</Tab>
          <Tab>Integrations</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <GeneralSettingsForm 
              settings={adminStore.systemSettings.general} 
              onUpdate={adminStore.updateGeneralSettings}
            />
          </TabPanel>
          
          <TabPanel>
            <EmailSettingsForm 
              settings={adminStore.systemSettings.email} 
              onUpdate={adminStore.updateEmailSettings}
            />
          </TabPanel>
          
          <TabPanel>
            <SecuritySettingsForm 
              settings={adminStore.systemSettings.security} 
              onUpdate={adminStore.updateSecuritySettings}
            />
          </TabPanel>
          
          <TabPanel>
            <IntegrationsSettingsForm 
              settings={adminStore.systemSettings.integrations} 
              onUpdate={adminStore.updateIntegrationSettings}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <div className="mt-8 flex justify-end space-x-4">
        <Button 
          variant="secondary" 
          onClick={() => adminStore.resetSystemSettings()}
        >
          Reset to Default
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSaveSettings}
          disabled={!adminStore.systemSettingsChanged}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
});

export default SystemSettings;
```

Key Features:
- Modular design with separate form components
- MobX store integration with observer pattern
- Comprehensive error and loading state handling
- Responsive Tailwind CSS layout
- TypeScript type safety
- Flexible configuration with optional className prop
- Tabs for different setting categories
- Save/Reset functionality

Note: This assumes you have corresponding store methods and UI components. You'll need to implement:
- adminStore methods
- Form components
- UI components like Tabs, Button, Spinner, Alert
- Proper TypeScript interfaces for settings

Would you like me to elaborate on any specific part of the implementation?
