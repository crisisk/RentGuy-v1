import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../api/settings';

interface Bedrijfsinformatie {
  bedrijfsnaam: string;
  adres: string;
  kvkNummer: string;
  telefoon: string;
}

interface Branding {
  logoUrl: string;
  primaireKleur: string;
  secundaireKleur: string;
}

interface EmailTemplate {
  id: string;
  naam: string;
  inhoud: string;
}

interface Integratie {
  id: string;
  naam: string;
  ingeschakeld: boolean;
  apiKey?: string;
}

interface NotificatieInstellingen {
  email: boolean;
  sms: boolean;
  push: boolean;
}

interface Settings {
  bedrijfsinformatie: Bedrijfsinformatie;
  branding: Branding;
  emailTemplates: EmailTemplate[];
  integraties: Integratie[];
  notificaties: NotificatieInstellingen;
}

export const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await settingsAPI.getAll();
        setSettings(result);
        setSelectedTemplate(result.emailTemplates[0]?.id || '');
      } catch (error) {
        console.error('Fout bij laden instellingen:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSaveSection = async (section: keyof Settings, data: any) => {
    try {
      await settingsAPI.updateSection(section, data);
    } catch (error) {
      console.error(`Fout bij opslaan ${section}:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="mr-dj-spinner"></div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Bedrijfsinformatie */}
        <div className="card-rentguy p-6">
          <h2 className="heading-rentguy text-xl mb-4">
            <i className="fas fa-building mr-2"></i>
            Bedrijfsinformatie
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-foreground mb-2">Bedrijfsnaam</label>
              <input
                type="text"
                value={settings.bedrijfsinformatie.bedrijfsnaam}
                onChange={(e) => setSettings({
                  ...settings,
                  bedrijfsinformatie: {
                    ...settings.bedrijfsinformatie,
                    bedrijfsnaam: e.target.value
                  }
                })}
                className="input-mr-dj w-full"
              />
            </div>
            <div>
              <label className="block text-foreground mb-2">KVK Nummer</label>
              <input
                type="text"
                value={settings.bedrijfsinformatie.kvkNummer}
                onChange={(e) => setSettings({
                  ...settings,
                  bedrijfsinformatie: {
                    ...settings.bedrijfsinformatie,
                    kvkNummer: e.target.value
                  }
                })}
                className="input-mr-dj w-full"
              />
            </div>
            <div className="md:col-span-2">
              <button
                onClick={() => handleSaveSection('bedrijfsinformatie', settings.bedrijfsinformatie)}
                className="btn-rentguy bg-rentguy-primary"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="card-rentguy p-6">
          <h2 className="heading-rentguy text-xl mb-4">
            <i className="fas fa-palette mr-2"></i>
            Branding
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-foreground mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <img src={settings.branding.logoUrl} alt="Logo" className="h-16 w-16 object-contain"/>
                <input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const newUrl = await settingsAPI.uploadLogo(file);
                      setSettings({
                        ...settings,
                        branding: { ...settings.branding, logoUrl: newUrl }
                      });
                    }
                  }}
                  className="input-mr-dj"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-foreground mb-2">Primaire kleur</label>
                <input
                  type="color"
                  value={settings.branding.primaireKleur}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, primaireKleur: e.target.value }
                  })}
                  className="w-16 h-10"
                />
              </div>
              <div>
                <label className="block text-foreground mb-2">Secundaire kleur</label>
                <input
                  type="color"
                  value={settings.branding.secundaireKleur}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, secundaireKleur: e.target.value }
                  })}
                  className="w-16 h-10"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <button
                onClick={() => handleSaveSection('branding', settings.branding)}
                className="btn-rentguy bg-rentguy-primary"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>

        {/* Email Templates */}
        <div className="card-rentguy p-6">
          <h2 className="heading-rentguy text-xl mb-4">
            <i className="fas fa-envelope mr-2"></i>
            E-mail Templates
          </h2>
          <div className="space-y-4">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="input-mr-dj w-full"
            >
              {settings.emailTemplates.map(template => (
                <option key={template.id} value={template.id}>{template.naam}</option>
              ))}
            </select>
            <textarea
              value={settings.emailTemplates.find(t => t.id === selectedTemplate)?.inhoud || ''}
              onChange={(e) => {
                const updatedTemplates = settings.emailTemplates.map(template => 
                  template.id === selectedTemplate 
                    ? { ...template, inhoud: e.target.value }
                    : template
                );
                setSettings({ ...settings, emailTemplates: updatedTemplates });
              }}
              className="input-mr-dj w-full h-48"
            />
            <button
              onClick={() => handleSaveSection('emailTemplates', settings.emailTemplates)}
              className="btn-rentguy bg-rentguy-primary"
            >
              Template Opslaan
            </button>
          </div>
        </div>

        {/* Integraties */}
        <div className="card-rentguy p-6">
          <h2 className="heading-rentguy text-xl mb-4">
            <i className="fas fa-plug mr-2"></i>
            Integraties
          </h2>
          <div className="space-y-4">
            {settings.integraties.map(integratie => (
              <div key={integratie.id} className="flex items-center justify-between p-4 bg-gray-100 rounded">
                <div>
                  <h3 className="font-medium">{integratie.naam}</h3>
                  {integratie.ingeschakeld && integratie.apiKey && (
                    <input
                      type="password"
                      value={integratie.apiKey}
                      onChange={(e) => {
                        const updated = settings.integraties.map(i => 
                          i.id === integratie.id ? { ...i, apiKey: e.target.value } : i
                        );
                        setSettings({ ...settings, integraties: updated });
                      }}
                      className="input-mr-dj mt-2"
                      placeholder="API Sleutel"
                    />
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      const updated = settings.integraties.map(i => 
                        i.id === integratie.id ? { ...i, ingeschakeld: !i.ingeschakeld } : i
                      );
                      setSettings({ ...settings, integraties: updated });
                    }}
                    className={`btn-rentguy ${integratie.ingeschakeld ? 'bg-rentguy-success' : 'bg-rentguy-secondary'}`}
                  >
                    {integratie.ingeschakeld ? 'Uitschakelen' : 'Inschakelen'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notificaties */}
        <div className="card-rentguy p-6">
          <h2 className="heading-rentguy text-xl mb-4">
            <i className="fas fa-bell mr-2"></i>
            Notificatie Instellingen
          </h2>
          <div className="space-y-2">
            {Object.entries(settings.notificaties).map(([type, enabled]) => (
              <label key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    notificaties: { ...settings.notificaties, [type]: e.target.checked }
                  })}
                  className="form-checkbox h-4 w-4 text-rentguy-primary"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
            <button
              onClick={() => handleSaveSection('notificaties', settings.notificaties)}
              className="btn-rentguy bg-rentguy-primary mt-4"
            >
              Notificaties Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};