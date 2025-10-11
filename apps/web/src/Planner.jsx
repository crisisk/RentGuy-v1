import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import TipBanner from './TipBanner.jsx'
import ObservabilitySummary from './ObservabilitySummary.jsx'
import { brand, brandFontStack, withOpacity } from './theme.js'

const personaPresets = {
  all: {
    label: 'Alle rollen',
    description: 'Toont de volledige planning zonder filters, ideaal voor gezamenlijke UAT-sessies.',
  },
  bart: {
    label: 'Bart de Manager',
    statusFilter: 'active',
    riskFilter: 'warning',
    sortKey: 'start_offset',
    sortDir: 'asc',
    description: 'Focus op lopende projecten en voorraadwaarschuwingen zodat hij direct kan bijsturen.',
  },
  anna: {
    label: 'Anna de Planner',
    statusFilter: 'upcoming',
    sortKey: 'start_offset',
    sortDir: 'asc',
    description: 'Legt de nadruk op komende projecten in chronologische volgorde voor detailplanning.',
  },
  tom: {
    label: 'Tom de Technicus',
    statusFilter: 'active',
    riskFilter: 'ok',
    sortKey: 'start_offset',
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
    sortKey: 'start_offset',
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
    sortKey: 'start_offset',
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

const personaGuidance = {
  all: {
    focus: 'Gebruik de cockpit om snel tussen persona-standpunten te schakelen.',
    checklist: [
      'Pas filters toe en bewaar de selectie: je voorkeuren worden nu automatisch onthouden.',
      'Vouw details open met “Details” of dubbelklik voor directe herplanning.',
    ],
    insight: summary => `Er draaien ${summary.active} actieve projecten en ${summary.critical} met kritieke voorraad.`,
  },
  bart: {
    focus: 'Geen kritieke voorraadblokkades op lopende projecten.',
    checklist: [
      'Gebruik het risicofilter om kritieke meldingen eerst te zien.',
      'Controleer dat actieve projecten een opvolgnotitie hebben voor het team.',
    ],
    insight: summary =>
      summary.critical > 0
        ? `Let op: ${summary.critical} project(en) wachten op voorraadopvolging.`
        : 'Alle lopende projecten hebben voldoende voorraad.',
  },
  anna: {
    focus: 'Chronologisch overzicht van komende projecten behouden.',
    checklist: [
      'Gebruik de nieuwe “Tijd tot start”-kolom om planningsgaten te spotten.',
      'Versleep start- en einddatums met de quick actions in de editor.',
    ],
    insight: summary => `Er staan ${summary.upcoming} projecten ingepland na vandaag.`,
  },
  tom: {
    focus: 'Werkdag start met een actuele takenlijst.',
    checklist: [
      'Lees crew-notities in het detailpaneel voordat je vertrekt.',
      'Controleer einddatums zodat opleveringen niet overlopen.',
    ],
    insight: summary => `Momenteel ${summary.active} project(en) waar je direct aan werkt.`,
  },
  carla: {
    focus: 'Klantvragen snel beantwoorden met duidelijke statusinformatie.',
    checklist: [
      'Sorteer op klantnaam om klantdossiers gegroepeerd te houden.',
      'Gebruik de planning- en countdownkolommen voor verwachte leverdatums.',
    ],
    insight: summary => `Nog ${summary.upcoming} actieve reserveringen onderweg naar klanten.`,
  },
  frank: {
    focus: 'Afgeronde projecten klaarzetten voor facturatie.',
    checklist: [
      'Filter op “Afgerond” en exporteer de lijst naar finance.',
      'Leg afwijkingen vast in de notities zodat facturen sluitend zijn.',
    ],
    insight: summary => `Er wachten ${summary.completed} projecten op facturatiecontrole.`,
  },
  sven: {
    focus: 'Voorkom voorraad-escalaties voor kritieke projecten.',
    checklist: [
      'Filter op kritieke risico’s en los de alerts uit het detailpaneel op.',
      'Controleer of er alternatieve items beschikbaar zijn via het inventory-team.',
    ],
    insight: summary =>
      summary.critical > 0
        ? `${summary.critical} project(en) hebben onmiddellijke voorraadactie nodig.`
        : 'Er zijn geen kritieke voorraadwaarschuwingen.',
  },
  isabelle: {
    focus: 'Internationale events ruim op tijd afstemmen.',
    checklist: [
      'Let op projecten die binnen 7 dagen starten voor vertaaldeadlines.',
      'Gebruik notities om valuta- of douanevereisten vast te leggen.',
    ],
    insight: summary => `Aantal komende internationale projecten: ${summary.upcoming}.`,
  },
  peter: {
    focus: 'Data voorbereiden voor automatiseringen en API’s.',
    checklist: [
      'Controleer of alle projecten status- en risicodata bevatten.',
      'Gebruik de detailpanelen om voorraadalerts te koppelen aan scripts.',
    ],
    insight: summary => `Risicoprojecten beschikbaar voor monitoring: ${summary.atRisk}.`,
  },
  nadia: {
    focus: 'Gefocust leren zonder informatie-overload.',
    checklist: [
      'Gebruik de preset om enkel eenvoudige komende taken te zien.',
      'Lees de hints onderaan elk detailpaneel voor context.',
    ],
    insight: summary => `Er staan ${summary.upcoming} geplande projecten klaar om kennis op te doen.`,
  },
  david: {
    focus: 'API-consistentie toetsen tijdens testen.',
    checklist: [
      'Controleer dat projectdetails dezelfde metadata tonen als de API respons.',
      'Gebruik de countdownkolom om datumcalculaties te valideren.',
    ],
    insight: summary => `API levert ${summary.total} projecten terug met uitgebreide metadata.`,
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
  neutral: withOpacity('#ffffff', 0.9),
  success: withOpacity(brand.colors.success, 0.16),
  warning: withOpacity(brand.colors.warning, 0.16),
  danger: withOpacity(brand.colors.danger, 0.16),
}

const rowPalette = {
  at_risk: withOpacity(brand.colors.danger, 0.12),
  active: withOpacity(brand.colors.primary, 0.12),
  upcoming: withOpacity(brand.colors.accent, 0.12),
  completed: withOpacity(brand.colors.success, 0.12),
}

const tableColumnCount = 9

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

function countdownInfo(event) {
  if (event.status === 'completed') {
    return {
      label: 'Afgerond',
      background: withOpacity(brand.colors.mutedText, 0.16),
      color: brand.colors.mutedText,
    }
  }
  if (event.status === 'active') {
    return {
      label: 'Bezig',
      background: withOpacity(brand.colors.primary, 0.2),
      color: brand.colors.primaryDark,
    }
  }
  if (event.status === 'at_risk') {
    if (typeof event.daysUntilStart === 'number') {
      if (event.daysUntilStart <= 0) {
        return {
          label: 'Controle vandaag',
          background: withOpacity(brand.colors.danger, 0.2),
          color: brand.colors.danger,
        }
      }
      if (event.daysUntilStart <= 3) {
        return {
          label: `Controle binnen ${event.daysUntilStart} d`,
          background: withOpacity(brand.colors.warning, 0.22),
          color: brand.colors.warning,
        }
      }
      return {
        label: `Controle in ${event.daysUntilStart} d`,
        background: withOpacity(brand.colors.warning, 0.18),
        color: brand.colors.warning,
      }
    }
    return {
      label: 'Controleer voorraad',
      background: withOpacity(brand.colors.danger, 0.2),
      color: brand.colors.danger,
    }
  }
  if (typeof event.daysUntilStart !== 'number') {
    return {
      label: 'Planning onbekend',
      background: withOpacity(brand.colors.mutedText, 0.14),
      color: brand.colors.mutedText,
    }
  }
  if (event.daysUntilStart === 0) {
    return {
      label: 'Start vandaag',
      background: withOpacity(brand.colors.accent, 0.18),
      color: brand.colors.primaryDark,
    }
  }
  if (event.daysUntilStart === 1) {
    return {
      label: 'Start morgen',
      background: withOpacity(brand.colors.accent, 0.18),
      color: brand.colors.primaryDark,
    }
  }
  if (event.daysUntilStart <= 7) {
    return {
      label: `Binnen ${event.daysUntilStart} d`,
      background: withOpacity(brand.colors.primary, 0.18),
      color: brand.colors.primaryDark,
    }
  }
  return {
    label: `Over ${event.daysUntilStart} d`,
    background: withOpacity(brand.colors.mutedText, 0.18),
    color: brand.colors.mutedText,
  }
}

function CountdownBadge({ event }) {
  const info = countdownInfo(event)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: 600,
        backgroundColor: info.background,
        color: info.color,
      }}
    >
      {info.label}
    </span>
  )
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
        color: riskPalette[risk] || brand.colors.mutedText,
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '0.85rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: riskPalette[risk] || brand.colors.mutedText,
        }}
      />
      {riskLabels[risk] || 'Onbekend'}
    </span>
  )
}

