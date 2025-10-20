import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { brand, headingFontStack, withOpacity } from '@ui/branding'
import { useFinanceStore, type FinanceStats, type Invoice } from '@stores/financeStore'

const statusPalette: Record<string, { background: string; color: string }> = {
  pending: { background: withOpacity(brand.colors.warning, 0.14), color: brand.colors.warning },
  paid: { background: withOpacity(brand.colors.success, 0.16), color: brand.colors.success },
  overdue: { background: withOpacity(brand.colors.danger, 0.16), color: brand.colors.danger },
  draft: { background: withOpacity(brand.colors.secondary, 0.08), color: brand.colors.secondary },
}

function deriveStats(invoices: Invoice[], stats: FinanceStats | null): FinanceStats {
  if (stats) {
    return stats
  }

  const summary = invoices.reduce(
    (acc, invoice) => {
      if (invoice.status === 'paid' || invoice.status === 'completed') {
        acc.paidInvoicesTotal += invoice.amount
        acc.monthlyRevenue += invoice.amount
      } else if (invoice.status === 'pending') {
        acc.pendingInvoicesTotal += invoice.amount
      } else if (invoice.status === 'overdue') {
        acc.pendingInvoicesTotal += invoice.amount
      }
      return acc
    },
    { monthlyRevenue: 0, pendingInvoicesTotal: 0, paidInvoicesTotal: 0 },
  )

  return summary
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value)
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export default function FinanceDashboard(): JSX.Element {
  const invoices = useFinanceStore(state => state.invoices)
  const stats = useFinanceStore(state => state.stats)
  const loading = useFinanceStore(state => state.loading)
  const error = useFinanceStore(state => state.error)
  const getDashboardData = useFinanceStore(state => state.getDashboardData)
  const clearError = useFinanceStore(state => state.clearError)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        await getDashboardData()
      } catch (err) {
        if (!cancelled) {
          console.warn('Kon finance dashboard niet laden', err)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
      clearError()
    }
  }, [getDashboardData, clearError])

  const metrics = useMemo(() => deriveStats(invoices, stats), [invoices, stats])

  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => {
        const aTime = new Date(a.dueDate ?? a.date).getTime()
        const bTime = new Date(b.dueDate ?? b.date).getTime()
        return Number.isNaN(bTime) - Number.isNaN(aTime) || bTime - aTime
      })
      .slice(0, 8)
  }, [invoices])

  if (loading && !invoices.length) {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: brand.fontStack,
          color: brand.colors.secondary,
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            border: `4px solid ${withOpacity(brand.colors.primary, 0.25)}`,
            borderTopColor: brand.colors.primary,
            animation: 'rg-spinner 0.9s linear infinite',
          }}
        />
        <style>
          {`@keyframes rg-spinner { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
        </style>
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        style={{
          margin: '48px auto',
          maxWidth: 560,
          padding: '18px 22px',
          borderRadius: 18,
          background: withOpacity(brand.colors.danger, 0.12),
          border: `1px solid ${withOpacity(brand.colors.danger, 0.26)}`,
          color: brand.colors.danger,
          fontFamily: brand.fontStack,
        }}
      >
        {error}
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: 24,
        padding: '32px clamp(16px, 4vw, 48px)',
        fontFamily: brand.fontStack,
        color: brand.colors.secondary,
      }}
    >
      <header style={{ display: 'grid', gap: 10 }}>
        <span
          style={{
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            color: withOpacity(brand.colors.secondary, 0.65),
            fontWeight: 600,
          }}
        >
          Finance
        </span>
        <h1
          style={{
            margin: 0,
            fontFamily: headingFontStack,
            fontSize: '2.1rem',
            lineHeight: 1.2,
          }}
        >
          Financieel overzicht
        </h1>
        <p style={{ margin: 0, color: withOpacity(brand.colors.secondary, 0.78) }}>
          Monitor inkomsten, betalingsstatus en kritieke facturen voor de komende weken.
        </p>
      </header>

      <section
        aria-label="Kerncijfers"
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        {[
          { label: 'Maandelijkse omzet', value: metrics.monthlyRevenue, accent: brand.colors.success },
          { label: 'Openstaand', value: metrics.pendingInvoicesTotal, accent: brand.colors.warning },
          { label: 'Betaald', value: metrics.paidInvoicesTotal, accent: brand.colors.primary },
        ].map(metric => (
          <article
            key={metric.label}
            style={{
              padding: '20px 22px',
              borderRadius: 24,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(231, 236, 255, 0.88) 100%)',
              border: `1px solid ${withOpacity(metric.accent, 0.22)}`,
              boxShadow: brand.colors.shadow,
              display: 'grid',
              gap: 8,
            }}
          >
            <span style={{ fontSize: '0.9rem', color: withOpacity(metric.accent, 0.75), fontWeight: 600 }}>
              {metric.label}
            </span>
            <span style={{ fontSize: '1.8rem', fontWeight: 700, color: brand.colors.secondary }}>
              {formatCurrency(metric.value)}
            </span>
          </article>
        ))}
      </section>

      <section
        aria-label="Recente facturen"
        style={{
          borderRadius: 24,
          background: '#ffffff',
          border: `1px solid ${withOpacity(brand.colors.primary, 0.12)}`,
          boxShadow: brand.colors.shadow,
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            padding: '18px 24px',
            borderBottom: `1px solid ${withOpacity(brand.colors.primary, 0.12)}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Recentste facturen</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: withOpacity(brand.colors.secondary, 0.7) }}>
              Laatste acht facturen gesorteerd op vervaldatum.
            </p>
          </div>
          <Link
            to="/invoices"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 999,
              border: `1px solid ${withOpacity(brand.colors.primary, 0.3)}`,
              color: brand.colors.primary,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Bekijk alle facturen
          </Link>
        </header>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: 640,
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', color: withOpacity(brand.colors.secondary, 0.65), fontSize: '0.82rem' }}>
                <th style={{ padding: '14px 24px' }}>Klant</th>
                <th style={{ padding: '14px 24px' }}>Bedrag</th>
                <th style={{ padding: '14px 24px' }}>Factuurdatum</th>
                <th style={{ padding: '14px 24px' }}>Vervaldatum</th>
                <th style={{ padding: '14px 24px' }}>Status</th>
                <th style={{ padding: '14px 24px', textAlign: 'right' }}>Acties</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map(invoice => {
                const palette = statusPalette[invoice.status] ?? statusPalette.draft
                return (
                  <tr key={invoice.id} style={{ borderTop: `1px solid ${withOpacity(brand.colors.secondary, 0.08)}` }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>{invoice.clientName}</td>
                    <td style={{ padding: '16px 24px' }}>{formatCurrency(invoice.amount)}</td>
                    <td style={{ padding: '16px 24px' }}>{formatDate(invoice.date)}</td>
                    <td style={{ padding: '16px 24px' }}>{formatDate(invoice.dueDate)}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px 12px',
                          borderRadius: 999,
                          background: palette.background,
                          color: palette.color,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <Link
                        to={`/invoices/${invoice.id}`}
                        style={{ color: brand.colors.primary, fontWeight: 600, textDecoration: 'none' }}
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {!recentInvoices.length && (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: withOpacity(brand.colors.secondary, 0.65) }}>
                    Er zijn nog geen facturen beschikbaar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
