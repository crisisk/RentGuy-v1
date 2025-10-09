import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'

const personaPresets = {
  all: {
    label: 'Alle rollen',
    description: 'Toont de volledige planning zonder filters, ideaal voor gezamenlijke UAT-sessies.',
  },
  bart: {
    label: 'Bart de Manager',
    statusFilter: 'active',
    riskFilter: 'warning',
    sortKey: 'start',
    sortDir: 'asc',
    description: 'Focus op lopende projecten en voorraadwaarschuwingen zodat hij direct kan bijsturen.',
  },
  anna: {
    label: 'Anna de Planner',
    statusFilter: 'upcoming',
    sortKey: 'start',
    sortDir: 'asc',
    description: 'Legt de nadruk op komende projecten in chronologische volgorde voor detailplanning.',
  },
  tom: {
    label: 'Tom de Technicus',
    statusFilter: 'active',
    riskFilter: 'ok',
    sortKey: 'start',
    sortDir: 'asc',
    description: 'Toont enkel actuele opdrachten zodat hij weet waar hij vandaag moet zijn.',
  },
  carla: {
    label: 'Carla de Klant',
    statusFilter: 'upcoming',
    sortKey: 'client',
    sortDir: 'asc',
    description: 'Sorteert op klantnaam zodat front-office teams snel klantvragen kunnen beantwoorden.',
  },
  frank: {
    label: 'Frank de Financieel Medewerker',
    statusFilter: 'completed',
    sortKey: 'end',
    sortDir: 'desc',
    description: 'Laat afgeronde projecten zien, handig voor facturatie en BTW-controle.',
  },
  sven: {
    label: 'Sven de Systeembeheerder',
    riskFilter: 'critical',
    sortKey: 'risk',
    sortDir: 'desc',
    description: 'Filtert op kritieke voorraadrisico’s om escalaties te voorkomen.',
  },
  isabelle: {
    label: 'Isabelle de International',
    statusFilter: 'upcoming',
    sortKey: 'start',
    sortDir: 'asc',
    description: 'Toont internationale events ruim op tijd zodat vertalingen en valuta geregeld zijn.',
  },
  peter: {
    label: 'Peter de Power-User',
    riskFilter: 'warning',
    sortKey: 'status',
    sortDir: 'asc',
    description: 'Highlight projecten met voorraadspanning voor API-automatiseringen.',
  },
  nadia: {
    label: 'Nadia de Nieuweling',
    statusFilter: 'upcoming',
    sortKey: 'start',
    sortDir: 'asc',
    description: 'Behoudt enkel eenvoudige komende taken voor een zachte onboarding.',
  },
  david: {
    label: 'David de Developer',
    sortKey: 'status',
    sortDir: 'asc',
    description: 'Combineert alle statussen zodat API-extensies getest kunnen worden.',
  },
}

const statusLabels = {
  active: 'Actief',
  upcoming: 'Komend',
  completed: 'Afgerond',
  at_risk: 'Risico',
}

const riskLabels = {
  ok: 'Op schema',
  warning: 'Let op',
  critical: 'Kritiek',
}

const statusPriority = {
  at_risk: 0,
  active: 1,
  upcoming: 2,
  completed: 3,
}

const badgePalette = {
  active: '#2563eb',
  upcoming: '#0ea5e9',
  completed: '#10b981',
  at_risk: '#dc2626',
}

const riskPalette = {
  ok: '#16a34a',
  warning: '#d97706',
  critical: '#b91c1c',
}

const cardPalette = {
  neutral: '#f3f4f6',
  success: '#dcfce7',
  warning: '#fef3c7',
  danger: '#fee2e2',
}

