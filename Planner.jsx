import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import { brand, brandFontStack, withOpacity } from './branding.js'

const personaPresets = {
  all: {
    label: 'Alle rollen',
    description: 'Toont de volledige planning zonder filters, ideaal voor gezamenlijke UAT-sessies.',
    timeFilter: 'all',
  },
  bart: {
    label: 'Bart de Manager',
    description: 'Focus op lopende en risicovolle producties zodat Bart direct kan bijsturen.',
    statusFilter: 'active',
    riskFilter: 'warning',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'next7',
  },
  anna: {
    label: 'Anna de Planner',
    description: 'Chronologisch overzicht van komende shows met afhankelijkheden en voorraadmatch.',
    statusFilter: 'upcoming',
    riskFilter: 'all',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'next14',
  },
  tom: {
    label: 'Tom de Technicus',
    description: 'Realtime zicht op vandaag lopende opdrachten inclusief briefingnotities.',
    statusFilter: 'active',
    riskFilter: 'ok',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'today',
  },
  carla: {
    label: 'Carla van Front-Office',
    description: 'Upcoming shows gegroepeerd per klant om vragen snel te beantwoorden.',
    statusFilter: 'upcoming',
    riskFilter: 'all',
    sortKey: 'client',
    sortDir: 'asc',
    timeFilter: 'next30',
  },
  frank: {
    label: 'Frank de Financieel Specialist',
    description: 'Afgeronde projecten en documentatie om facturatie te versnellen.',
    statusFilter: 'completed',
    riskFilter: 'all',
    sortKey: 'end',
    sortDir: 'desc',
    timeFilter: 'past30',
  },
  sven: {
    label: 'Sven de Systeembeheerder',
    description: 'Filtert kritieke risico’s en voorraadalerts voor escalatiebeheer.',
    statusFilter: 'all',
    riskFilter: 'critical',
    sortKey: 'risk',
    sortDir: 'desc',
    timeFilter: 'all',
  },
  isabelle: {
    label: 'Isabelle de International',
    description: 'Kijkt weken vooruit om internationale producties tijdig te synchroniseren.',
    statusFilter: 'upcoming',
    riskFilter: 'all',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'next30',
  },
  peter: {
    label: 'Peter de Power-User',
    description: 'Combineert status- en risicoviews voor API-automatiseringen en alerts.',
    statusFilter: 'all',
    riskFilter: 'warning',
    sortKey: 'status',
    sortDir: 'asc',
    timeFilter: 'all',
  },
  nadia: {
    label: 'Nadia de Nieuweling',
    description: 'Behoudt een rustige kijk op de eerstvolgende simpele taken voor onboarding.',
    statusFilter: 'upcoming',
    riskFilter: 'ok',
    sortKey: 'start',
    sortDir: 'asc',
    timeFilter: 'next7',
  },
  david: {
    label: 'David de Developer',
    description: 'Ziet alle statussen tegelijk om integraties en automatiseringen te testen.',
    statusFilter: 'all',
    riskFilter: 'all',
    sortKey: 'status',
    sortDir: 'asc',
    timeFilter: 'all',
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
  active: brand.colors.primary,
  upcoming: brand.colors.accent,
  completed: brand.colors.success,
  at_risk: brand.colors.danger,
}

const riskPalette = {
  ok: brand.colors.success,
  warning: brand.colors.warning,
  critical: brand.colors.danger,
}

const cardPalette = {
  neutral: withOpacity('#ffffff', 0.92),
  success: withOpacity(brand.colors.success, 0.15),
  warning: withOpacity(brand.colors.warning, 0.16),
  danger: withOpacity(brand.colors.danger, 0.16),
}

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
        backgroundColor: withOpacity(riskPalette[risk] || brand.colors.mutedText, 0.16),
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
        backgroundColor: withOpacity(badgePalette[status] || brand.colors.mutedText, 0.16),
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

function ImpactBadge({ impact }) {
  const palette = impactPalette[impact.tone] || impactPalette.neutral
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: palette.background,
        color: palette.color,
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: 600,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: palette.color }} />
      {impact.label}
    </span>
  )
}

