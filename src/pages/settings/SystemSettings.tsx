import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminStore from '../../stores/adminStore';

type SettingsTab = 'general' | 'email' | 'security';

interface SystemSettingsProps {}

const SystemSettings: React.FC<SystemSettingsProps> = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>({
    general: {},
    email: {},
    security: {}
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const fetchedSettings = await adminStore.getSystemSettings();
        setSettings(fetchedSettings);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleUpdateSettings = async () => {
    try {
      setLoading(true);
      await adminStore.updateSystemSettings(settings);
      alert('Settings updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">General Settings</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                System Name
                <input 
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={settings.general.systemName || ''}
                  onChange={(e) => setSettings({
                    ...settings, 
                    general: { ...settings.general, systemName: e.target.value }
                  })}
                />
              </label>
            </div>
          </div>
        );
      case 'email':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Email Settings</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SMTP Server
                <input 
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={settings.email.smtpServer || ''}
                  onChange={(e) => setSettings({
                    ...settings, 
                    email: { ...settings.email, smtpServer: e.target.value }
                  })}
                />
              </label>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Security Settings</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Two-Factor Authentication
                <select 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={settings.security.twoFactorEnabled || 'disabled'}
                  onChange={(e) => setSettings({
                    ...settings, 
                    security: { ...settings.security, twoFactorEnabled: e.target.value }
                  })}
                >
                  <option value="disabled">Disabled</option>
                  <option value="enabled">Enabled</option>
                </select>
              </label>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-800">
        {error}
        <button 
          onClick={() => navigate('/dashboard')} 
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white shadow-md rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            {(['general', 'email', 'security'] as SettingsTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 border-b-2 font-medium text-sm
                  ${activeTab === tab 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Settings
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {renderTabContent()}
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
          <button
            onClick={handleUpdateSettings}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