function StatusBadge({ status }) {
  return (
    <span
      style={{
        backgroundColor: withOpacity(badgePalette[status] || brand.colors.mutedText, 0.16),
        color: badgePalette[status] || brand.colors.mutedText,
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
        padding: '16px 18px',
        borderRadius: '16px',
        display: 'grid',
        gap: '4px',
        minWidth: '150px',
        border: `1px solid ${withOpacity(
          tone === 'success'
            ? brand.colors.success
            : tone === 'warning'
            ? brand.colors.warning
            : tone === 'danger'
            ? brand.colors.danger
            : brand.colors.primary,
          0.28,
        )}`,
        boxShadow: '0 16px 28px rgba(13, 59, 102, 0.12)',
      }}
    >
      <div style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: brand.colors.secondary }}>{value}</div>
      {helpText && <div style={{ fontSize: '0.8rem', color: brand.colors.mutedText }}>{helpText}</div>}
    </div>
  )
}

function PersonaGuidance({ personaKey, summary }) {
  const config = personaGuidance[personaKey]
  if (!config) return null
  const dynamicInsight = typeof config.insight === 'function' ? config.insight(summary) : config.insight
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '6px', color: '#111827' }}>{config.focus}</div>
      <ul style={{ margin: 0, paddingLeft: '18px', color: '#4b5563', fontSize: '0.9rem' }}>
        {config.checklist.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      {dynamicInsight && (
        <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#1f2937' }}>{dynamicInsight}</div>
      )}
    </div>
  )
}