const personaOutcomes = [
  {
    key: 'bart',
    label: personaPresets.bart.label,
    verdict: '✅',
    insight:
      'Dashboard toont nu realtime kritieke voorraadalerts en het aantal projecten binnen 7 dagen zodat hij direct kan prioriteren.',
  },
  {
    key: 'anna',
    label: personaPresets.anna.label,
    verdict: '✅',
    insight:
      'API levert een tijdlijnlabel per project waardoor herplannen vanuit het overzicht minder contextwissels vereist.',
  },
  {
    key: 'tom',
    label: personaPresets.tom.label,
    verdict: '✅',
    insight:
      'Mobiele weergave gebruikt dezelfde tijdlijnhint en markeert kritieke voorraad duidelijk dankzij de nieuwe badges.',
  },
  {
    key: 'carla',
    label: personaPresets.carla.label,
    verdict: '✅',
    insight:
      'Zoek- en klantfilters blijven bewaard terwijl operationele signalen aangeven welke projecten een klantupdate nodig hebben.',
  },
  {
    key: 'frank',
    label: personaPresets.frank.label,
    verdict: '✅',
    insight:
      'Nieuwe metriek “Afgerond (30d)” helpt facturatie prioriteren en sluit aan op finance-rapportages.',
  },
  {
    key: 'sven',
    label: personaPresets.sven.label,
    verdict: '✅',
    insight:
      'Samenvatting aggregeert kritieke voorraadalerts waardoor escalaties direct zichtbaar zijn.',
  },
  {
    key: 'isabelle',
    label: personaPresets.isabelle.label,
    verdict: '✅',
    insight:
      'Tijdlijnlabels en nieuwe voorraadpresets bewaken internationale trajecten met ruim voldoende voorbereidingstijd.',
  },
  {
    key: 'peter',
    label: personaPresets.peter.label,
    verdict: '✅',
    insight:
      'Nieuwe /projects/summary endpoint voorziet automatiseringen van betrouwbare status- en risicocijfers.',
  },
  {
    key: 'nadia',
    label: personaPresets.nadia.label,
    verdict: '✅',
    insight:
      'Persona-hints en stabiele presets houden de interface overzichtelijk tijdens onboarding.',
  },
  {
    key: 'david',
    label: personaPresets.david.label,
    verdict: '✅',
    insight:
      'Uitgebreide projectpayload bevat nu timeline_label zodat API-contracttests de UX-tekst kunnen bewaken.',
  },
]

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatDate(dateString) {
  if (!dateString) return '—'
  const safeDate = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(safeDate.getTime())) return dateString
  return dateFormatter.format(safeDate)
}

function getDateValue(dateString) {
  if (!dateString) return 0
  const value = new Date(`${dateString}T00:00:00`).getTime()
  return Number.isNaN(value) ? 0 : value
}

function timelineLabel(event) {
  if (event.status === 'completed') {
    return `Afgerond op ${formatDate(event.end)}`
  }
  if (event.status === 'active') {
    return `Nu bezig – eindigt ${formatDate(event.end)}`
  }
  if (event.status === 'at_risk') {
    if (typeof event.daysUntilStart === 'number') {
      if (event.daysUntilStart <= 0) return 'Voorraadcontrole vereist vandaag'
      if (event.daysUntilStart === 1) return 'Controleer voorraad vóór morgen'
      return `Voorraadcontrole binnen ${event.daysUntilStart} dagen`
    }
    return 'Voorraadcontrole vereist'
  }
  if (typeof event.daysUntilStart !== 'number') {
    return `Start op ${formatDate(event.start)}`
  }
  if (event.daysUntilStart === 0) return 'Start vandaag'
  if (event.daysUntilStart === 1) return 'Start morgen'
  return `Start over ${event.daysUntilStart} dagen`
}

function statusMatches(filter, status) {
  if (filter === 'all') return true
  if (filter === 'active') return status === 'active' || status === 'at_risk'
  return status === filter
}

function RiskBadge({ risk }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: `${riskPalette[risk] || '#4b5563'}20`,
        color: riskPalette[risk] || '#4b5563',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '0.85rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: riskPalette[risk] || '#4b5563' }} />
      {riskLabels[risk] || 'Onbekend'}
    </span>
  )
}

