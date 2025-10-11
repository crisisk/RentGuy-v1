import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import { brand, brandFontStack, headingFontStack, withOpacity } from './theme.js'

function formatAvailability(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(1)}%`
}

function formatLatency(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${value.toFixed(1)} ms`
}

function formatUptime(value, fallback) {
  if (typeof value !== 'string') return fallback
  return value
}

function useObservabilityStatus(refreshInterval = 30000) {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    let timer = null

    async function load() {
      try {
        const { data } = await api.get('/api/v1/observability/status')
        if (!cancelled) {
          setStatus(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Status niet beschikbaar')
        }
      }
    }

    load()

    if (refreshInterval > 0) {
      timer = setInterval(load, refreshInterval)
    }

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [refreshInterval])

  return useMemo(() => ({ status, error }), [status, error])
}

export default function ObservabilitySummary({ refreshInterval }) {
  const { status, error } = useObservabilityStatus(refreshInterval ?? 30000)

  if (!status && !error) {
    return (
      <section
        aria-live="polite"
        style={{
          border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
          borderRadius: 18,
          padding: '18px 20px',
          background: withOpacity('#ffffff', 0.96),
          fontFamily: brandFontStack,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1rem', color: brand.colors.secondary }}>
          Service status
        </h3>
        <p style={{ margin: 0, color: brand.colors.mutedText }}>Service status laden…</p>
      </section>
    )
  }

  if (error && !status) {
    return (
      <section
        aria-live="polite"
        style={{
          border: `1px solid ${withOpacity(brand.colors.danger, 0.32)}`,
          borderRadius: 18,
          padding: '18px 20px',
          backgroundColor: withOpacity(brand.colors.danger, 0.14),
          fontFamily: brandFontStack,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1rem', color: brand.colors.secondary }}>
          Service status
        </h3>
        <p style={{ margin: 0, color: '#B91C1C' }}>{error}</p>
      </section>
    )
  }

  const availability = formatAvailability(status?.availability)
  const latency = formatLatency(status?.average_latency_ms)
  const uptime = formatUptime(status?.uptime_human, '—')
  const totalRequests = status?.total_requests ?? 0
  const recent = Array.isArray(status?.recent_requests) ? status.recent_requests.slice(0, 3) : []

  return (
    <section
      aria-live="polite"
      style={{
        border: `1px solid ${brand.colors.outline}`,
        borderRadius: 22,
        padding: '20px 22px',
        background: withOpacity('#ffffff', 0.96),
        display: 'grid',
        gap: '16px',
        boxShadow: '0 22px 52px rgba(15, 23, 42, 0.16)',
        fontFamily: brandFontStack,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', color: brand.colors.secondary, fontFamily: headingFontStack }}>
          Service status
        </h3>
        <span style={{ fontSize: '0.78rem', color: brand.colors.mutedText }}>
          Laatste update: {status?.generated_at ? new Date(status.generated_at).toLocaleTimeString('nl-NL') : '—'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <MetricTile label="Beschikbaarheid" value={availability} helper="Op basis van 5xx fouten" />
        <MetricTile label="Gem. latency" value={latency} helper="Rolling gemiddelde" />
        <MetricTile label="Uptime" value={uptime} helper={`${totalRequests} requests`} />
      </div>
      {recent.length > 0 && (
        <div>
          <div style={{ fontSize: '0.9rem', color: brand.colors.secondary, marginBottom: '6px', fontWeight: 600 }}>
            Laatste requests
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', color: brand.colors.mutedText, fontSize: '0.85rem' }}>
            {recent.map((entry, index) => (
              <li key={`${entry.method}-${entry.path}-${index}`}>
                <span style={{ fontWeight: 600 }}>{entry.method}</span> {entry.path} · {entry.status_code} ·{' '}
                {formatLatency(entry.latency_ms)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && status && (
        <div style={{ fontSize: '0.82rem', color: '#B91C1C' }}>{error}</div>
      )}
    </section>
  )
}

function MetricTile({ label, value, helper }) {
  return (
    <div
      style={{
        borderRadius: 18,
        background: withOpacity(brand.colors.surface, 0.92),
        border: `1px solid ${withOpacity(brand.colors.primary, 0.16)}`,
        padding: '14px 18px',
        minWidth: 180,
        display: 'grid',
        gap: '6px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
      }}
    >
      <span style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>{label}</span>
      <span style={{ fontSize: '1.35rem', fontWeight: 700, color: brand.colors.secondary }}>{value}</span>
      {helper && <span style={{ fontSize: '0.78rem', color: brand.colors.mutedText }}>{helper}</span>}
    </div>
  )
}

export { useObservabilityStatus }
