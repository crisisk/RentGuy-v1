import React, { ChangeEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import adminStore, { AdminSettings } from '../../stores/adminStore'

type SettingsTab = 'general' | 'email' | 'security'

interface SystemSettingsProps {}

const SystemSettings: React.FC<SystemSettingsProps> = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [settings, setSettings] = useState<AdminSettings>(() => ({
    general: {},
    email: {},
    security: {},
  }))
  const [localError, setLocalError] = useState<string | null>(null)
  const loading = adminStore((state) => state.loading)
  const storeError = adminStore((state) => state.error)
  const settingsFromStore = adminStore((state) => state.settings)
  const getSystemSettings = adminStore((state) => state.getSystemSettings)
  const updateSystemSettings = adminStore((state) => state.updateSystemSettings)
  const error = localError ?? storeError

  const navigate = useNavigate()

  useEffect(() => {
    const fetchSettings = async () => {
      setLocalError(null)
      try {
        const fetchedSettings = await getSystemSettings()
        setSettings({
          general: { ...fetchedSettings.general },
          email: { ...fetchedSettings.email },
          security: { ...fetchedSettings.security },
        })
      } catch {
        setLocalError('Failed to load settings')
      }
    }

    void fetchSettings()
  }, [getSystemSettings])

  useEffect(() => {
    setSettings({
      general: { ...settingsFromStore.general },
      email: { ...settingsFromStore.email },
      security: { ...settingsFromStore.security },
    })
  }, [settingsFromStore])

  const handleUpdateSettings = async () => {
    try {
      setLocalError(null)
      const updatedSettings = await updateSystemSettings(settings)
      setSettings({
        general: { ...updatedSettings.general },
        email: { ...updatedSettings.email },
        security: { ...updatedSettings.security },
      })
      alert('Settings updated successfully')
    } catch {
      setLocalError('Failed to update settings')
    }
  }

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
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, systemName: event.target.value },
                    })
                  }
                />
              </label>
            </div>
          </div>
        )
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
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setSettings({
                      ...settings,
                      email: { ...settings.email, smtpServer: event.target.value },
                    })
                  }
                />
              </label>
            </div>
          </div>
        )
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
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        twoFactorEnabled: event.target.value as 'enabled' | 'disabled',
                      },
                    })
                  }
                >
                  <option value="disabled">Disabled</option>
                  <option value="enabled">Enabled</option>
                </select>
              </label>
            </div>
          </div>
        )
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
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
    )
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
                  ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Settings
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">{renderTabContent()}</div>
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
  )
}

export default SystemSettings
