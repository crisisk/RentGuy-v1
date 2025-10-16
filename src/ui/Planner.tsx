import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { type EventDropArg } from '@fullcalendar/interaction'
import type { EventInput } from '@fullcalendar/core'
import { api } from '@infra/http/api'
import { brand, brandFontStack, headingFontStack, withOpacity } from '@ui/branding'
import TipBanner from '@ui/TipBanner'
import FlowGuidancePanel, { type FlowItem } from '@ui/FlowGuidancePanel'
import { defaultProjectPresets } from '@stores/projectStore'
import { useAuthStore } from '@stores/authStore'
import type {
  PersonaKey,
  PersonaPreset,
  PlannerEvent,
  PlannerProjectDto,
  ProjectStatus,
  RiskFilter,
  RiskLevel,
  SortDirection,
  SortKey,
  StatusFilter,
  TimeFilter,
} from '@rg-types/projectTypes'

const PERSONA_STORAGE_KEY = 'rentguy:plannerPersona'
const MS_IN_DAY = 86_400_000

type ViewMode = 'dashboard' | 'calendar'
type SummaryTone = 'neutral' | 'success' | 'warning' | 'danger'

interface FeedbackState {
  type: 'success' | 'error'
  message: string
}

interface PlannerFormState {
  name: string
  client: string
  start: string
  end: string
  notes: string
}

interface SummaryMetricProps {
  label: string
  value: string | number
  tone?: SummaryTone
  helpText?: string
}

interface RiskBadgeProps {
  risk: RiskLevel
}

interface StatusBadgeProps {
  status: ProjectStatus
}

interface PlannerProps {
  onLogout: () => void
}

const personaPresets: Record<PersonaKey, PersonaPreset> = defaultProjectPresets

const statusLabels: Record<ProjectStatus, string> = {
  active: 'Actief',
  upcoming: 'Komend',
  completed: 'Afgerond',
  at_risk: 'Risico',
}

const riskLabels: Record<RiskLevel, string> = {
  ok: 'Op schema',
  warning: 'Let op',
  critical: 'Kritiek',
}

const statusPriority: Record<ProjectStatus, number> = {
  at_risk: 0,
  active: 1,
  upcoming: 2,
  completed: 3,
}

const badgePalette: Record<ProjectStatus, string> = {
  active: brand.colors.primary,
  upcoming: brand.colors.accent,
  completed: brand.colors.success,
  at_risk: brand.colors.danger,
}

const riskPalette: Record<RiskLevel, string> = {
  ok: brand.colors.success,
  warning: brand.colors.warning,
  critical: brand.colors.danger,
}

const cardPalette: Record<SummaryTone, string> = {
  neutral: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(227, 232, 255, 0.82) 100%)',
  success: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(255,255,255,0.9) 100%)',
  warning: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(255,255,255,0.9) 100%)',
  danger: 'linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(255,255,255,0.9) 100%)',
}

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function isProjectStatus(value: unknown): value is ProjectStatus {
  return value === 'active' || value === 'upcoming' || value === 'completed' || value === 'at_risk'
}

function isRiskLevel(value: unknown): value is RiskLevel {
  return value === 'ok' || value === 'warning' || value === 'critical'
}

function isPersonaKey(value: string): value is PersonaKey {
  return Object.prototype.hasOwnProperty.call(personaPresets, value)
}

function isStatusFilter(value: string): value is StatusFilter {
  return value === 'all' || isProjectStatus(value)
}

function isRiskFilter(value: string): value is RiskFilter {
  return value === 'all' || isRiskLevel(value)
}

function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null
  const result = new Date(`${dateString}T00:00:00`)
  return Number.isNaN(result.getTime()) ? null : result
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function diffInDays(from: Date, to: Date): number {
  return Math.floor((from.getTime() - to.getTime()) / MS_IN_DAY)
}

function formatDate(dateString: string | null | undefined): string {
  const safeDate = parseDate(dateString)
  if (!safeDate) return '—'
  return dateFormatter.format(safeDate)
}

function getDateValue(dateString: string | null | undefined): number {
  const safeDate = parseDate(dateString)
  return safeDate ? safeDate.getTime() : 0
}