function LoadingRows() {
  return (
    <tbody>
      {[...Array(3)].map((_, idx) => (
        <tr key={idx}>
          {[...Array(tableColumnCount)].map((__, cellIdx) => (
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
  padding: '32px',
  textAlign: 'center',
  color: brand.colors.mutedText,
  fontStyle: 'italic',
}

const filterLabelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: '0.85rem',
  color: brand.colors.mutedText,
}

const filterControlStyle = {
  padding: '10px 14px',
  borderRadius: 12,
  border: `1px solid ${withOpacity(brand.colors.primary, 0.25)}`,
  background: withOpacity('#ffffff', 0.9),
  color: brand.colors.secondary,
  fontSize: '0.95rem',
  minWidth: 180,
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
}

const tableHeaderStyle = {
  textAlign: 'left',
  borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.1)}`,
  padding: '12px 10px',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: brand.colors.mutedText,
}

function shiftDate(dateString, delta) {
  if (!dateString) return dateString
  const base = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(base.getTime())) return dateString
  base.setDate(base.getDate() + delta)
  return base.toISOString().slice(0, 10)
}

function useStoredState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const stored = window.localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : defaultValue
    } catch (err) {
      console.warn('Kon lokale opslag niet lezen', err)
      return defaultValue
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.warn('Kon lokale opslag niet schrijven', err)
    }
  }, [key, value])

  return [value, setValue]
}

export default function Planner({ onLogout }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)
  const [editing, setEditing] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const [personaPreset, setPersonaPreset] = useStoredState('planner:preset', 'all')
  const [statusFilter, setStatusFilter] = useStoredState('planner:status', 'all')
  const [riskFilter, setRiskFilter] = useStoredState('planner:risk', 'all')
  const [searchTerm, setSearchTerm] = useStoredState('planner:search', '')
  const [sortKey, setSortKey] = useStoredState('planner:sortKey', 'start')
  const [sortDir, setSortDir] = useStoredState('planner:sortDir', 'asc')
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
        if (sortKey === 'start_offset') {
          const left = typeof a.daysUntilStart === 'number' ? a.daysUntilStart : 9999
          const right = typeof b.daysUntilStart === 'number' ? b.daysUntilStart : 9999
          if (left === right) {
            return a.name.localeCompare(b.name, 'nl') * direction
          }
          return (left - right) * direction
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

  const personaHint = personaPresets[personaPreset]?.description

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
        fontFamily: brandFontStack,
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        color: brand.colors.secondary,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          gap: 16,
        }}
      >
        <div style={{ display: 'grid', gap: 6 }}>
          <h2 style={{ margin: 0, fontSize: '2rem', color: brand.colors.secondary }}>Projectplanner</h2>
          <p style={{ margin: 0, color: brand.colors.mutedText, fontSize: '0.95rem' }}>
            Verbeterde UAT cockpit met persona-presets, voorraadbewaking en inline herplanning.
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            border: 'none',
            backgroundImage: brand.colors.gradient,
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 12px 28px rgba(13, 59, 102, 0.18)',
          }}
        >
          Uitloggen
        </button>
      </div>

      <TipBanner module="projects" />
      <ObservabilitySummary />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
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

      <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <label style={{ ...filterLabelStyle, minWidth: 200 }}>
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

          <label style={filterLabelStyle}>
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

          <label style={filterLabelStyle}>
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

          <label style={{ ...filterLabelStyle, flex: '1 1 200px' }}>
            Zoeken
            <input
              type="search"
              placeholder="Zoek op project, klant of notitie"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              style={{ ...filterControlStyle, minWidth: 'auto' }}
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
              padding: '10px 16px',
              borderRadius: 999,
              border: 'none',
              background: withOpacity(brand.colors.surfaceMuted, 0.8),
              color: brand.colors.primaryDark,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset filters
          </button>
        </div>
        {personaHint && <div style={{ fontSize: '0.9rem', color: brand.colors.mutedText }}>{personaHint}</div>}
        <PersonaGuidance personaKey={personaPreset} summary={summary} />
      </div>

      {feedback && (
        <div
          role="alert"
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            backgroundColor:
              feedback.type === 'success'
                ? withOpacity(brand.colors.success, 0.2)
                : withOpacity(brand.colors.danger, 0.2),
            color: feedback.type === 'success' ? brand.colors.success : brand.colors.danger,
            border: `1px solid ${
              feedback.type === 'success'
                ? withOpacity(brand.colors.success, 0.35)
                : withOpacity(brand.colors.danger, 0.35)
            }`,
          }}
        >
          {feedback.message}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th scope="col" style={tableHeaderStyle}>
                Project
              </th>
              <th scope="col" style={tableHeaderStyle}>
                Klant
              </th>
              <th
                scope="col"
                style={{ ...tableHeaderStyle, cursor: 'pointer' }}
                onClick={() => toggleSort('status')}
                aria-sort={sortKey === 'status' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Status
              </th>
              <th scope="col" style={tableHeaderStyle}>
                Planning
              </th>
              <th
                scope="col"
                style={{ ...tableHeaderStyle, cursor: 'pointer' }}
                onClick={() => toggleSort('start_offset')}
                aria-sort={sortKey === 'start_offset' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Tijd tot start
              </th>
              <th
                scope="col"
                style={{ ...tableHeaderStyle, cursor: 'pointer' }}
                onClick={() => toggleSort('risk')}
                aria-sort={sortKey === 'risk' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Voorraad
              </th>
              <th
                scope="col"
                style={{ ...tableHeaderStyle, cursor: 'pointer' }}
                onClick={() => toggleSort('start')}
                aria-sort={sortKey === 'start' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Start
              </th>
              <th
                scope="col"
                style={{ ...tableHeaderStyle, cursor: 'pointer' }}
                onClick={() => toggleSort('end')}
                aria-sort={sortKey === 'end' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Einde
              </th>
              <th scope="col" style={tableHeaderStyle}>
                Acties
              </th>
            </tr>
          </thead>
          {loading ? (
            <LoadingRows />
          ) : filteredEvents.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={tableColumnCount} style={emptyMessageStyles}>
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
                        backgroundColor: isExpanded
                          ? withOpacity(brand.colors.surfaceMuted, 0.45)
                          : rowPalette[event.status] || 'transparent',
                        transition: 'background-color 0.2s ease',
                      }}
                      onDoubleClick={() => openEditor(event)}
                    >
                      <td style={{ padding: '12px 12px', fontWeight: 600, color: brand.colors.secondary }}>
                        {event.name}
                      </td>
                      <td style={{ padding: '12px 12px', color: brand.colors.secondary }}>{event.client}</td>
                      <td style={{ padding: '12px 12px' }}>
                        <StatusBadge status={event.status} />
                      </td>
                      <td style={{ padding: '12px 12px', color: brand.colors.mutedText }}>
                        {timelineLabel(event)}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <CountdownBadge event={event} />
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <RiskBadge risk={event.risk} />
                      </td>
                      <td style={{ padding: '12px 12px', color: brand.colors.mutedText }}>
                        {formatDate(event.start)}
                      </td>
                      <td style={{ padding: '12px 12px', color: brand.colors.mutedText }}>
                        {formatDate(event.end)}
                      </td>
                      <td style={{ padding: '12px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setExpandedRow(isExpanded ? null : event.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 999,
                            border: 'none',
                            background: withOpacity(brand.colors.primary, 0.16),
                            color: brand.colors.primaryDark,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {isExpanded ? 'Sluit details' : 'Details'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditor(event)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 999,
                            border: 'none',
                            backgroundImage: brand.colors.gradient,
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Herplan
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td
                          colSpan={tableColumnCount}
                          style={{
                            padding: '20px 28px',
                            backgroundColor: withOpacity('#ffffff', 0.9),
                            borderTop: `1px solid ${withOpacity(brand.colors.secondary, 0.08)}`,
                          }}
                        >
                          <div style={{ display: 'grid', gap: '12px', color: brand.colors.mutedText }}>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                              <span><strong>Doorlooptijd:</strong> {event.durationDays ? `${event.durationDays} dagen` : 'Onbekend'}</span>
                              <span><strong>Eindigt op:</strong> {formatDate(event.end)}</span>
                            </div>
                            <div style={{ color: brand.colors.secondary, fontWeight: 600 }}>Projectnotities</div>
                            <div style={{ color: brand.colors.mutedText, whiteSpace: 'pre-wrap' }}>
                              {event.notes ? event.notes : 'Geen notities toegevoegd.'}
                            </div>
                            {event.alerts.length > 0 ? (
                              <div>
                                <div style={{ color: brand.colors.secondary, fontWeight: 600, marginBottom: '6px' }}>
                                  Voorraaddetails
                                </div>
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
            marginTop: '32px',
            display: 'grid',
            gap: '16px',
            maxWidth: '560px',
            padding: '24px 28px',
            border: `1px solid ${withOpacity(brand.colors.primary, 0.24)}`,
            borderRadius: '20px',
            backgroundColor: withOpacity('#ffffff', 0.96),
            boxShadow: '0 24px 48px rgba(13, 59, 102, 0.12)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: brand.colors.secondary }}>Project herplannen</h3>
            <button
              type="button"
              onClick={closeEditor}
              style={{
                border: 'none',
                background: withOpacity(brand.colors.surfaceMuted, 0.8),
                color: brand.colors.primaryDark,
                padding: '6px 12px',
                borderRadius: 999,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sluiten
            </button>
          </div>
          <p style={{ margin: 0, color: brand.colors.mutedText, fontSize: '0.95rem' }}>
            Pas data en notities aan. Quick actions helpen om datumreeksen met één klik te verschuiven.
          </p>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: brand.colors.secondary }}>
            Projectnaam
            <input
              type="text"
              value={formState.name}
              onChange={event => setFormState(current => ({ ...current, name: event.target.value }))}
              required
              style={filterControlStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: brand.colors.secondary }}>
            Klant
            <input
              type="text"
              value={formState.client}
              onChange={event => setFormState(current => ({ ...current, client: event.target.value }))}
              required
              style={filterControlStyle}
            />
          </label>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px', color: brand.colors.secondary }}>
              Startdatum
              <input
                type="date"
                value={formState.start}
                onChange={event => setFormState(current => ({ ...current, start: event.target.value }))}
                required
                style={filterControlStyle}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px', color: brand.colors.secondary }}>
              Einddatum
              <input
                type="date"
                value={formState.end}
                onChange={event => setFormState(current => ({ ...current, end: event.target.value }))}
                required
                style={filterControlStyle}
              />
            </label>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={() => shiftRange(-1)}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: 'none',
                background: withOpacity(brand.colors.primary, 0.16),
                color: brand.colors.primaryDark,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Verschuif 1 dag terug
            </button>
            <button
              type="button"
              onClick={() => shiftRange(1)}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: 'none',
                background: withOpacity(brand.colors.primary, 0.16),
                color: brand.colors.primaryDark,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Verschuif 1 dag vooruit
            </button>
            <button
              type="button"
              onClick={() => shiftRange(7)}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: 'none',
                background: withOpacity(brand.colors.accent, 0.2),
                color: brand.colors.primaryDark,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Verschuif 1 week vooruit
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
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: 'none',
                background: withOpacity(brand.colors.surfaceMuted, 0.8),
                color: brand.colors.primaryDark,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Herstel originele waarden
            </button>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: brand.colors.secondary }}>
            Notities voor crew & finance
            <textarea
              value={formState.notes}
              onChange={event => setFormState(current => ({ ...current, notes: event.target.value }))}
              rows={4}
              style={{ ...filterControlStyle, resize: 'vertical' }}
            />
          </label>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={closeEditor}
              style={{
                padding: '10px 16px',
                borderRadius: 999,
                border: 'none',
                background: withOpacity(brand.colors.surfaceMuted, 0.8),
                color: brand.colors.primaryDark,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Annuleren
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                border: 'none',
                backgroundImage: brand.colors.gradient,
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Wijzigingen opslaan
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export { CountdownBadge, PersonaGuidance }
