import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'

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
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#ffffff',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>Service status</h3>
        <p style={{ margin: 0, color: '#6b7280' }}>Service status laden…</p>
      </section>
    )
  }

  if (error && !status) {
    return (
      <section
        aria-live="polite"
        style={{
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#fef2f2',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>Service status</h3>
        <p style={{ margin: 0, color: '#991b1b' }}>{error}</p>
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
        border: '1px solid #d1d5db',
        borderRadius: '12px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        display: 'grid',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Service status</h3>
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
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
          <div style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '6px' }}>Laatste requests</div>
          <ul style={{ margin: 0, paddingLeft: '18px', color: '#4b5563', fontSize: '0.85rem' }}>
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
        <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>{error}</div>
      )}
    </section>
  )
}

function MetricTile({ label, value, helper }) {
  return (
    <div
      style={{
        borderRadius: '10px',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        padding: '12px 16px',
        minWidth: '150px',
        display: 'grid',
        gap: '4px',
      }}
    >
      <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>{label}</span>
      <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>{value}</span>
      {helper && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{helper}</span>}
    </div>
  )
}

export { useObservabilityStatus }
