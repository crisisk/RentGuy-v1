/**
 * Analytics Dashboard Component
 *
 * Displays content analytics in a user-friendly dashboard:
 * - Top performing content templates
 * - Tenant comparison
 * - View/click metrics
 * - Time-based trends
 * - Export functionality
 */

import { useEffect, useState, type CSSProperties } from 'react'
import { brand, withOpacity, headingFontStack } from '@ui/branding'
import { getContentAnalytics, exportContentAnalytics, clearContentAnalytics } from '@/services/contentAnalytics'
import type { AnalyticsReport, TemplateAnalytics, TenantStats } from '@/services/contentAnalytics'

/**
 * Props for the Analytics Dashboard
 */
export interface AnalyticsDashboardProps {
  /**
   * Optional tenant ID to filter analytics
   */
  readonly tenantId?: string

  /**
   * Whether to auto-refresh analytics
   * @default true
   */
  readonly autoRefresh?: boolean

  /**
   * Refresh interval in milliseconds
   * @default 30000 (30 seconds)
   */
  readonly refreshInterval?: number

  /**
   * Callback when export is clicked
   */
  readonly onExport?: (data: string) => void

  /**
   * Callback when clear is clicked
   */
  readonly onClear?: () => void
}

const containerStyle: CSSProperties = {
  padding: '24px',
  fontFamily: brand.colors.text,
  color: brand.colors.text,
  maxWidth: '1400px',
  margin: '0 auto',
}

const headerStyle: CSSProperties = {
  marginBottom: '32px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
}

const titleStyle: CSSProperties = {
  fontFamily: headingFontStack,
  fontSize: '2rem',
  fontWeight: 700,
  margin: 0,
  color: brand.colors.text,
}

const buttonStyle: CSSProperties = {
  padding: '10px 20px',
  borderRadius: '8px',
  border: 'none',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.9rem',
  transition: 'all 0.2s ease',
}

const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundImage: brand.colors.gradient,
  color: '#FFFFFF',
  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
}

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: brand.colors.surfaceMuted,
  color: brand.colors.text,
  border: `1px solid ${brand.colors.outline}`,
}

const dangerButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: brand.colors.danger,
  color: '#FFFFFF',
}

const statsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px',
  marginBottom: '32px',
}

const statCardStyle: CSSProperties = {
  background: '#FFFFFF',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  border: `1px solid ${brand.colors.outline}`,
}

const statValueStyle: CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 700,
  color: brand.colors.primary,
  margin: '8px 0',
}

const statLabelStyle: CSSProperties = {
  fontSize: '0.9rem',
  color: brand.colors.mutedText,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 600,
}

const sectionStyle: CSSProperties = {
  background: '#FFFFFF',
  padding: '24px',
  borderRadius: '12px',
  marginBottom: '24px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  border: `1px solid ${brand.colors.outline}`,
}