function SummaryMetric({ label, value, tone = 'neutral', helpText }) {
  const accent =
    tone === 'success'
      ? brand.colors.success
      : tone === 'warning'
      ? brand.colors.warning
      : tone === 'danger'
      ? brand.colors.danger
      : brand.colors.primary
  return (
    <div
      style={{
        background: cardPalette[tone] || cardPalette.neutral,
        padding: '16px 18px',
        borderRadius: '16px',
        display: 'grid',
        gap: '6px',
        minWidth: '160px',
        border: `1px solid ${withOpacity(accent, 0.35)}`,
        boxShadow: '0 16px 28px rgba(13, 59, 102, 0.12)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: accent,
            boxShadow: `0 0 0 4px ${withOpacity(accent, 0.18)}`,
          }}
        />
        <div style={{ fontSize: '0.85rem', color: brand.colors.mutedText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </div>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: brand.colors.secondary }}>{value}</div>
      {helpText && <div style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>{helpText}</div>}
    </div>
  )
}

function FinancialPulsePanel({ cards, focusCards = [], focusLabel }) {
  if (!cards.length && !focusCards.length) return null

  return (
    <section
      aria-label="Financiële impact samenvatting"
      style={{
        display: 'grid',
        gap: '12px',
        padding: '20px',
        border: `1px solid ${withOpacity(brand.colors.secondary, 0.08)}`,
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f7f5ff 100%)',
        boxShadow: '0 32px 60px rgba(15, 23, 42, 0.08)',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: brand.colors.secondary }}>Financiële puls</h3>
        <span style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>
          Realtime cashflow-impact per persona
        </span>
      </header>
      {cards.length > 0 && (
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ fontSize: '0.9rem', color: brand.colors.secondary, opacity: 0.78 }}>Portfolio totaal</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {cards.map(card => (
              <SummaryMetric
                key={card.key}
                label={card.title}
                value={card.value}
                tone={card.tone}
                helpText={card.helpText}
              />
            ))}
          </div>
        </div>
      )}
      {focusCards.length > 0 && focusLabel && (
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ fontSize: '0.9rem', color: brand.colors.secondary, opacity: 0.78 }}>
            Focus: {focusLabel}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {focusCards.map(card => (
              <SummaryMetric
                key={`${card.key}-focus`}
                label={card.title}
                value={card.value}
                tone={card.tone}
                helpText={card.helpText}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function LoadingRows() {
  return (
    <tbody>
      {[...Array(3)].map((_, idx) => (
        <tr key={idx}>
          {[...Array(9)].map((__, cellIdx) => (
            <td key={cellIdx} style={{ padding: '12px 8px' }}>
              <div
                style={{
                  height: '12px',
                  borderRadius: '999px',
                  background: withOpacity(brand.colors.surfaceMuted, 0.7),
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
  padding: '36px',
  textAlign: 'center',
  color: brand.colors.mutedText,
  fontStyle: 'italic',
  background: withOpacity('#ffffff', 0.8),
  borderRadius: 18,
}

const filterControlStyle = {
  padding: '10px 14px',
  borderRadius: 12,
  border: `1px solid ${withOpacity(brand.colors.primary, 0.25)}`,
  background: withOpacity('#ffffff', 0.85),
  color: brand.colors.secondary,
  fontSize: '0.95rem',
  minWidth: 180,
}

const tableCellStyle = {
  padding: '14px 16px',
  borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.08)}`,
  color: brand.colors.secondary,
  fontSize: '0.95rem',
  verticalAlign: 'top',
}

const primaryActionStyle = {
  padding: '8px 16px',
  borderRadius: 999,
  border: 'none',
  backgroundImage: brand.colors.gradient,
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 14px 28px rgba(11, 197, 234, 0.2)',
}

const secondaryActionStyle = {
  padding: '8px 16px',
  borderRadius: 999,
  border: `1px solid ${withOpacity(brand.colors.primary, 0.35)}`,
  background: withOpacity('#ffffff', 0.85),
  color: brand.colors.primaryDark,
  fontWeight: 600,
  cursor: 'pointer',
}

const tertiaryActionStyle = {
  padding: '8px 14px',
  borderRadius: 999,
  border: `1px solid ${withOpacity(brand.colors.secondary, 0.18)}`,
  background: withOpacity(brand.colors.surfaceMuted, 0.7),
  color: brand.colors.secondary,
  fontWeight: 600,
  cursor: 'pointer',
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
  const [timeFilter, setTimeFilter] = useState('all')
  const [formState, setFormState] = useState({ name: '', client: '', start: '', end: '', notes: '' })

  async function loadProjects() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/v1/projects')
      const mapped = data.map(project => ({
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
      }))
      setEvents(mapped)
      setFeedback(previous => (previous?.type === 'error' ? null : previous))
    } catch (error) {
      console.error(error)
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
    setTimeFilter(preset.timeFilter || 'all')
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
      .filter(event => matchesTimeFilter(event, timeFilter))
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
  }, [events, statusFilter, riskFilter, searchTerm, sortKey, sortDir, timeFilter])

  const summary = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        acc.total += 1
        if (event.status === 'at_risk') acc.atRisk += 1
        if (event.status === 'active' || event.status === 'at_risk') acc.active += 1
        if (event.status === 'upcoming') acc.upcoming += 1
        if (event.status === 'completed') acc.completed += 1
        if (event.risk === 'warning') acc.warning += 1
        if (event.risk === 'critical') acc.critical += 1
        return acc
      },
      { total: 0, active: 0, upcoming: 0, completed: 0, atRisk: 0, warning: 0, critical: 0 }
    )
  }, [events])

  const financialSignals = useMemo(() => computeFinancialSignals(events), [events])
  const financialCards = useMemo(() => buildFinancialCards(financialSignals), [financialSignals])
  const filteredFinancialSignals = useMemo(() => computeFinancialSignals(filteredEvents), [filteredEvents])
  const focusFinancialCards = useMemo(() => buildFinancialCards(filteredFinancialSignals), [filteredFinancialSignals])

  const personaHint = personaPresets[personaPreset]?.description

  const personaInsights = useMemo(
    () => buildPersonaInsights(personaPreset, events, summary, financialSignals),
    [personaPreset, events, summary, financialSignals]
  )

  const personaPlaybook = useMemo(
    () => buildPersonaPlaybook(personaPreset, filteredEvents, filteredFinancialSignals),
    [personaPreset, filteredEvents, filteredFinancialSignals]
  )

  function handlePersonaQuickAction(actionKey) {
    switch (actionKey) {
      case 'showExecutivePulse':
        setStatusFilter('all')
        setRiskFilter('all')
        setSortKey('risk')
        setSortDir('desc')
        setTimeFilter('all')
        setSearchTerm('')
        break
      case 'focusCritical':
        setStatusFilter('all')
        setRiskFilter('critical')
        setSortKey('risk')
        setSortDir('desc')
        setTimeFilter('today')
        break
      case 'showReadyToBill':
        setStatusFilter('completed')
        setRiskFilter('all')
        setSortKey('end')
        setSortDir('desc')
        setTimeFilter('past30')
        setSearchTerm('')
        break
      case 'focusCashflow':
        setStatusFilter('completed')
        setRiskFilter('all')
        setSortKey('end')
        setSortDir('desc')
        setTimeFilter('past30')
        setSearchTerm('')
        break
      case 'showPlannerHorizon':
        setStatusFilter('upcoming')
        setRiskFilter('all')
        setSortKey('start')
        setSortDir('asc')
        setTimeFilter('next14')
        setSearchTerm('')
        break
      case 'highlightDependencies':
        setStatusFilter('at_risk')
        setRiskFilter('all')
        setSortKey('start')
        setSortDir('asc')
        setTimeFilter('next7')
        break
      case 'crewToday':
        setStatusFilter('active')
        setRiskFilter('all')
        setTimeFilter('today')
        setSortKey('start')
        setSortDir('asc')
        break
      case 'crewDocs':
        setStatusFilter('active')
        setRiskFilter('all')
        setSortKey('status')
        setSortDir('asc')
        setTimeFilter('next7')
        break
      case 'viewerHighlights':
        setStatusFilter('all')
        setRiskFilter('warning')
        setSortKey('status')
        setSortDir('asc')
        setTimeFilter('next30')
        setSearchTerm('')
        break
      case 'viewerCalm':
        setStatusFilter('active')
        setRiskFilter('all')
        setSortKey('start')
        setSortDir('asc')
        setTimeFilter('next14')
        setSearchTerm('')
        break
      case 'carlaClients':
        setStatusFilter('upcoming')
        setRiskFilter('all')
        setSortKey('client')
        setSortDir('asc')
        setTimeFilter('next30')
        setSearchTerm('')
        break
      case 'svenSystems':
        setStatusFilter('all')
        setRiskFilter('critical')
        setSortKey('risk')
        setSortDir('desc')
        setTimeFilter('all')
        break
      case 'isabelleWindow':
        setStatusFilter('upcoming')
        setRiskFilter('all')
        setSortKey('start')
        setSortDir('asc')
        setTimeFilter('next30')
        setSearchTerm('')
        break
      case 'peterAutomation':
        setStatusFilter('all')
        setRiskFilter('warning')
        setSortKey('status')
        setSortDir('asc')
        setTimeFilter('all')
        break
      case 'nadiaCalm':
        setStatusFilter('upcoming')
        setRiskFilter('ok')
        setSortKey('start')
        setSortDir('asc')
        setTimeFilter('next7')
        setSearchTerm('')
        break
      case 'davidAudit':
        setStatusFilter('all')
        setRiskFilter('all')
        setSortKey('status')
        setSortDir('asc')
        setTimeFilter('all')
        break
      case 'resetPersona':
        applyPersonaPreset(personaPreset)
        break
      default:
        setStatusFilter('all')
        setRiskFilter('all')
        setSortKey('start')
        setSortDir('asc')
        setTimeFilter('all')
        break
    }
  }

  function shiftRange(delta) {
    setFormState(prev => ({
      ...prev,
      start: shiftDate(prev.start, delta),
      end: shiftDate(prev.end, delta),
    }))
  }

  return (
    <div
      style={{
        background: brand.colors.surface,
        minHeight: '100vh',
        fontFamily: brandFontStack,
        padding: '32px 20px',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fff',
            borderRadius: 28,
            padding: '28px 32px',
            boxShadow: '0 24px 60px rgba(13, 59, 102, 0.16)',
            border: `1px solid ${brand.colors.outline}`,
          }}
        >
          <div style={{ display: 'grid', gap: 8 }}>
            <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.22em', color: brand.colors.mutedText }}>
              Sevensa Operations
            </span>
            <h2 style={{ margin: 0, fontSize: '2rem', color: brand.colors.secondary }}>Projectplanner</h2>
            <p style={{ margin: 0, color: brand.colors.mutedText, maxWidth: 520 }}>
              Persona presets, voorraadbewaking en inline herplanning in één AI-gestuurde cockpit.
            </p>
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: '10px 20px',
              borderRadius: 999,
              border: 'none',
              backgroundImage: brand.colors.gradient,
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 18px 34px rgba(11, 197, 234, 0.24)',
            }}
          >
            Uitloggen
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
          aria-live="polite"
        >
          <SummaryMetric label="Actief" value={summary.active} tone="success" helpText="Inclusief risicoprojecten" />
          <SummaryMetric label="Komend" value={summary.upcoming} />
          <SummaryMetric label="Afgerond" value={summary.completed} />
        <SummaryMetric
          label="Voorraadrisico"
          value={`${summary.critical} kritisch / ${summary.warning} waarschuwing`}
          tone={summary.critical ? 'danger' : summary.warning ? 'warning' : 'neutral'}
        />
      </div>

        <div
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: '24px 28px',
            border: `1px solid ${brand.colors.outline}`,
            boxShadow: '0 18px 44px rgba(13, 59, 102, 0.12)',
            display: 'grid',
            gap: 18,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', color: brand.colors.mutedText }}>
              Persona preset
              <select
                value={personaPreset}
                onChange={event => applyPersonaPreset(event.target.value)}
                style={filterControlStyle}
              >
                {Object.entries(personaPresets).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', color: brand.colors.mutedText }}>
              Statusfilter
              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
                style={filterControlStyle}
              >
                <option value="all">Alle</option>
                <option value="active">Actief</option>
                <option value="upcoming">Komend</option>
                <option value="completed">Afgerond</option>
                <option value="at_risk">Risico</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', color: brand.colors.mutedText }}>
              Voorraadrisico
              <select
                value={riskFilter}
                onChange={event => setRiskFilter(event.target.value)}
                style={filterControlStyle}
              >
                <option value="all">Alle</option>
                <option value="ok">Op schema</option>
                <option value="warning">Let op</option>
                <option value="critical">Kritiek</option>
              </select>
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: '0.85rem',
                color: brand.colors.mutedText,
                flex: '1 1 220px',
              }}
            >
              Zoeken
              <input
                type="search"
                placeholder="Zoek op project, klant of notitie"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                style={filterControlStyle}
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
              style={{
                alignSelf: 'flex-end',
                padding: '10px 18px',
                borderRadius: 999,
                border: 'none',
                background: withOpacity(brand.colors.primary, 0.12),
                color: brand.colors.primaryDark,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset filters
            </button>
          </div>
          {personaHint && (
            <div style={{ fontSize: '0.9rem', color: brand.colors.mutedText }}>{personaHint}</div>
          )}
        </div>

        {feedback && (
          <div
            role="alert"
            style={{
              padding: '14px 18px',
              borderRadius: 14,
              backgroundColor:
                feedback.type === 'success'
                  ? withOpacity(brand.colors.success, 0.15)
                  : withOpacity(brand.colors.danger, 0.15),
              color: feedback.type === 'success' ? brand.colors.secondary : '#9B1C1C',
              border: `1px solid ${withOpacity(
                feedback.type === 'success' ? brand.colors.success : brand.colors.danger,
                0.35
              )}`,
            }}
          >
            {feedback.message}
          </div>
        )}

        <div
          style={{
            overflowX: 'auto',
            background: '#fff',
            borderRadius: 28,
            border: `1px solid ${brand.colors.outline}`,
            boxShadow: '0 20px 48px rgba(13, 59, 102, 0.16)',
            padding: '12px',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                {['Project', 'Klant', 'Status', 'Planning', 'Voorraad', 'Start', 'Einde', 'Acties'].map(label => {
                  const sortable = ['Status', 'Voorraad', 'Start', 'Einde'].includes(label)
                  const sortKeyMap = { Status: 'status', Voorraad: 'risk', Start: 'start', Einde: 'end' }
                  return (
                    <th
                      key={label}
                      style={{
                        textAlign: 'left',
                        padding: '14px 16px',
                        background: withOpacity(brand.colors.secondary, 0.06),
                        color: brand.colors.secondary,
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        cursor: sortable ? 'pointer' : 'default',
                        borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.12)}`,
                        position: 'sticky',
                        top: 0,
                      }}
                      onClick={() => sortable && toggleSort(sortKeyMap[label])}
                    >
                      {label}
                    </th>
                  )
                })}
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
                        style={{
                          backgroundColor: isExpanded ? withOpacity(brand.colors.surfaceMuted, 0.45) : 'transparent',
                          transition: 'background-color 0.2s ease',
                        }}
                        onDoubleClick={() => openEditor(event)}
                      >
                        <td style={tableCellStyle}>{event.name}</td>
                        <td style={tableCellStyle}>{event.client}</td>
                        <td style={tableCellStyle}>
                          <StatusBadge status={event.status} />
                        </td>
                        <td style={{ ...tableCellStyle, color: brand.colors.mutedText }}>{timelineLabel(event)}</td>
                        <td style={tableCellStyle}>
                          <RiskBadge risk={event.risk} />
                        </td>
                        <td style={{ ...tableCellStyle, color: brand.colors.mutedText }}>{formatDate(event.start)}</td>
                        <td style={{ ...tableCellStyle, color: brand.colors.mutedText }}>{formatDate(event.end)}</td>
                        <td style={{ ...tableCellStyle, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setExpandedRow(isExpanded ? null : event.id)}
                            style={secondaryActionStyle}
                          >
                            {isExpanded ? 'Sluit details' : 'Details'}
                          </button>
                          <button type="button" onClick={() => openEditor(event)} style={primaryActionStyle}>
                            Herplan
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ padding: '18px 28px', backgroundColor: withOpacity('#ffffff', 0.85) }}>
                            <div style={{ display: 'grid', gap: '12px' }}>
                              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: brand.colors.mutedText }}>
                                <span><strong>Doorlooptijd:</strong> {event.durationDays ? `${event.durationDays} dagen` : 'Onbekend'}</span>
                                <span><strong>Eindigt op:</strong> {formatDate(event.end)}</span>
                              </div>
                              <div style={{ color: brand.colors.secondary, fontWeight: 600 }}>Projectnotities</div>
                              <div style={{ color: brand.colors.mutedText, whiteSpace: 'pre-wrap' }}>
                                {event.notes ? event.notes : 'Geen notities toegevoegd.'}
                              </div>
                              {event.alerts.length > 0 ? (
                                <div>
                                  <div style={{ color: brand.colors.secondary, fontWeight: 600, marginBottom: '6px' }}>Voorraaddetails</div>
                                  <ul style={{ margin: 0, paddingLeft: '20px', color: brand.colors.danger }}>
                                    {event.alerts.map((alert, index) => (
                                      <li key={index}>{alert}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <div style={{ color: brand.colors.success }}>Geen voorraadissues voor dit project.</div>
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
              marginTop: 32,
              display: 'grid',
              gap: 16,
              maxWidth: 560,
              padding: '28px 32px',
              border: `1px solid ${brand.colors.outline}`,
              borderRadius: 24,
              background: '#fff',
              boxShadow: '0 18px 44px rgba(13, 59, 102, 0.14)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h3 style={{ margin: 0, color: brand.colors.secondary }}>Project herplannen</h3>
              <button type="button" onClick={closeEditor} style={secondaryActionStyle}>
                Sluiten
              </button>
            </div>
            <p style={{ margin: 0, color: brand.colors.mutedText }}>
              Pas data en notities aan. Quick actions helpen om datumreeksen met één klik te verschuiven.
            </p>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, color: brand.colors.mutedText }}>
              Projectnaam
              <input
                type="text"
                value={formState.name}
                onChange={event => setFormState(current => ({ ...current, name: event.target.value }))}
                required
                style={{ ...filterControlStyle, width: '100%' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, color: brand.colors.mutedText }}>
              Klant
              <input
                type="text"
                value={formState.client}
                onChange={event => setFormState(current => ({ ...current, client: event.target.value }))}
                required
                style={{ ...filterControlStyle, width: '100%' }}
              />
            </label>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 200px', color: brand.colors.mutedText }}>
                Startdatum
                <input
                  type="date"
                  value={formState.start}
                  onChange={event => setFormState(current => ({ ...current, start: event.target.value }))}
                  required
                  style={{ ...filterControlStyle, width: '100%' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 200px', color: brand.colors.mutedText }}>
                Einddatum
                <input
                  type="date"
                  value={formState.end}
                  onChange={event => setFormState(current => ({ ...current, end: event.target.value }))}
                  required
                  style={{ ...filterControlStyle, width: '100%' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button type="button" onClick={() => shiftRange(-1)} style={tertiaryActionStyle}>
                Vervroeg beide data 1 dag
              </button>
              <button type="button" onClick={() => shiftRange(1)} style={tertiaryActionStyle}>
                Verleng beide data 1 dag
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormState({
                    name: editing.name,
                    client: editing.client,
                    start: editing.start,
                    end: editing.end,
                    notes: editing.notes,
                  })
                }
                style={tertiaryActionStyle}
              >
                Herstel oorspronkelijke waarden
              </button>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, color: brand.colors.mutedText }}>
              Notities voor crew & finance
              <textarea
                value={formState.notes}
                onChange={event => setFormState(current => ({ ...current, notes: event.target.value }))}
                rows={3}
                style={{
                  ...filterControlStyle,
                  width: '100%',
                  minHeight: 96,
                  resize: 'vertical',
                }}
              />
            </label>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="submit" style={primaryActionStyle}>
                Opslaan
              </button>
              <button type="button" onClick={closeEditor} style={secondaryActionStyle}>
                Annuleren
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
