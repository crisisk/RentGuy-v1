import React, { useState } from 'react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected';
  lastSync?: string;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'notifications' | 'security'>('general');

  const integrations: Integration[] = [
    {
      id: 'exact',
      name: 'Exact Online',
      description: 'Boekhouding en facturatie',
      icon: 'fa-file-invoice',
      status: 'connected',
      lastSync: '10 minuten geleden'
    },
    {
      id: 'afas',
      name: 'AFAS',
      description: 'Salarisadministratie',
      icon: 'fa-users-cog',
      status: 'connected',
      lastSync: '2 uur geleden'
    },
    {
      id: 'mollie',
      name: 'Mollie',
      description: 'Online betalingen',
      icon: 'fa-credit-card',
      status: 'connected',
      lastSync: '5 minuten geleden'
    },
    {
      id: 'google',
      name: 'Google Calendar',
      description: 'Agenda synchronisatie',
      icon: 'fa-calendar',
      status: 'disconnected'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Team communicatie',
      icon: 'fa-slack',
      status: 'disconnected'
    }
  ];

  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: 'conflicts',
      label: 'Planning Conflicten',
      description: 'Ontvang een notificatie bij dubbele boekingen of materiaaltekorten',
      enabled: true
    },
    {
      id: 'invoices',
      label: 'Achterstallige Facturen',
      description: 'Dagelijkse herinnering voor openstaande facturen',
      enabled: true
    },
    {
      id: 'quotes',
      label: 'Offerte Updates',
      description: 'Notificatie wanneer een klant een offerte bekijkt',
      enabled: true
    },
    {
      id: 'crew',
      label: 'Crew Beschikbaarheid',
      description: 'Waarschuwing bij lage crew beschikbaarheid',
      enabled: false
    },
    {
      id: 'equipment',
      label: 'Materiaal Onderhoud',
      description: 'Herinnering voor geplande onderhoudstaken',
      enabled: true
    }
  ]);

  const toggleNotification = (id: string) => {
    setNotificationSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Systeeminstellingen</h1>
        <button className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
          <i className="fas fa-save mr-2"></i>
          Wijzigingen Opslaan
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm mb-8">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'general', label: 'Algemeen', icon: 'fa-cog' },
            { id: 'integrations', label: 'Integraties', icon: 'fa-plug' },
            { id: 'notifications', label: 'Notificaties', icon: 'fa-bell' },
            { id: 'security', label: 'Beveiliging', icon: 'fa-shield-alt' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-8 py-4 font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-8 shadow-sm">
        {activeTab === 'general' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Bedrijfsinformatie</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bedrijfsnaam
                  </label>
                  <input
                    type="text"
                    defaultValue="Mr. DJ Events"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    KVK Nummer
                  </label>
                  <input
                    type="text"
                    defaultValue="12345678"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    BTW Nummer
                  </label>
                  <input
                    type="text"
                    defaultValue="NL123456789B01"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefoonnummer
                  </label>
                  <input
                    type="text"
                    defaultValue="+31 6 12345678"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adres
                  </label>
                  <input
                    type="text"
                    defaultValue="Hoofdstraat 123, 1012 AB Amsterdam"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Facturatie Instellingen</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Standaard Betalingstermijn
                  </label>
                  <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900">
                    <option>14 dagen</option>
                    <option>30 dagen</option>
                    <option>60 dagen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    BTW Tarief
                  </label>
                  <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900">
                    <option>21%</option>
                    <option>9%</option>
                    <option>0%</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Externe Integraties</h2>
            <div className="space-y-4">
              {integrations.map(integration => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-6 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <i className={`fas ${integration.icon} text-2xl text-blue-500`}></i>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg mb-1">{integration.name}</div>
                      <div className="text-sm text-gray-600">{integration.description}</div>
                      {integration.lastSync && (
                        <div className="text-xs text-gray-500 mt-1">
                          <i className="fas fa-sync-alt mr-1"></i>
                          Laatste sync: {integration.lastSync}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {integration.status === 'connected' ? (
                      <>
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-semibold">
                          <i className="fas fa-check-circle"></i>
                          Verbonden
                        </span>
                        <button className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                          Configureren
                        </button>
                        <button className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors">
                          Verbreek
                        </button>
                      </>
                    ) : (
                      <button className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
                        <i className="fas fa-plug mr-2"></i>
                        Verbinden
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Notificatie Voorkeuren</h2>
            <div className="space-y-4">
              {notificationSettings.map(setting => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between p-6 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-lg mb-1">{setting.label}</div>
                    <div className="text-sm text-gray-600">{setting.description}</div>
                  </div>
                  <button
                    onClick={() => toggleNotification(setting.id)}
                    className={`relative w-16 h-8 rounded-full transition-colors ${
                      setting.enabled ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                        setting.enabled ? 'translate-x-9' : 'translate-x-1'
                      }`}
                    ></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Wachtwoord & Authenticatie</h2>
              <div className="space-y-4">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900 text-lg mb-1">Wachtwoord Wijzigen</div>
                      <div className="text-sm text-gray-600">Laatst gewijzigd: 15 december 2024</div>
                    </div>
                    <button className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
                      Wijzig Wachtwoord
                    </button>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900 text-lg mb-1">Twee-Factor Authenticatie (2FA)</div>
                      <div className="text-sm text-gray-600">Extra beveiligingslaag voor je account</div>
                    </div>
                    <button className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors">
                      <i className="fas fa-shield-alt mr-2"></i>
                      Activeer 2FA
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Actieve Sessies</h2>
              <div className="space-y-3">
                {[
                  { device: 'MacBook Pro', location: 'Amsterdam, Nederland', lastActive: '2 minuten geleden', current: true },
                  { device: 'iPhone 14', location: 'Amsterdam, Nederland', lastActive: '1 uur geleden', current: false },
                  { device: 'iPad Pro', location: 'Utrecht, Nederland', lastActive: '3 dagen geleden', current: false }
                ].map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <i className={`fas ${
                          session.device.includes('MacBook') ? 'fa-laptop' :
                          session.device.includes('iPhone') ? 'fa-mobile-alt' :
                          'fa-tablet-alt'
                        } text-blue-500`}></i>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {session.device}
                          {session.current && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">
                              Huidige sessie
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {session.location} • {session.lastActive}
                        </div>
                      </div>
                    </div>
                    {!session.current && (
                      <button className="px-3 py-1.5 bg-red-500 text-white text-sm font-semibold rounded-md hover:bg-red-600 transition-colors">
                        Beëindig
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;

