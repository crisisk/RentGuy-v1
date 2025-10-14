import React, { useState, useEffect } from 'react';
import { customersAPI } from '../api/customers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faChartBar, faStar, faFire, faPhone, faEnvelope, faCalendarCheck, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';

interface CustomerSegment {
  id: string;
  type: 'VIP' | 'ActieveLeads' | 'Regelmatig' | 'Nieuw';
  title: string;
  count: number;
  trend: number;
}

interface SalesFunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting';
  customer: string;
  date: string;
  details: string;
}

interface KPIMetrics {
  conversie: number;
  lifetimeValue: number;
  actieveKlanten: number;
}

interface DashboardData {
  segments: CustomerSegment[];
  funnel: SalesFunnelStage[];
  activities: Activity[];
  metrics: KPIMetrics;
}

export const CRMDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await customersAPI.getAll();
        setData(result);
      } catch (err) {
        setError('Fout bij het laden van gegevens');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="mr-dj-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="heading-rentguy text-3xl">CRM Dashboard</h1>

        {/* KPI Sectie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-rentguy p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/80">Conversiepercentage</p>
                <p className="text-3xl font-bold text-primary">{data?.metrics.conversie}%</p>
              </div>
              <div className="bg-rentguy-primary p-4 rounded-full">
                <FontAwesomeIcon icon={faChartBar} className="text-white text-2xl" />
              </div>
            </div>
          </div>

          <div className="card-rentguy p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/80">Levensduurwaarde</p>
                <p className="text-3xl font-bold text-secondary">€{data?.metrics.lifetimeValue}</p>
              </div>
              <div className="bg-rentguy-secondary p-4 rounded-full">
                <FontAwesomeIcon icon={faEuroSign} className="text-white text-2xl" />
              </div>
            </div>
          </div>

          <div className="card-rentguy p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/80">Actieve Klanten</p>
                <p className="text-3xl font-bold text-success">{data?.metrics.actieveKlanten}</p>
              </div>
              <div className="bg-rentguy-success p-4 rounded-full">
                <FontAwesomeIcon icon={faUsers} className="text-white text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Segmentatie */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {data?.segments.map((segment) => (
            <div key={segment.id} className="card-rentguy p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{segment.title}</p>
                  <p className="text-2xl font-bold">{segment.count}</p>
                </div>
                <div className={`p-3 rounded-full ${
                  segment.type === 'VIP' ? 'bg-rentguy-secondary' :
                  segment.type === 'ActieveLeads' ? 'bg-rentguy-warning' :
                  'bg-rentguy-primary'
                }`}>
                  <FontAwesomeIcon 
                    icon={segment.type === 'VIP' ? faStar : faFire} 
                    className="text-white text-xl"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Funnel + Activiteiten */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card-rentguy p-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">Sales Funnel</h2>
            <div className="space-y-4">
              {data?.funnel.map((stage, idx) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex justify-between text-sm text-foreground">
                    <span>{stage.stage}</span>
                    <span>{stage.count} ({stage.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${idx % 2 === 0 ? 'bg-rentguy-primary' : 'bg-rentguy-success'}`}
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-rentguy p-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">Recente Activiteiten</h2>
            <div className="space-y-4">
              {data?.activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full mt-1 ${
                    activity.type === 'call' ? 'bg-rentguy-success' :
                    activity.type === 'email' ? 'bg-rentguy-primary' :
                    'bg-rentguy-secondary'
                  }`}>
                    <FontAwesomeIcon
                      icon={activity.type === 'call' ? faPhone : 
                            activity.type === 'email' ? faEnvelope : faCalendarCheck}
                      className="text-white text-sm"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{activity.customer}</p>
                    <p className="text-sm text-foreground/80">{activity.details}</p>
                    <p className="text-xs text-foreground/60">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};