function timelineLabel(event: PlannerEvent): string {
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

function statusMatches(filter: StatusFilter, status: ProjectStatus): boolean {
  if (filter === 'all') return true
  if (filter === 'active') return status === 'active' || status === 'at_risk'
  return status === filter
}

function matchesTimeFilter(event: PlannerEvent, filter: TimeFilter): boolean {
  if (filter === 'all') return true

  const today = startOfUtcDay(new Date())
  const start = parseDate(event.start)
  const end = parseDate(event.end) ?? start
  if (!start || !end) return false

  const startDiff = diffInDays(start, today)
  const endDiff = diffInDays(end, today)

  switch (filter) {
    case 'today':
      return startDiff <= 0 && endDiff >= 0
    case 'next7':
      return startDiff >= 0 && startDiff <= 7
    case 'next14':
      return startDiff >= 0 && startDiff <= 14
    case 'next30':
      return startDiff >= 0 && startDiff <= 30
    case 'past30':
      return endDiff <= 0 && endDiff >= -30
    default:
      return true
  }
}

function shiftDate(dateString: string, delta: number): string {
  const base = parseDate(dateString)
  if (!base) return dateString
  base.setUTCDate(base.getUTCDate() + delta)
  return base.toISOString().slice(0, 10)
}

function ensureAlerts(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  return []
}

const emptyMessageStyles: React.CSSProperties = {
  padding: '36px',
  textAlign: 'center',
  color: brand.colors.mutedText,
  fontStyle: 'italic',
  background: withOpacity('#ffffff', 0.8),
  borderRadius: 18,
}

const filterControlStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: `1px solid ${withOpacity(brand.colors.primary, 0.25)}`,
  background: withOpacity('#ffffff', 0.85),
  color: brand.colors.secondary,
  fontSize: '0.95rem',
  minWidth: 180,
}

const tableCellStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.08)}`,
  color: brand.colors.secondary,
  fontSize: '0.95rem',
  verticalAlign: 'top',
}

const primaryActionStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 999,
  border: 'none',
  backgroundImage: brand.colors.gradient,
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 14px 28px rgba(11, 197, 234, 0.2)',
}

const secondaryActionStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 999,
  border: `1px solid ${withOpacity(brand.colors.primary, 0.35)}`,
  background: withOpacity('#ffffff', 0.85),
  color: brand.colors.primaryDark,
  fontWeight: 600,
  cursor: 'pointer',
}

const tertiaryActionStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 999,
  border: `1px solid ${withOpacity(brand.colors.secondary, 0.18)}`,
  background: withOpacity(brand.colors.surfaceMuted, 0.7),
  color: brand.colors.secondary,
  fontWeight: 600,
  cursor: 'pointer',
}

function RiskBadge({ risk }: RiskBadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: withOpacity(riskPalette[risk] ?? brand.colors.mutedText, 0.16),
        color: riskPalette[risk] ?? '#4b5563',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '0.85rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: riskPalette[risk] ?? '#4b5563' }} />
      {riskLabels[risk] ?? 'Onbekend'}
    </span>
  )
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      style={{
        backgroundColor: withOpacity(badgePalette[status] ?? brand.colors.mutedText, 0.16),
        color: badgePalette[status] ?? '#6b7280',
        padding: '4px 10px',
        borderRadius: '999px',
        fontWeight: 600,
      }}
    >
      {statusLabels[status] ?? status}
    </span>
  )
}

function SummaryMetric({ label, value, tone = 'neutral', helpText }: SummaryMetricProps) {
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
        background: cardPalette[tone] ?? cardPalette.neutral,
        padding: '16px 18px',
        borderRadius: '16px',
        display: 'grid',
        gap: '6px',
        minWidth: '160px',
        border: `1px solid ${withOpacity(accent, 0.28)}`,
        boxShadow: '0 18px 40px rgba(49, 46, 129, 0.18)',
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
export default function Planner({ onLogout }: PlannerProps) {
  const [events, setEvents] = useState<PlannerEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [editing, setEditing] = useState<PlannerEvent | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [personaPreset, setPersonaPreset] = useState<PersonaKey>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('start')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [formState, setFormState] = useState<PlannerFormState>({
    name: '',
    client: '',
    start: '',
    end: '',
    notes: '',
  })
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [calendarSyncing, setCalendarSyncing] = useState(false)
  const userRole = useAuthStore(state => state.user?.role ?? '')
  const showSecretsShortcut = userRole === 'admin'

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<PlannerProjectDto[]>('/api/v1/projects')
      const mapped: PlannerEvent[] = data.map(project => {
        const status = isProjectStatus(project.status) ? project.status : 'upcoming'
        const risk = isRiskLevel(project.inventory_risk) ? project.inventory_risk : 'ok'
        const start = project.start_date ?? ''
        const end = project.end_date ?? project.start_date ?? ''

        return {
          id: String(project.id),
          name: project.name,
          client: project.client_name,
          start,
          end,
          status,
          risk,
          alerts: ensureAlerts(project.inventory_alerts),
          durationDays: typeof project.duration_days === 'number' ? project.duration_days : null,
          daysUntilStart: typeof project.days_until_start === 'number' ? project.days_until_start : null,
          notes: project.notes ?? '',
        }
      })
      setEvents(mapped)
      setFeedback(previous => (previous?.type === 'error' ? null : previous))
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: 'Projecten konden niet worden geladen.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  function openEditor(event: PlannerEvent) {
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

  const applyPersonaPreset = useCallback(
    (value: PersonaKey, { persist = true }: { persist?: boolean } = {}) => {
      setPersonaPreset(value)
      const preset = personaPresets[value]
      if (!preset) return

      setStatusFilter(preset.statusFilter ?? 'all')
      setRiskFilter(preset.riskFilter ?? 'all')
      setSortKey(preset.sortKey ?? 'start')
      setSortDir(preset.sortDir ?? 'asc')
      setTimeFilter(preset.timeFilter ?? 'all')
      setSearchTerm(preset.searchTerm ?? '')

      if (!persist || typeof window === 'undefined') {
        return
      }

      try {
        window.localStorage.setItem(PERSONA_STORAGE_KEY, value)
      } catch (error) {
        console.warn('Kon persona-voorkeur niet opslaan', error)
      }
    },
    [
      setPersonaPreset,
      setRiskFilter,
      setSearchTerm,
      setSortDir,
      setSortKey,
      setStatusFilter,
      setTimeFilter,
    ],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      applyPersonaPreset('all', { persist: false })
      return
    }

    try {
      const storedValue = window.localStorage.getItem(PERSONA_STORAGE_KEY)
      if (storedValue && isPersonaKey(storedValue)) {
        applyPersonaPreset(storedValue, { persist: false })
        return
      }
    } catch (error) {
      console.warn('Kon persona-voorkeur niet laden', error)
    }

    applyPersonaPreset('all', { persist: false })
  }, [applyPersonaPreset])

  async function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
    } catch (error) {
      console.error(error)
      setFeedback({
        type: 'error',
        message: 'Bijwerken mislukt. Controleer beschikbaarheid en verplichte velden.',
      })
    }
  }

  function toggleSort(key: SortKey) {
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
      .filter(eventItem => statusMatches(statusFilter, eventItem.status))
      .filter(eventItem => (riskFilter === 'all' ? true : eventItem.risk === riskFilter))
      .filter(eventItem => matchesTimeFilter(eventItem, timeFilter))
      .filter(eventItem => {
        if (!term) return true
        return (
          eventItem.name.toLowerCase().includes(term) ||
          eventItem.client.toLowerCase().includes(term) ||
          (eventItem.notes && eventItem.notes.toLowerCase().includes(term))
        )
      })
      .sort((left, right) => {
        const direction = sortDir === 'asc' ? 1 : -1
        if (sortKey === 'start') {
          return (getDateValue(left.start) - getDateValue(right.start)) * direction
        }
        if (sortKey === 'end') {
          return (getDateValue(left.end) - getDateValue(right.end)) * direction
        }
        if (sortKey === 'client') {
          return left.client.localeCompare(right.client, 'nl') * direction
        }
        if (sortKey === 'status') {
          const leftPriority = statusPriority[left.status] ?? 99
          const rightPriority = statusPriority[right.status] ?? 99
          if (leftPriority === rightPriority) {
            return left.name.localeCompare(right.name, 'nl') * direction
          }
          return (leftPriority - rightPriority) * direction
        }
        if (sortKey === 'risk') {
          const order: Record<RiskLevel, number> = { ok: 0, warning: 1, critical: 2 }
          const leftOrder = order[left.risk] ?? 0
          const rightOrder = order[right.risk] ?? 0
          if (leftOrder === rightOrder) {
            return left.name.localeCompare(right.name, 'nl') * direction
          }
          return (leftOrder - rightOrder) * direction
        }
        return 0
      })
  }, [events, statusFilter, riskFilter, searchTerm, sortKey, sortDir, timeFilter])

  const calendarEvents = useMemo<EventInput[]>(
    () =>
      filteredEvents.map(eventItem => ({
        id: String(eventItem.id),
        title: `${eventItem.name} (${eventItem.client})`,
        start: eventItem.start,
        end: eventItem.end ? shiftDate(eventItem.end, 1) : eventItem.end,
        allDay: true,
        extendedProps: {
          status: eventItem.status,
          risk: eventItem.risk,
        },
      })),
    [filteredEvents]
  )

  const handleCalendarEventDrop = useCallback(
    async (info: EventDropArg) => {
      const numericId = Number.parseInt(info.event.id, 10)
      if (Number.isNaN(numericId)) {
        info.revert()
        return
      }

      const start = info.event.startStr.slice(0, 10)
      const exclusiveEnd = info.event.endStr || info.event.startStr
      const endDate = new Date(exclusiveEnd)
      endDate.setDate(endDate.getDate() - 1)
      const end = endDate.toISOString().slice(0, 10)

      try {
        setCalendarSyncing(true)
        await api.put(`/api/v1/projects/${numericId}/dates`, {
          name: info.event.title,
          client_name: '',
          start_date: start,
          end_date: end,
          notes: '',
        })
        await loadProjects()
        setFeedback({ type: 'success', message: 'Planning bijgewerkt via kalender.' })
      } catch (error) {
        console.error(error)
        setFeedback({
          type: 'error',
          message: 'Herplannen geblokkeerd. Controleer voorraad of rechten.',
        })
        info.revert()
      } finally {
        setCalendarSyncing(false)
      }
    },
    [loadProjects]
  )

  const summary = useMemo(
    () =>
      events.reduce(
        (acc, eventItem) => {
          acc.total += 1
          if (eventItem.status === 'at_risk') acc.atRisk += 1
          if (eventItem.status === 'active' || eventItem.status === 'at_risk') acc.active += 1
          if (eventItem.status === 'upcoming') acc.upcoming += 1
          if (eventItem.status === 'completed') acc.completed += 1
          if (eventItem.risk === 'warning') acc.warning += 1
          if (eventItem.risk === 'critical') acc.critical += 1
          return acc
        },
        { total: 0, active: 0, upcoming: 0, completed: 0, atRisk: 0, warning: 0, critical: 0 }
      ),
    [events]
  )

  const today = useMemo(() => startOfUtcDay(new Date()), [])

  const upcomingWithin7 = useMemo(
    () =>
      events.reduce((count, eventItem) => {
        const start = parseDate(eventItem.start)
        if (!start) {
          return count
        }
        const delta = diffInDays(start, today)
        if (delta >= 0 && delta <= 7) {
          return count + 1
        }
        return count
      }, 0),
    [events, today],
  )

  const upcomingWithin14 = useMemo(
    () =>
      events.reduce((count, eventItem) => {
        const start = parseDate(eventItem.start)
        if (!start) {
          return count
        }
        const delta = diffInDays(start, today)
        if (delta >= 0 && delta <= 14) {
          return count + 1
        }
        return count
      }, 0),
    [events, today],
  )

  const completedLast30 = useMemo(
    () =>
      events.reduce((count, eventItem) => {
        const end = parseDate(eventItem.end)
        if (!end) {
          return count
        }
        const delta = diffInDays(today, end)
        if (delta >= 0 && delta <= 30) {
          return count + 1
        }
        return count
      }, 0),
    [events, today],
  )

  const eventsWithAlerts = useMemo(
    () => events.reduce((count, eventItem) => (eventItem.alerts.length > 0 ? count + 1 : count), 0),
    [events],
  )

  const focusPersona = useCallback(
    (persona: PersonaKey) => {
      applyPersonaPreset(persona)
      setViewMode('dashboard')
      setExpandedRow(null)
    },
    [applyPersonaPreset],
  )

  const focusRiskView = useCallback(() => {
    setViewMode('dashboard')
    setExpandedRow(null)
    setStatusFilter('at_risk')
    setRiskFilter('critical')
    setTimeFilter('all')
    setSortKey('risk')
    setSortDir('desc')
    setSearchTerm('')
  }, [setRiskFilter, setSearchTerm, setSortDir, setSortKey, setStatusFilter, setTimeFilter])

  const focusCompletedView = useCallback(() => {
    setViewMode('dashboard')
    setExpandedRow(null)
    setStatusFilter('completed')
    setRiskFilter('all')
    setTimeFilter('past30')
    setSortKey('end')
    setSortDir('desc')
    setSearchTerm('')
  }, [setRiskFilter, setSearchTerm, setSortDir, setSortKey, setStatusFilter, setTimeFilter])

  const openCalendarView = useCallback(() => {
    setViewMode('calendar')
    setExpandedRow(null)
  }, [])

  const focusEscalationView = useCallback(() => {
    setViewMode('dashboard')
    setExpandedRow(null)
    setStatusFilter('all')
    setRiskFilter('critical')
    setTimeFilter('all')
    setSortKey('risk')
    setSortDir('desc')
    setSearchTerm('')
  }, [setRiskFilter, setSearchTerm, setSortDir, setSortKey, setStatusFilter, setTimeFilter])

  const personaFlows = useMemo<FlowItem[]>(() => {
    const upcomingBeyond7 = Math.max(0, upcomingWithin14 - upcomingWithin7)
    return [
      {
        id: 'operations',
        title: 'Operations & voorraad',
        icon: '🧭',
        status:
          summary.critical > 0
            ? 'danger'
            : summary.warning > 0 || eventsWithAlerts > 0
            ? 'warning'
            : 'success',
        metricLabel: 'Voorraadbewaking',
        metricValue: `${summary.critical} kritisch • ${eventsWithAlerts} alerts`,
        description:
          'Controleer kritieke voorraadmeldingen voordat crew onderweg gaat. Dit voorkomt showstoppers en volgt de "visibility of system status" richtlijn.',
        helperText: 'Gebruik de Bart preset voor snelle opvolging en plan direct mitigaties uit het risicolog.',
        primaryAction: { label: 'Focus op Bart preset', onClick: () => focusPersona('bart') },
        secondaryAction: { label: 'Bekijk risicolog', onClick: focusRiskView, variant: 'secondary' },
      },
      {
        id: 'planning',
        title: 'Planning & crewbriefings',
        icon: '📅',
        status: upcomingWithin7 > 0 ? 'warning' : upcomingWithin14 > 0 ? 'info' : 'success',
        metricLabel: 'Korte termijn shows',
        metricValue: `${upcomingWithin7} binnen 7d • ${upcomingBeyond7} binnen 14d`,
        description:
          'Bereid het team voor via de Anna preset: sorteer op eerstvolgende shows en deel briefingnotities zodra er minder dan twee weken resteren.',
        helperText: 'Best practice: combineer kalenderoverzicht met crew check-ins zodat alle stakeholders aligned zijn.',
        primaryAction: { label: 'Open Anna preset', onClick: () => focusPersona('anna') },
        secondaryAction: { label: 'Kalenderoverzicht', onClick: openCalendarView, variant: 'secondary' },
      },
      {
        id: 'finance',
        title: 'Facturatie & rapportage',
        icon: '💳',
        status: completedLast30 > 0 ? 'info' : 'success',
        metricLabel: 'Afrondingen (30 dagen)',
        metricValue: `${completedLast30} projecten`,
        description:
          'Gebruik de Frank preset om afgeronde projecten te verzamelen, exporteer draaiboeken en start de facturatie-workflow direct.',
        helperText: 'Heuristiek: geef finance inzicht in recente deliveries zodat cashflow voorspelbaar blijft.',
        primaryAction: { label: 'Open Frank preset', onClick: () => focusPersona('frank') },
        secondaryAction: { label: 'Toon facturatiequeue', onClick: focusCompletedView, variant: 'secondary' },
      },
      {
        id: 'admin',
        title: 'Escalatie & governance',
        icon: '🛡️',
        status: summary.atRisk > 0 || eventsWithAlerts > 0 ? 'warning' : 'info',
        metricLabel: 'Escalatie radar',
        metricValue: `${summary.atRisk} projecten`,
        description:
          'Met de Sven preset zie je direct welke projecten extra checks nodig hebben. Koppel dit aan het secrets-dashboard voor end-to-end governance.',
        helperText: 'Tip: documenteer elke opschorting zodat audits voldoen aan de Sevensa control framework eisen.',
        primaryAction: { label: 'Open Sven preset', onClick: () => focusPersona('sven') },
        secondaryAction: { label: 'Critical alerts', onClick: focusEscalationView, variant: 'secondary' },
      },
    ]
  }, [
    completedLast30,
    eventsWithAlerts,
    focusCompletedView,
    focusEscalationView,
    focusPersona,
    focusRiskView,
    openCalendarView,
    upcomingWithin14,
    upcomingWithin7,
    summary.atRisk,
    summary.critical,
    summary.warning,
  ])

  const personaHint = personaPresets[personaPreset]?.description

  function shiftRange(delta: number) {
    setFormState(prev => ({
      ...prev,
      start: shiftDate(prev.start, delta),
      end: shiftDate(prev.end, delta),
    }))
  }

  const sortKeyMap: Record<'Status' | 'Voorraad' | 'Start' | 'Einde', SortKey> = {
    Status: 'status',
    Voorraad: 'risk',
    Start: 'start',
    Einde: 'end',
  }
  return (
    <div
      style={{
        background: brand.colors.appBackground,
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
            background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(227, 232, 255, 0.82) 100%)',
            borderRadius: 28,
            padding: '28px 32px',
            boxShadow: brand.colors.shadow,
            border: `1px solid ${withOpacity(brand.colors.primary, 0.28)}`,
          }}
        >
          <div style={{ display: 'grid', gap: 8 }}>
            <span
              style={{
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.22em',
                color: brand.colors.mutedText,
              }}
            >
              {brand.shortName} · {brand.tenant.name}
            </span>
            <h2
              style={{
                margin: 0,
                fontSize: '2rem',
                color: brand.colors.secondary,
                fontFamily: headingFontStack,
              }}
            >
              Mister DJ projectplanner
            </h2>
            <p style={{ margin: 0, color: brand.colors.mutedText, maxWidth: 520 }}>
              Persona-presets, voorraadbewaking en corporate audittrail. {brand.partnerTagline} maakt elke flow herkenbaar voor
              Bart.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            style={{
              padding: '10px 20px',
              borderRadius: 999,
              border: 'none',
              backgroundImage: brand.colors.gradient,
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 18px 40px rgba(79, 70, 229, 0.28)',
            }}
          >
            Uitloggen
          </button>
        </div>

        {showSecretsShortcut && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 16,
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(227, 232, 255, 0.86) 100%)',
              borderRadius: 20,
              padding: '20px 24px',
              border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
              boxShadow: brand.colors.shadow,
            }}
          >
            <div style={{ maxWidth: 560 }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: brand.colors.mutedText }}>
                Systeembeheer
              </span>
              <h3 style={{ margin: '6px 0', fontFamily: headingFontStack, color: brand.colors.secondary }}>
                Nieuwe secrets-console beschikbaar
              </h3>
              <p style={{ margin: 0, color: brand.colors.mutedText }}>
                Vul alle .env-variabelen in vanuit één dashboard en push ze naar de FastAPI- en Express-omgevingen. Houd e-mail, betalingen en observability centraal bij.
              </p>
            </div>
            <Link
              to="/dashboard"
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                textDecoration: 'none',
                backgroundImage: brand.colors.gradient,
                color: '#fff',
                fontWeight: 600,
                boxShadow: '0 14px 28px rgba(79, 70, 229, 0.26)',
              }}
            >
              Open dashboard
            </Link>
          </div>
        )}

        <TipBanner module="projects" />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(227, 232, 255, 0.82) 100%)',
            borderRadius: 20,
            padding: '16px 20px',
            border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
            boxShadow: brand.colors.shadow,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>Weergave</span>
            <div style={{ display: 'inline-flex', gap: 8 }}>
              {(
                [
                  { key: 'dashboard', label: 'Persona-dashboard' },
                  { key: 'calendar', label: 'Kalender' },
                ] as const
              ).map(option => {
                const active = viewMode === option.key
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setViewMode(option.key)}
                    aria-pressed={active}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: active
                        ? `1px solid ${withOpacity(brand.colors.primaryDark, 0.5)}`
                        : `1px solid ${withOpacity(brand.colors.secondary, 0.2)}`,
                      background: active
                        ? brand.colors.gradient
                        : withOpacity(brand.colors.secondary, 0.08),
                      color: active ? '#fff' : brand.colors.secondary,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: active ? '0 14px 30px rgba(79, 70, 229, 0.22)' : 'none',
                    }}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
          <span style={{ fontSize: '0.85rem', color: calendarSyncing ? brand.colors.secondary : brand.colors.mutedText }}>
            {viewMode === 'calendar'
              ? calendarSyncing
                ? 'Kalender synchroniseert…'
                : 'Sleep & verplaats events in de kalender om data direct te updaten.'
              : 'Gebruik het dashboard voor persona-inzichten of schakel naar de kalenderweergave.'}
          </span>
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

        <FlowGuidancePanel
          eyebrow="User flows"
          title="Kies de juiste flow per persona"
          description="We vatten de belangrijkste taken per rol samen op basis van actuele planningsdata. Zo kun je direct schakelen tussen operaties, crew, finance en escalaties zonder context te verliezen."
          flows={personaFlows}
        />

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(227, 232, 255, 0.82) 100%)',
            borderRadius: 24,
            padding: '24px 28px',
            border: `1px solid ${withOpacity(brand.colors.primary, 0.24)}`,
            boxShadow: brand.colors.shadow,
            display: 'grid',
            gap: 18,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', color: brand.colors.mutedText }}>
              Persona preset
              <select
                value={personaPreset}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                  const nextValue = event.target.value
                  if (isPersonaKey(nextValue)) {
                    applyPersonaPreset(nextValue)
                  }
                }}
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
                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                  const nextValue = event.target.value
                  setStatusFilter(isStatusFilter(nextValue) ? nextValue : 'all')
                }}
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
                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                  const nextValue = event.target.value
                  setRiskFilter(isRiskFilter(nextValue) ? nextValue : 'all')
                }}
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
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
                style={filterControlStyle}
              />
            </label>

            <button
              type="button"
              onClick={() => {
                applyPersonaPreset('all')
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
          {personaHint && <div style={{ fontSize: '0.9rem', color: brand.colors.mutedText }}>{personaHint}</div>}
        </div>

        {viewMode === 'calendar' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(227, 232, 255, 0.84) 100%)',
              borderRadius: 28,
              padding: '12px 16px',
              border: `1px solid ${withOpacity(brand.colors.primary, 0.22)}`,
              boxShadow: brand.colors.shadow,
            }}
          >
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              editable
              droppable
              events={calendarEvents}
              eventDrop={handleCalendarEventDrop}
              height="auto"
            />
          </div>
        )}

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

        {viewMode !== 'calendar' && (
          <div
            style={{
              overflowX: 'auto',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(227, 232, 255, 0.8) 100%)',
              borderRadius: 28,
              border: `1px solid ${withOpacity(brand.colors.primary, 0.22)}`,
              boxShadow: brand.colors.shadow,
              padding: '12px',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {['Project', 'Klant', 'Status', 'Planning', 'Voorraad', 'Start', 'Einde', 'Acties'].map(label => {
                    const sortable = label === 'Status' || label === 'Voorraad' || label === 'Start' || label === 'Einde'
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
                        onClick={() => sortable && toggleSort(sortKeyMap[label as keyof typeof sortKeyMap])}
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
                  {filteredEvents.map(eventItem => {
                    const isExpanded = expandedRow === eventItem.id
                    return (
                      <React.Fragment key={eventItem.id}>
                        <tr
                          style={{
                            backgroundColor: isExpanded ? withOpacity(brand.colors.primary, 0.12) : 'transparent',
                            transition: 'background-color 0.2s ease',
                          }}
                          onDoubleClick={() => openEditor(eventItem)}
                        >
                          <td style={tableCellStyle}>{eventItem.name}</td>
                          <td style={tableCellStyle}>{eventItem.client}</td>
                          <td style={tableCellStyle}>
                            <StatusBadge status={eventItem.status} />
                          </td>
                          <td style={{ ...tableCellStyle, color: brand.colors.mutedText }}>{timelineLabel(eventItem)}</td>
                          <td style={tableCellStyle}>
                            <RiskBadge risk={eventItem.risk} />
                          </td>
                          <td style={{ ...tableCellStyle, color: brand.colors.mutedText }}>{formatDate(eventItem.start)}</td>
                          <td style={{ ...tableCellStyle, color: brand.colors.mutedText }}>{formatDate(eventItem.end)}</td>
                          <td style={{ ...tableCellStyle, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => setExpandedRow(isExpanded ? null : eventItem.id)}
                              style={secondaryActionStyle}
                            >
                              {isExpanded ? 'Sluit details' : 'Details'}
                            </button>
                            <button type="button" onClick={() => openEditor(eventItem)} style={primaryActionStyle}>
                              Herplan
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} style={{ padding: '18px 28px', backgroundColor: withOpacity('#ffffff', 0.85) }}>
                              <div style={{ display: 'grid', gap: '12px' }}>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: brand.colors.mutedText }}>
                                  <span>
                                    <strong>Doorlooptijd:</strong> {eventItem.durationDays ? `${eventItem.durationDays} dagen` : 'Onbekend'}
                                  </span>
                                  <span>
                                    <strong>Eindigt op:</strong> {formatDate(eventItem.end)}
                                  </span>
                                </div>
                                <div style={{ color: brand.colors.secondary, fontWeight: 600 }}>Projectnotities</div>
                                <div style={{ color: brand.colors.mutedText, whiteSpace: 'pre-wrap' }}>
                                  {eventItem.notes ? eventItem.notes : 'Geen notities toegevoegd.'}
                                </div>
                                {eventItem.alerts.length > 0 ? (
                                  <div>
                                    <div style={{ color: brand.colors.secondary, fontWeight: 600, marginBottom: '6px' }}>
                                      Voorraaddetails
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '20px', color: brand.colors.danger }}>
                                      {eventItem.alerts.map((alert, index) => (
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
        )}

        {viewMode !== 'calendar' && editing && (
          <form
            onSubmit={submitUpdate}
            style={{
              marginTop: 32,
              display: 'grid',
              gap: 16,
              maxWidth: 560,
              padding: '28px 32px',
              border: `1px solid ${withOpacity(brand.colors.primary, 0.24)}`,
              borderRadius: 24,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(227, 232, 255, 0.84) 100%)',
              boxShadow: brand.colors.shadow,
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
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setFormState(current => ({ ...current, name: event.target.value }))
                }
                required
                style={{ ...filterControlStyle, width: '100%' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, color: brand.colors.mutedText }}>
              Klant
              <input
                type="text"
                value={formState.client}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setFormState(current => ({ ...current, client: event.target.value }))
                }
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
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormState(current => ({ ...current, start: event.target.value }))
                  }
                  required
                  style={{ ...filterControlStyle, width: '100%' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 200px', color: brand.colors.mutedText }}>
                Einddatum
                <input
                  type="date"
                  value={formState.end}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormState(current => ({ ...current, end: event.target.value }))
                  }
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
                    name: editing?.name ?? '',
                    client: editing?.client ?? '',
                    start: editing?.start ?? '',
                    end: editing?.end ?? '',
                    notes: editing?.notes ?? '',
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
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormState(current => ({ ...current, notes: event.target.value }))
                }
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