const sectionTitleStyle: CSSProperties = {
  fontFamily: headingFontStack,
  fontSize: '1.5rem',
  fontWeight: 600,
  marginBottom: '20px',
  color: brand.colors.text,
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

const tableHeaderStyle: CSSProperties = {
  textAlign: 'left',
  padding: '12px',
  borderBottom: `2px solid ${brand.colors.outline}`,
  fontWeight: 600,
  color: brand.colors.text,
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const tableCellStyle: CSSProperties = {
  padding: '12px',
  borderBottom: `1px solid ${brand.colors.surfaceMuted}`,
  fontSize: '0.95rem',
}

const emptyStateStyle: CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
  color: brand.colors.mutedText,
}

const loadingStyle: CSSProperties = {
  textAlign: 'center',
  padding: '40px 20px',
  color: brand.colors.mutedText,
  fontSize: '1.1rem',
}

/**
 * Analytics Dashboard Component
 */
export function AnalyticsDashboard({
  tenantId,
  autoRefresh = true,
  refreshInterval = 30000,
  onExport,
  onClear,
}: AnalyticsDashboardProps) {
  const [report, setReport] = useState<AnalyticsReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getContentAnalytics(tenantId)
      setReport(data)
    } catch (err) {
      console.error('Failed to load analytics', err)
      setError('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const data = await exportContentAnalytics()
      if (onExport) {
        onExport(data)
      } else {
        // Default behavior: download as file
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `content-analytics-${new Date().toISOString()}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Failed to export analytics', err)
      alert('Failed to export analytics data')
    }
  }

  const handleClear = async () => {
    const confirmed = confirm('Are you sure you want to clear all analytics data? This cannot be undone.')
    if (!confirmed) {
      return
    }

    try {
      await clearContentAnalytics()
      if (onClear) {
        onClear()
      }
      await loadAnalytics()
    } catch (err) {
      console.error('Failed to clear analytics', err)
      alert('Failed to clear analytics data')
    }
  }

  useEffect(() => {
    void loadAnalytics()
  }, [tenantId])

  useEffect(() => {
    if (!autoRefresh) {
      return
    }

    const interval = setInterval(() => {
      void loadAnalytics()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, tenantId])

  if (isLoading && !report) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ ...emptyStateStyle, color: brand.colors.danger }}>
          {error}
        </div>
      </div>
    )
  }

  if (!report || report.totalEvents === 0) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Content Analytics</h1>
        </div>
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
          <h2 style={{ margin: '0 0 8px 0', color: brand.colors.text }}>No Analytics Data Yet</h2>
          <p>Start tracking content views and interactions to see analytics here.</p>
        </div>
      </div>
    )
  }

  const topTemplates = Array.from(report.templates.values())
    .sort((a, b) => (b.viewCount + b.clickCount) - (a.viewCount + a.clickCount))
    .slice(0, 10)

  const tenantList = Array.from(report.tenantStats.values())
    .sort((a, b) => (b.viewCount + b.clickCount) - (a.viewCount + a.clickCount))

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Content Analytics</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() => void loadAnalytics()}
            title="Refresh analytics"
          >
            🔄 Refresh
          </button>
          <button
            type="button"
            style={primaryButtonStyle}
            onClick={() => void handleExport()}
            title="Export analytics data"
          >
            📥 Export
          </button>
          <button
            type="button"
            style={dangerButtonStyle}
            onClick={() => void handleClear()}
            title="Clear all analytics data"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      <div style={statsGridStyle}>
        <StatCard
          label="Total Events"
          value={report.totalEvents.toLocaleString()}
          color={brand.colors.primary}
        />
        <StatCard
          label="Total Views"
          value={report.totalViews.toLocaleString()}
          color={brand.colors.secondary}
        />
        <StatCard
          label="Total Clicks"
          value={report.totalClicks.toLocaleString()}
          color={brand.colors.accent}
        />
        <StatCard
          label="Unique Templates"
          value={report.templates.size.toLocaleString()}
          color={brand.colors.success}
        />
        <StatCard
          label="Active Tenants"
          value={report.tenantStats.size.toLocaleString()}
          color={brand.colors.warning}
        />
        <StatCard
          label="Sessions"
          value={report.sessionCount.toLocaleString()}
          color={brand.colors.primary}
        />
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Top Performing Templates</h2>
        {topTemplates.length > 0 ? (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Template ID</th>
                <th style={tableHeaderStyle}>Views</th>
                <th style={tableHeaderStyle}>Clicks</th>
                <th style={tableHeaderStyle}>Interactions</th>
                <th style={tableHeaderStyle}>Tenants</th>
                <th style={tableHeaderStyle}>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {topTemplates.map((template) => (
                <TemplateRow key={template.templateId} template={template} />
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: brand.colors.mutedText }}>
            No template data available
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Tenant Statistics</h2>
        {tenantList.length > 0 ? (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Tenant ID</th>
                <th style={tableHeaderStyle}>Views</th>
                <th style={tableHeaderStyle}>Clicks</th>
                <th style={tableHeaderStyle}>Interactions</th>
                <th style={tableHeaderStyle}>Unique Templates</th>
                <th style={tableHeaderStyle}>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {tenantList.map((tenant) => (
                <TenantRow key={tenant.tenantId} tenant={tenant} />
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: brand.colors.mutedText }}>
            No tenant data available
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Date Range</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <strong style={{ color: brand.colors.mutedText }}>First Event:</strong>
            <div style={{ fontSize: '1.1rem', marginTop: '4px' }}>
              {new Date(report.dateRange.start).toLocaleString()}
            </div>
          </div>
          <div>
            <strong style={{ color: brand.colors.mutedText }}>Last Event:</strong>
            <div style={{ fontSize: '1.1rem', marginTop: '4px' }}>
              {new Date(report.dateRange.end).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Stat Card Component
 */
function StatCard({
  label,
  value,
  color,
}: {
  readonly label: string
  readonly value: string
  readonly color: string
}) {
  return (
    <div style={statCardStyle}>
      <div style={statLabelStyle}>{label}</div>
      <div style={{ ...statValueStyle, color }}>{value}</div>
    </div>
  )
}

/**
 * Template Row Component
 */
function TemplateRow({ template }: { template: TemplateAnalytics; key?: string }) {
  return (
    <tr>
      <td style={tableCellStyle}>
        <strong>{template.templateId}</strong>
      </td>
      <td style={tableCellStyle}>{template.viewCount.toLocaleString()}</td>
      <td style={tableCellStyle}>{template.clickCount.toLocaleString()}</td>
      <td style={tableCellStyle}>{template.interactionCount.toLocaleString()}</td>
      <td style={tableCellStyle}>{template.tenants.size}</td>
      <td style={tableCellStyle}>
        {new Date(template.lastSeen).toLocaleString()}
      </td>
    </tr>
  )
}

/**
 * Tenant Row Component
 */
function TenantRow({ tenant }: { tenant: TenantStats; key?: string }) {
  return (
    <tr>
      <td style={tableCellStyle}>
        <strong>{tenant.tenantId}</strong>
      </td>
      <td style={tableCellStyle}>{tenant.viewCount.toLocaleString()}</td>
      <td style={tableCellStyle}>{tenant.clickCount.toLocaleString()}</td>
      <td style={tableCellStyle}>{tenant.interactionCount.toLocaleString()}</td>
      <td style={tableCellStyle}>{tenant.uniqueTemplates.size}</td>
      <td style={tableCellStyle}>
        {new Date(tenant.lastSeen).toLocaleString()}
      </td>
    </tr>
  )
}

export default AnalyticsDashboard