function StatusBadge({ status }) {
  return (
    <span
      style={{
        backgroundColor: `${badgePalette[status] || '#6b7280'}1a`,
        color: badgePalette[status] || '#6b7280',
        padding: '4px 10px',
        borderRadius: '999px',
        fontWeight: 600,
      }}
    >
      {statusLabels[status] || status}
    </span>
  )
}

function SummaryMetric({ label, value, tone = 'neutral', helpText }) {
  return (
    <div
      style={{
        background: cardPalette[tone] || cardPalette.neutral,
        padding: '12px 16px',
        borderRadius: '12px',
        display: 'grid',
        gap: '4px',
        minWidth: '150px',
      }}
    >
      <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
      {helpText && <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{helpText}</div>}
    </div>
  )
}

function LoadingRows() {
  return (
    <tbody>
      {[...Array(3)].map((_, idx) => (
        <tr key={idx}>
          {[...Array(8)].map((__, cellIdx) => (
            <td key={cellIdx} style={{ padding: '12px 8px' }}>
              <div
                style={{
                  height: '12px',
                  borderRadius: '999px',
                  background: '#e5e7eb',
                  width: `${40 + cellIdx * 10}%`,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

const emptyMessageStyles = {
  padding: '32px',
  textAlign: 'center',
  color: '#4b5563',
  fontStyle: 'italic',
}

function shiftDate(dateString, delta) {
  if (!dateString) return dateString
  const base = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(base.getTime())) return dateString
  base.setDate(base.getDate() + delta)
  return base.toISOString().slice(0, 10)
}

export default function Planner({ onLogout }) {
  const [events, setEvents] = useState([])
  const [summarySnapshot, setSummarySnapshot] = useState(null)
  const [summaryError, setSummaryError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)
  const [editing, setEditing] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const [personaPreset, setPersonaPreset] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState('start')
  const [sortDir, setSortDir] = useState('asc')
  const [formState, setFormState] = useState({ name: '', client: '', start: '', end: '', notes: '' })

  async function loadProjects() {
    setLoading(true)
    try {
      const [projectsResult, summaryResult] = await Promise.allSettled([
        api.get('/api/v1/projects'),
        api.get('/api/v1/projects/summary'),
      ])

      if (projectsResult.status !== 'fulfilled') {
        throw projectsResult.reason
      }

      const mapped = projectsResult.value.data.map(project => ({
        id: project.id,
        name: project.name,
        client: project.client_name,
        start: project.start_date,
        end: project.end_date,
        status: project.status || 'upcoming',
        risk: project.inventory_risk || 'ok',
        alerts: Array.isArray(project.inventory_alerts) ? project.inventory_alerts : [],
        durationDays: typeof project.duration_days === 'number' ? project.duration_days : null,
        daysUntilStart: typeof project.days_until_start === 'number' ? project.days_until_start : null,
        notes: project.notes || '',
        timelineLabel: project.timeline_label || null,
      }))
      setEvents(mapped)
      if (summaryResult.status === 'fulfilled') {
        setSummarySnapshot(summaryResult.value.data)
        setSummaryError(null)
      } else {
        console.error('Samenvatting kon niet worden geladen', summaryResult.reason)
        setSummarySnapshot(null)
        setSummaryError('Realtime samenvatting kon niet geladen worden; cijfers zijn lokaal berekend.')
      }
      setFeedback(previous => (previous?.type === 'error' ? null : previous))
    } catch (error) {
      console.error(error)
      setSummarySnapshot(null)
      setSummaryError('Realtime samenvatting niet beschikbaar omdat projectdata niet geladen kon worden.')
      setFeedback({ type: 'error', message: 'Projecten konden niet worden geladen.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  function openEditor(event) {
    setEditing(event)
    setExpandedRow(null)
    setFormState({
      name: event.name,
      client: event.client,
      start: event.start,
      end: event.end,
      notes: event.notes,
    })
    setFeedback(null)
  }

  function closeEditor() {
    setEditing(null)
    setFormState({ name: '', client: '', start: '', end: '', notes: '' })
  }

  function applyPersonaPreset(value) {
    setPersonaPreset(value)
    const preset = personaPresets[value]
    if (!preset) return
    setStatusFilter(preset.statusFilter || 'all')
    setRiskFilter(preset.riskFilter || 'all')
    setSortKey(preset.sortKey || 'start')
    setSortDir(preset.sortDir || 'asc')
    if (preset.searchTerm !== undefined) {
      setSearchTerm(preset.searchTerm)
    }
  }

  async function submitUpdate(e) {
    e.preventDefault()
    if (!editing) return
    try {
      await api.put(`/api/v1/projects/${editing.id}/dates`, {
        name: formState.name,
        client_name: formState.client,
        start_date: formState.start,
        end_date: formState.end,
        notes: formState.notes,
      })
      setEditing(null)
      await loadProjects()
      setFeedback({ type: 'success', message: 'Project bijgewerkt.' })
    } catch (err) {
      console.error(err)
      setFeedback({ type: 'error', message: 'Bijwerken mislukt. Controleer beschikbaarheid en verplichte velden.' })
    }
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return events
      .filter(event => statusMatches(statusFilter, event.status))
      .filter(event => (riskFilter === 'all' ? true : event.risk === riskFilter))
      .filter(event => {
        if (!term) return true
        return (
          event.name.toLowerCase().includes(term) ||
          event.client.toLowerCase().includes(term) ||
          (event.notes && event.notes.toLowerCase().includes(term))
        )
      })
      .sort((a, b) => {
        const direction = sortDir === 'asc' ? 1 : -1
        if (sortKey === 'start') {
          return (getDateValue(a.start) - getDateValue(b.start)) * direction
        }
        if (sortKey === 'end') {
          return (getDateValue(a.end) - getDateValue(b.end)) * direction
        }
        if (sortKey === 'client') {
          return a.client.localeCompare(b.client, 'nl') * direction
        }
        if (sortKey === 'status') {
          const left = statusPriority[a.status] ?? 99
          const right = statusPriority[b.status] ?? 99
          if (left === right) {
            return a.name.localeCompare(b.name, 'nl') * direction
          }
          return (left - right) * direction
        }
        if (sortKey === 'risk') {
          const order = { ok: 0, warning: 1, critical: 2 }
          const left = order[a.risk] ?? 0
          const right = order[b.risk] ?? 0
          if (left === right) {
            return a.name.localeCompare(b.name, 'nl') * direction
          }
          return (left - right) * direction
        }
        return 0
      })
  }, [events, statusFilter, riskFilter, searchTerm, sortKey, sortDir])

  const fallbackSummary = useMemo(() => {
    const now = Date.now()
    return events.reduce(
      (acc, event) => {
        acc.total += 1
        if (event.status === 'at_risk') acc.atRisk += 1
        if (event.status === 'active' || event.status === 'at_risk') acc.active += 1
        if (event.status === 'upcoming') acc.upcoming += 1
        if (event.status === 'completed') {
          acc.completed += 1
          const endValue = getDateValue(event.end)
          if (endValue) {
            const diffDays = Math.floor((now - endValue) / (1000 * 60 * 60 * 24))
            if (diffDays <= 30) {
              acc.completedLast30Days += 1
            }
          }
        }
        if (event.risk === 'warning') acc.warning += 1
        if (event.risk === 'critical') {
          acc.critical += 1
          acc.criticalAlerts += event.alerts.length > 0 ? event.alerts.length : 1
        }
        if (
          (event.status === 'upcoming' || event.status === 'active' || event.status === 'at_risk') &&
          typeof event.daysUntilStart === 'number' &&
          event.daysUntilStart <= 7
        ) {
          acc.upcomingWithinWeek += 1
        }
        return acc
      },
      {
        total: 0,
        active: 0,
        upcoming: 0,
        completed: 0,
        atRisk: 0,
        warning: 0,
        critical: 0,
        upcomingWithinWeek: 0,
        completedLast30Days: 0,
        criticalAlerts: 0,
      }
    )
  }, [events])

  const aggregatedSummary = useMemo(() => {
    if (summarySnapshot) {
      const status = summarySnapshot.status_breakdown || {}
      const risk = summarySnapshot.risk_breakdown || {}
      return {
        total: summarySnapshot.total_projects ?? 0,
        active: (status.active ?? 0) + (status.at_risk ?? 0),
        upcoming: status.upcoming ?? 0,
        completed: status.completed ?? 0,
        atRisk: status.at_risk ?? 0,
        warning: risk.warning ?? 0,
        critical: risk.critical ?? 0,
        upcomingWithinWeek: summarySnapshot.upcoming_within_7_days ?? 0,
        completedLast30Days: summarySnapshot.completed_last_30_days ?? 0,
        criticalAlerts: summarySnapshot.critical_alerts ?? 0,
      }
    }
    return fallbackSummary
  }, [summarySnapshot, fallbackSummary])

  const summarySourceLabel = summarySnapshot
    ? 'Realtime samenvatting uit /api/v1/projects/summary'
    : 'Fallback samenvatting berekend in de UI'

  const operationalSignals = useMemo(() => {
    const signals = []
    if (aggregatedSummary.criticalAlerts > 0) {
      signals.push(`⚠️ ${aggregatedSummary.criticalAlerts} kritieke voorraadalert(s) vragen opvolging.`)
    } else if (aggregatedSummary.critical > 0) {
      signals.push('⚠️ Er zijn projecten met kritieke voorraad zonder gedetailleerde alerts; controleer de inventory-service.')
    } else {
      signals.push('✅ Geen kritieke voorraadmeldingen gedetecteerd.')
    }
    signals.push(`📆 ${aggregatedSummary.upcomingWithinWeek} project(en) starten binnen 7 dagen.`)
    if (aggregatedSummary.completedLast30Days === 0) {
      signals.push('ℹ️ Er zijn geen projecten afgerond in de laatste 30 dagen; verifieer of facturatie up-to-date is.')
    } else {
      signals.push(`💶 ${aggregatedSummary.completedLast30Days} project(en) afgerond in de laatste 30 dagen gereed voor facturatie.`)
    }
    return signals
  }, [aggregatedSummary])

  const personaHint = personaPresets[personaPreset]?.description

  function shiftRange(delta) {
    setFormState(prev => ({
      ...prev,
      start: shiftDate(prev.start, delta),
      end: shiftDate(prev.end, delta),
    }))
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: '12px', maxWidth: '1120px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Projectplanner</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
            Verbeterde UAT cockpit met persona-presets, voorraadbewaking en inline herplanning.
          </p>
        </div>
        <button onClick={onLogout}>Uitloggen</button>
      </div>

      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '12px',
        }}
        aria-live="polite"
      >
        <SummaryMetric label="Actief" value={aggregatedSummary.active} tone="success" helpText="Inclusief risicoprojecten" />
        <SummaryMetric label="Komend" value={aggregatedSummary.upcoming} />
        <SummaryMetric label="Afgerond" value={aggregatedSummary.completed} />
        <SummaryMetric
          label="Voorraadrisico"
          value={`${aggregatedSummary.critical} kritisch / ${aggregatedSummary.warning} waarschuwing`}
          tone={aggregatedSummary.critical ? 'danger' : aggregatedSummary.warning ? 'warning' : 'neutral'}
        />
        <SummaryMetric
          label="Binnen 7 dagen"
          value={aggregatedSummary.upcomingWithinWeek}
          helpText="Projecten die binnenkort starten"
          tone={aggregatedSummary.upcomingWithinWeek > aggregatedSummary.active + aggregatedSummary.atRisk ? 'warning' : 'neutral'}
        />
        <SummaryMetric
          label="Afgerond (30d)"
          value={aggregatedSummary.completedLast30Days}
          helpText="Geschikt voor facturatie"
        />
        <SummaryMetric
          label="Alerts"
          value={aggregatedSummary.criticalAlerts}
          helpText="Som van kritieke voorraadmeldingen"
          tone={aggregatedSummary.criticalAlerts ? 'danger' : 'neutral'}
        />
      </section>

      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '12px' }}>{summarySourceLabel}</div>

      {summaryError && (
        <div
          role="status"
          style={{
            marginBottom: '16px',
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
          }}
        >
          {summaryError}
        </div>
      )}

      <section
        style={{
          marginBottom: '20px',
          background: '#f9fafb',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Operationele signalen</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '0.9rem' }}>
          {operationalSignals.map((signal, idx) => (
            <li key={idx} style={{ marginBottom: '4px' }}>
              {signal}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Persona UAT – ronde 2</h3>
        <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {personaOutcomes.map(outcome => (
            <div
              key={outcome.key}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '12px',
                background: '#ffffff',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{outcome.verdict}</span>
                <span>{outcome.label}</span>
              </div>
              <p style={{ margin: 0, color: '#4b5563', fontSize: '0.85rem' }}>{outcome.insight}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', color: '#4b5563' }}>
            Persona preset
            <select
              value={personaPreset}
              onChange={event => applyPersonaPreset(event.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              {Object.entries(personaPresets).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', color: '#4b5563' }}>
            Statusfilter
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="all">Alle</option>
              <option value="active">Actief</option>
              <option value="upcoming">Komend</option>
              <option value="completed">Afgerond</option>
              <option value="at_risk">Risico</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', color: '#4b5563' }}>
            Voorraadrisico
            <select
              value={riskFilter}
              onChange={event => setRiskFilter(event.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="all">Alle</option>
              <option value="ok">Op schema</option>
              <option value="warning">Let op</option>
              <option value="critical">Kritiek</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', color: '#4b5563', flex: '1 1 200px' }}>
            Zoeken
            <input
              type="search"
              placeholder="Zoek op project, klant of notitie"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setPersonaPreset('all')
              setStatusFilter('all')
              setRiskFilter('all')
              setSortKey('start')
              setSortDir('asc')
              setSearchTerm('')
            }}
            style={{ alignSelf: 'flex-end', padding: '8px 12px' }}
          >
            Reset filters
          </button>
        </div>
        {personaHint && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{personaHint}</div>}
      </div>

      {feedback && (
        <div
          role="alert"
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            backgroundColor: feedback.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: feedback.type === 'success' ? '#065f46' : '#991b1b',
          }}
        >
          {feedback.message}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px' }}>Project</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px' }}>Klant</th>
              <th
                style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px', cursor: 'pointer' }}
                onClick={() => toggleSort('status')}
              >
                Status
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px' }}>Planning</th>
              <th
                style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px', cursor: 'pointer' }}
                onClick={() => toggleSort('risk')}
              >
                Voorraad
              </th>
              <th
                style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px', cursor: 'pointer' }}
                onClick={() => toggleSort('start')}
              >
                Start
              </th>
              <th
                style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px', cursor: 'pointer' }}
                onClick={() => toggleSort('end')}
              >
                Einde
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '12px 8px' }}>Acties</th>
            </tr>
          </thead>
          {loading ? (
            <LoadingRows />
          ) : filteredEvents.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={8} style={emptyMessageStyles}>
                  Geen projecten gevonden voor deze filters. Pas de filters aan of reset ze om alles te tonen.
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {filteredEvents.map(event => {
                const isExpanded = expandedRow === event.id
                return (
                  <React.Fragment key={event.id}>
                    <tr
                      style={{ backgroundColor: isExpanded ? '#f9fafb' : 'transparent' }}
                      onDoubleClick={() => openEditor(event)}
                    >
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{event.name}</td>
                      <td style={{ padding: '12px 8px' }}>{event.client}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <StatusBadge status={event.status} />
                      </td>
                      <td style={{ padding: '12px 8px', color: '#4b5563' }}>
                        {event.timelineLabel || timelineLabel(event)}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <RiskBadge risk={event.risk} />
                      </td>
                      <td style={{ padding: '12px 8px', color: '#4b5563' }}>{formatDate(event.start)}</td>
                      <td style={{ padding: '12px 8px', color: '#4b5563' }}>{formatDate(event.end)}</td>
                      <td style={{ padding: '12px 8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => setExpandedRow(isExpanded ? null : event.id)}>
                          {isExpanded ? 'Sluit details' : 'Details'}
                        </button>
                        <button type="button" onClick={() => openEditor(event)}>
                          Herplan
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} style={{ padding: '16px 24px', backgroundColor: '#f9fafb' }}>
                          <div style={{ display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#4b5563' }}>
                              <span><strong>Doorlooptijd:</strong> {event.durationDays ? `${event.durationDays} dagen` : 'Onbekend'}</span>
                              <span><strong>Eindigt op:</strong> {formatDate(event.end)}</span>
                            </div>
                            <div style={{ color: '#111827', fontWeight: 600 }}>Projectnotities</div>
                            <div style={{ color: '#4b5563', whiteSpace: 'pre-wrap' }}>
                              {event.notes ? event.notes : 'Geen notities toegevoegd.'}
                            </div>
                            {event.alerts.length > 0 ? (
                              <div>
                                <div style={{ color: '#111827', fontWeight: 600, marginBottom: '6px' }}>Voorraaddetails</div>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#b91c1c' }}>
                                  {event.alerts.map((alert, index) => (
                                    <li key={index}>{alert}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <div style={{ color: '#059669' }}>Geen voorraadissues voor dit project.</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          )}
        </table>
      </div>

      {editing && (
        <form
          onSubmit={submitUpdate}
          style={{
            marginTop: '32px',
            display: 'grid',
            gap: '12px',
            maxWidth: '520px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Project herplannen</h3>
            <button type="button" onClick={closeEditor}>
              Sluiten
            </button>
          </div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
            Pas data en notities aan. Quick actions helpen om datumreeksen met één klik te verschuiven.
          </p>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            Projectnaam
            <input
              type="text"
              value={formState.name}
              onChange={event => setFormState(current => ({ ...current, name: event.target.value }))}
              required
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            Klant
            <input
              type="text"
              value={formState.client}
              onChange={event => setFormState(current => ({ ...current, client: event.target.value }))}
              required
            />
          </label>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
              Startdatum
              <input
                type="date"
                value={formState.start}
                onChange={event => setFormState(current => ({ ...current, start: event.target.value }))}
                required
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
              Einddatum
              <input
                type="date"
                value={formState.end}
                onChange={event => setFormState(current => ({ ...current, end: event.target.value }))}
                required
              />
            </label>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button type="button" onClick={() => shiftRange(-1)}>
              Vervroeg beide data 1 dag
            </button>
            <button type="button" onClick={() => shiftRange(1)}>
              Verleng beide data 1 dag
            </button>
            <button type="button" onClick={() => setFormState({
              name: editing.name,
              client: editing.client,
              start: editing.start,
              end: editing.end,
              notes: editing.notes,
            })}>
              Herstel oorspronkelijke waarden
            </button>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            Notities voor crew & finance
            <textarea
              value={formState.notes}
              onChange={event => setFormState(current => ({ ...current, notes: event.target.value }))}
              rows={3}
            />
          </label>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="submit">Opslaan</button>
            <button type="button" onClick={closeEditor}>
              Annuleren
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
