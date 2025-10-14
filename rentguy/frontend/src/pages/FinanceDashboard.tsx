import React, { useState, useEffect } from 'react';
import { financeAPI } from '../api/finance';

interface KPIData {
  totalRevenue: number;
  outstanding: number;
  profitMargin: number;
  activeProjects: number;
  revenueGrowth: number;
  outstandingCount: number;
}

export const FinanceDashboard: React.FC = () => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    loadKPIData();
  }, [dateRange]);

  const loadKPIData = async () => {
    try {
      setLoading(true);
      const data = await financeAPI.getKPIs({ period: dateRange });
      setKpiData(data);
    } catch (error) {
      console.error('Failed to load KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading || !kpiData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="mr-dj-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold heading-rentguy mb-2">
              Financieel Dashboard
            </h1>
            <p className="text-muted-foreground">
              Real-time KPI metrics en omzet analytics
            </p>
          </div>
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-mr-dj"
            >
              <option value="week">Deze Week</option>
              <option value="month">Deze Maand</option>
              <option value="quarter">Dit Kwartaal</option>
              <option value="year">Dit Jaar</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="card-rentguy p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Totale Omzet</span>
              <div className="w-10 h-10 rounded-lg bg-rentguy-success flex items-center justify-center">
                <i className="fas fa-euro-sign text-white"></i>
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {formatCurrency(kpiData.totalRevenue)}
            </div>
            <div className="text-sm text-success">
              <i className="fas fa-arrow-up mr-1"></i>
              {formatPercentage(kpiData.revenueGrowth)}
            </div>
          </div>

          {/* Outstanding */}
          <div className="card-rentguy p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Openstaand</span>
              <div className="w-10 h-10 rounded-lg bg-rentguy-warning flex items-center justify-center">
                <i className="fas fa-clock text-white"></i>
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {formatCurrency(kpiData.outstanding)}
            </div>
            <div className="text-sm text-warning">
              <i className="fas fa-file-invoice mr-1"></i>
              {kpiData.outstandingCount} facturen
            </div>
          </div>

          {/* Profit Margin */}
          <div className="card-rentguy p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Winst Marge</span>
              <div className="w-10 h-10 rounded-lg bg-rentguy-primary flex items-center justify-center">
                <i className="fas fa-chart-line text-white"></i>
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {kpiData.profitMargin.toFixed(1)}%
            </div>
            <div className="text-sm text-success">
              <i className="fas fa-arrow-up mr-1"></i>
              +2.1%
            </div>
          </div>

          {/* Active Projects */}
          <div className="card-rentguy p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Actieve Projecten</span>
              <div className="w-10 h-10 rounded-lg bg-rentguy-secondary flex items-center justify-center">
                <i className="fas fa-project-diagram text-white"></i>
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {kpiData.activeProjects}
            </div>
            <div className="text-sm text-muted-foreground">
              <i className="fas fa-calendar mr-1"></i>
              6 deze maand
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="card-rentguy p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              <i className="fas fa-chart-area mr-2 text-rentguy-primary"></i>
              Omzet Ontwikkeling
            </h3>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <i className="fas fa-chart-line text-4xl mb-2"></i>
                <p>Chart.js grafiek wordt hier gerenderd</p>
              </div>
            </div>
          </div>

          {/* Invoice Status */}
          <div className="card-rentguy p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              <i className="fas fa-file-invoice mr-2 text-rentguy-warning"></i>
              Factuur Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                  <span className="text-sm text-foreground">Betaald</span>
                </div>
                <span className="text-sm font-semibold text-foreground">€ 185K</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>
                  <span className="text-sm text-foreground">Openstaand</span>
                </div>
                <span className="text-sm font-semibold text-foreground">€ 45K</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                  <span className="text-sm text-foreground">Achterstallig</span>
                </div>
                <span className="text-sm font-semibold text-foreground">€ 15K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-4">
          <button className="btn-rentguy">
            <i className="fas fa-file-invoice mr-2"></i>
            Nieuwe Factuur
          </button>
          <button className="btn-rentguy">
            <i className="fas fa-download mr-2"></i>
            Export naar Excel
          </button>
          <button className="btn-rentguy">
            <i className="fas fa-file-pdf mr-2"></i>
            Genereer Rapport
          </button>
        </div>
      </div>
    </div>
  );
};

