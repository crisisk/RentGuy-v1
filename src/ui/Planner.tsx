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
import { isApiError } from '@errors'
import { brand, headingFontStack, withOpacity } from '@ui/branding'
import { buildHelpCenterUrl, resolveSupportConfig } from './experienceConfig'
import TipBanner from '@ui/TipBanner'
import FlowGuidancePanel, { type FlowItem } from '@ui/FlowGuidancePanel'
import FlowExperienceShell, {
  type FlowExperienceAction,
  type FlowExperiencePersona,
} from '@ui/FlowExperienceShell'
import FlowExplainerList, { type FlowExplainerItem } from '@ui/FlowExplainerList'
import FlowJourneyMap, { type FlowJourneyStep } from '@ui/FlowJourneyMap'
import { createFlowNavigation, type FlowNavigationStatus } from '@ui/flowNavigation'
import { defaultProjectPresets } from '@stores/projectStore'
import { useAuthStore } from '@stores/authStore'
import InventorySnapshot from '@ui/InventorySnapshot'
import { analytics } from '../utils/analytics'
import type {
  PersonaKey,
  PersonaKpiConfig,
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
  testId?: string
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

interface PlannerConflictDetail {
  readonly error?: string
  readonly message?: string
  readonly crew_conflicts?: Array<{
    readonly booking_id?: number
    readonly crew_id?: number
    readonly crew_name?: string | null
    readonly start?: string
    readonly end?: string
    readonly status?: string
  }>
  readonly transport_conflicts?: Array<{
    readonly route_id?: number
    readonly vehicle_id?: number
    readonly vehicle_name?: string | null
    readonly driver_id?: number
    readonly driver_name?: string | null
    readonly date?: string
    readonly start_time?: string
    readonly end_time?: string
    readonly status?: string
  }>
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

const roleLabelMap: Record<string, string> = {
  planner: 'Operations planner',
  crew: 'Crew lead',
  warehouse: 'Warehouse coördinator',
  finance: 'Finance specialist',
  admin: 'Administrator',
  viewer: 'Project stakeholder',
}

interface ServiceLevelRow {
  tier: string
  rto: string
  coverage: string
  escalation: string
}

const serviceLevelMatrix: ServiceLevelRow[] = [
  {
    tier: 'Launch',
    rto: '< 12 uur',
    coverage: 'Ma–Vr 08:00-20:00 CET',
    escalation: 'Slack #rentguy-launch → CS manager',
  },
  {
    tier: 'Professional',
    rto: '< 6 uur',
    coverage: '7 dagen 07:00-22:00 CET',
    escalation: 'NOC hotline → Duty engineer → CS lead',
  },
  {
    tier: 'Enterprise',
    rto: '< 1 uur',
    coverage: '24/7 follow-the-sun',
    escalation: 'NOC bridge → Sevensa SRE → RentGuy leadership',
  },
]

const releaseHighlights = [
  {
    version: '2025.02',
    summary: 'Automatische hand-offs tussen planner, crew en secrets dashboard.',
  },
  {
    version: '2025.01',
    summary: 'Secrets inline validatie en emaildiagnose updates voor smoother onboarding.',
  },
  {
    version: '2024.12',
    summary: 'Multi-tenant router en marketing refresh op rentguy.nl.',
  },
]

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

function describeStatusFilter(filter: StatusFilter): string {
  if (filter === 'all') return 'Alle statussen'
  if (filter === 'active') return 'Actief en risico'
  return statusLabels[filter]
}

function describeRiskFilter(filter: RiskFilter): string {
  if (filter === 'all') return 'Alle risiconiveaus'
  return riskLabels[filter]
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

function resolvePlannerConflictMessage(error: unknown, fallback: string): string {
  if (!isApiError(error) || error.code !== 'conflict') {
    return fallback
  }

  const detail = error.meta?.response as PlannerConflictDetail | undefined
  const baseMessage =
    detail?.message && detail.message.trim().length > 0
      ? detail.message
      : 'Planning geblokkeerd door conflicterende crew- of transporttaken.'

  const crewConflicts = Array.isArray(detail?.crew_conflicts) ? detail.crew_conflicts : []
  const transportConflicts = Array.isArray(detail?.transport_conflicts)
    ? detail.transport_conflicts
    : []
  const crewCount = crewConflicts.length
  const transportCount = transportConflicts.length

  if (crewCount === 0 && transportCount === 0) {
    return baseMessage
  }

  const parts: string[] = []
  if (crewCount > 0) {
    parts.push(`${crewCount} crew-taak${crewCount > 1 ? 'en' : ''}`)
  }
  if (transportCount > 0) {
    parts.push(`${transportCount} transporttaak${transportCount > 1 ? 'en' : ''}`)
  }

  return `${baseMessage} (${parts.join(' en ')})`
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

const linkActionStyle: React.CSSProperties = {
  ...secondaryActionStyle,
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
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

const personaKpiCardStyle: React.CSSProperties = {
  padding: '16px 18px',
  borderRadius: 18,
  border: `1px solid ${withOpacity(brand.colors.primary, 0.16)}`,
  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(227, 232, 255, 0.82) 100%)',
  display: 'grid',
  gap: 6,
  minWidth: 180,
  color: brand.colors.secondary,
  boxShadow: '0 16px 32px rgba(79, 70, 229, 0.14)',
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
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: riskPalette[risk] ?? '#4b5563',
        }}
      />
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

function SummaryMetric({ label, value, tone = 'neutral', helpText, testId }: SummaryMetricProps) {
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
      data-testid={testId ?? undefined}
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
        <div
          style={{
            fontSize: '0.85rem',
            color: brand.colors.mutedText,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {label}
        </div>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: brand.colors.secondary }}>
        {value}
      </div>
      {helpText && (
        <div style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>{helpText}</div>
      )}
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
  const userRole = useAuthStore((state) => state.user?.role ?? '')
  const userEmail = useAuthStore((state) => state.user?.email ?? '')
  const showSecretsShortcut = userRole === 'admin'
  const support = useMemo(() => resolveSupportConfig(), [])
  const runbookUrl = useMemo(() => buildHelpCenterUrl(support, 'runbook'), [support])

  const loadProjects = useCallback(async (): Promise<PlannerEvent[]> => {
    setLoading(true)
    try {
      const { data } = await api.get<PlannerProjectDto[]>('/api/v1/projects')
      const mapped: PlannerEvent[] = data.map((project) => {
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
          daysUntilStart:
            typeof project.days_until_start === 'number' ? project.days_until_start : null,
          notes: project.notes ?? '',
        }
      })
      setEvents(mapped)
      setFeedback((previous) => (previous?.type === 'error' ? null : previous))
      return mapped
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: 'Projecten konden niet worden geladen.' })
      return []
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

  const computePlannerProgress = useCallback(
    (eventList?: PlannerEvent[]) => {
      const source = eventList ?? events
      const total = source.length
      const completed = source.filter((item) => item.status === 'completed').length
      return {
        completed,
        total,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    },
    [events],
  )

  const trackProjectCompletion = useCallback(
    (project: PlannerEvent, source: string, options: { eventsSnapshot?: PlannerEvent[] } = {}) => {
      const progress = computePlannerProgress(options.eventsSnapshot)
      analytics.track('task_completed', {
        channel: 'planner',
        module: 'projects',
        persona: personaPreset,
        projectId: project.id,
        status: project.status,
        risk: project.risk,
        source,
        progress,
        startDate: project.start,
        endDate: project.end,
      })
    },
    [computePlannerProgress, personaPreset],
  )

  async function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return

    try {
      const projectId = editing.id
      const previousStatus = editing.status
      await api.put(`/api/v1/projects/${editing.id}/dates`, {
        name: formState.name,
        client_name: formState.client,
        start_date: formState.start,
        end_date: formState.end,
        notes: formState.notes,
      })
      setEditing(null)
      const nextEvents = await loadProjects()
      const updatedProject = nextEvents.find((eventItem) => eventItem.id === projectId)
      if (
        updatedProject &&
        updatedProject.status === 'completed' &&
        previousStatus !== 'completed'
      ) {
        trackProjectCompletion(updatedProject, 'editor', { eventsSnapshot: nextEvents })
      }
      setFeedback({ type: 'success', message: 'Project bijgewerkt.' })
    } catch (error) {
      console.error(error)
      const message = resolvePlannerConflictMessage(
        error,
        'Bijwerken mislukt. Controleer beschikbaarheid en verplichte velden.',
      )
      setFeedback({
        type: 'error',
        message,
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
      .filter((eventItem) => statusMatches(statusFilter, eventItem.status))
      .filter((eventItem) => (riskFilter === 'all' ? true : eventItem.risk === riskFilter))
      .filter((eventItem) => matchesTimeFilter(eventItem, timeFilter))
      .filter((eventItem) => {
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
      filteredEvents.map((eventItem) => ({
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
    [filteredEvents],
  )

  const computePlannerProgress = useCallback(
    (eventList?: PlannerEvent[]) => {
      const source = eventList ?? events
      const total = source.length
      const completed = source.filter((item) => item.status === 'completed').length
      return {
        completed,
        total,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    },
    [events],
  )

  const trackProjectCompletion = useCallback(
    (project: PlannerEvent, source: string, options: { eventsSnapshot?: PlannerEvent[] } = {}) => {
      const progress = computePlannerProgress(options.eventsSnapshot)
      analytics.track('task_completed', {
        channel: 'planner',
        module: 'projects',
        persona: personaPreset,
        projectId: project.id,
        status: project.status,
        risk: project.risk,
        source,
        progress,
        startDate: project.start,
        endDate: project.end,
      })
    },
    [computePlannerProgress, personaPreset],
  )

  const handleCalendarEventDrop = useCallback(
    async (info: EventDropArg) => {
      const numericId = Number.parseInt(info.event.id, 10)
      if (Number.isNaN(numericId)) {
        info.revert()
        return
      }

      const projectId = String(numericId)
      const previousProject = events.find((eventItem) => eventItem.id === projectId)
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
        const nextEvents = await loadProjects()
        setFeedback({ type: 'success', message: 'Planning bijgewerkt via kalender.' })
        const updatedProject = nextEvents.find((eventItem) => eventItem.id === projectId)
        if (
          updatedProject &&
          updatedProject.status === 'completed' &&
          previousProject?.status !== 'completed'
        ) {
          trackProjectCompletion(updatedProject, 'calendar_drag', { eventsSnapshot: nextEvents })
        }
      } catch (error) {
        console.error(error)
        const message = resolvePlannerConflictMessage(
          error,
          'Herplannen geblokkeerd. Controleer voorraad of rechten.',
        )
        setFeedback({
          type: 'error',
          message,
        })
        info.revert()
      } finally {
        setCalendarSyncing(false)
      }
    },
    [events, loadProjects, trackProjectCompletion],
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
        { total: 0, active: 0, upcoming: 0, completed: 0, atRisk: 0, warning: 0, critical: 0 },
      ),
    [events],
  )

  const plannerJourney: FlowJourneyStep[] = useMemo(() => {
    const roleConfirmed = userRole && userRole !== 'pending'
    const riskMetaParts: string[] = []
    if (summary.critical > 0) {
      riskMetaParts.push(`${summary.critical} kritieke alerts`)
    }
    if (summary.warning > 0 && summary.critical === 0) {
      riskMetaParts.push(`${summary.warning} waarschuwingen`)
    }
    const plannerMeta = summary.total
      ? `${summary.total} projecten${riskMetaParts.length ? ` · ${riskMetaParts.join(' · ')}` : ''}`
      : 'Nog geen projecten ingepland'

    return [
      {
        id: 'login',
        title: '1. Inloggen',
        description:
          'Je sessie is actief. Alle acties worden realtime gelogd voor audittrail en rollback.',
        status: 'complete',
        badge: 'Authenticatie',
        meta: userEmail ? `Ingelogd als ${userEmail}` : undefined,
      },
      {
        id: 'role',
        title: '2. Rol bevestigd',
        description: roleConfirmed
          ? 'Persona-presets sturen filters, explainers en notificaties voor jouw verantwoordelijkheden.'
          : 'Bevestig je rol in de overlay zodat filters en explainers de juiste context laden.',
        status: roleConfirmed ? 'complete' : 'blocked',
        badge: 'Persona',
        meta: roleConfirmed ? `Rol: ${userRole}` : 'Open de rolselectie om door te gaan',
      },
      {
        id: 'planner',
        title: '3. Planner cockpit',
        description:
          'Prioriteer projecten, bewaak voorraad en schakel tussen dashboard en kalender.',
        status: 'current',
        badge: 'Operations',
        meta: plannerMeta,
      },
      {
        id: 'secrets',
        title: '4. Configuratie & launch',
        description: showSecretsShortcut
          ? 'Controleer integraties en e-maildiagnostiek voordat je naar productie gaat.'
          : 'Vraag een administrator om de secrets-console te valideren en integraties klaar te zetten.',
        status: showSecretsShortcut ? 'upcoming' : 'blocked',
        badge: 'Go-live',
        meta: showSecretsShortcut ? 'Directe toegang beschikbaar' : 'Administratorrechten vereist',
        ...(showSecretsShortcut ? { href: '/dashboard' } : {}),
      },
    ]
  }, [showSecretsShortcut, summary.critical, summary.total, summary.warning, userEmail, userRole])

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

  const personaMetricValues = useMemo<Record<string, number>>(
    () => ({
      totalProjects: summary.total,
      activeProjects: summary.active,
      criticalProjects: summary.critical,
      warningProjects: summary.warning,
      upcoming7Days: upcomingWithin7,
      upcoming14Days: upcomingWithin14,
      completed30Days: completedLast30,
      eventsWithAlerts,
      atRiskProjects: summary.atRisk,
    }),
    [
      completedLast30,
      eventsWithAlerts,
      summary.active,
      summary.atRisk,
      summary.critical,
      summary.total,
      summary.warning,
      upcomingWithin14,
      upcomingWithin7,
    ],
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

  const focusSalesView = useCallback(() => {
    setViewMode('dashboard')
    setExpandedRow(null)
    setStatusFilter('upcoming')
    setRiskFilter('all')
    setTimeFilter('next14')
    setSortKey('start')
    setSortDir('asc')
    setSearchTerm('')
  }, [setRiskFilter, setSearchTerm, setSortDir, setSortKey, setStatusFilter, setTimeFilter])

  const openCrewHandoff = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open(
        '/dashboard?focus=integration&action=sync&handoff=crew',
        '_blank',
        'noopener,noreferrer',
      )
    }
  }, [])

  const openBillingHandoff = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open('/dashboard?focus=sla&handoff=billing', '_blank', 'noopener,noreferrer')
    }
  }, [])

  const openSalesHandoff = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open('/dashboard?focus=pipeline&handoff=sales', '_blank', 'noopener,noreferrer')
    }
  }, [])

  const openGovernanceHandoff = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open('/dashboard?focus=changelog&handoff=admin', '_blank', 'noopener,noreferrer')
    }
  }, [])

  const openImportWizard = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open('/dashboard?focus=integration&handoff=import', '_blank', 'noopener,noreferrer')
    }
  }, [])

  const startOperationsFlow = useCallback(() => {
    focusPersona('operations')
    focusRiskView()
    openCrewHandoff()
  }, [focusPersona, focusRiskView, openCrewHandoff])

  const startPlanningFlow = useCallback(() => {
    focusPersona('support')
    openCalendarView()
    openCrewHandoff()
  }, [focusPersona, openCalendarView, openCrewHandoff])

  const startFinanceFlow = useCallback(() => {
    focusPersona('cfo')
    focusCompletedView()
    openBillingHandoff()
  }, [focusCompletedView, focusPersona, openBillingHandoff])

  const startAdminFlow = useCallback(() => {
    focusPersona('compliance')
    focusEscalationView()
    openGovernanceHandoff()
  }, [focusEscalationView, focusPersona, openGovernanceHandoff])

  const startSalesFlow = useCallback(() => {
    focusPersona('sales')
    focusSalesView()
    openSalesHandoff()
  }, [focusPersona, focusSalesView, openSalesHandoff])

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
          'Gebruik de operations preset om blokkades weg te werken voordat crew of transport vertrekt. Zo houd je grip op voorraad en uptime.',
        helperText:
          'De hand-off opent direct het secrets-dashboard met sync-acties. De risicolog blijft beschikbaar voor aanvullende context.',
        primaryAction: { label: 'Activeer operations flow', onClick: startOperationsFlow },
        secondaryAction: {
          label: 'Bekijk risicolog',
          onClick: focusRiskView,
          variant: 'secondary',
        },
      },
      {
        id: 'planning',
        title: 'Support & crewbriefings',
        icon: '📅',
        status: upcomingWithin7 > 0 ? 'warning' : upcomingWithin14 > 0 ? 'info' : 'success',
        metricLabel: 'Korte termijn shows',
        metricValue: `${upcomingWithin7} binnen 7d • ${upcomingBeyond7} binnen 14d`,
        description:
          'Zet de support preset aan om crewbriefings, klantupdates en service alerts te combineren in één cockpit.',
        helperText:
          'De hand-off opent een nieuwe tab voor crew sync met integratievariabelen. Kalenderfilter blijft actief voor snelle updates.',
        primaryAction: { label: 'Start support hand-off', onClick: startPlanningFlow },
        secondaryAction: {
          label: 'Kalenderoverzicht',
          onClick: openCalendarView,
          variant: 'secondary',
        },
      },
      {
        id: 'sales',
        title: 'Sales & pipeline',
        icon: '📈',
        status: summary.upcoming > 0 ? 'info' : 'success',
        metricLabel: 'Pipeline',
        metricValue: `${summary.upcoming} komende projecten`,
        description:
          'Met de sales preset monitor je welke deals live gaan binnen twee weken en welke opvolging nodig hebben.',
        helperText:
          'De sales hand-off opent de pipeline view in het secrets-dashboard zodat accountteams direct kunnen schakelen.',
        primaryAction: { label: 'Activeer sales flow', onClick: startSalesFlow },
        secondaryAction: {
          label: 'Bekijk pipeline',
          onClick: focusSalesView,
          variant: 'secondary',
        },
      },
      {
        id: 'finance',
        title: 'Finance & rapportage',
        icon: '💳',
        status: completedLast30 > 0 ? 'info' : 'success',
        metricLabel: 'Afrondingen (30 dagen)',
        metricValue: `${completedLast30} projecten`,
        description:
          'Gebruik de finance preset om afgeronde projecten te verzamelen, exporteer draaiboeken en start de facturatie-workflow direct.',
        helperText:
          'De billing hand-off opent het secrets-dashboard met SLA matrix zodat facturatie kan escaleren binnen contractuele kaders.',
        primaryAction: { label: 'Start finance hand-off', onClick: startFinanceFlow },
        secondaryAction: {
          label: 'Toon facturatiequeue',
          onClick: focusCompletedView,
          variant: 'secondary',
        },
      },
      {
        id: 'admin',
        title: 'Compliance & governance',
        icon: '🛡️',
        status: summary.atRisk > 0 || eventsWithAlerts > 0 ? 'warning' : 'info',
        metricLabel: 'Escalatie radar',
        metricValue: `${summary.atRisk} projecten`,
        description:
          'Met de compliance preset zie je direct welke projecten extra checks nodig hebben. Audit trails en alerts staan naast elkaar.',
        helperText:
          'Bij de governance hand-off opent de changelog-teaser en supportmatrix zodat escalaties traceerbaar blijven.',
        primaryAction: { label: 'Activeer governance flow', onClick: startAdminFlow },
        secondaryAction: {
          label: 'Critical alerts',
          onClick: focusEscalationView,
          variant: 'secondary',
        },
      },
    ]
  }, [
    completedLast30,
    eventsWithAlerts,
    focusSalesView,
    startOperationsFlow,
    startPlanningFlow,
    startFinanceFlow,
    startAdminFlow,
    startSalesFlow,
    focusCompletedView,
    focusEscalationView,
    focusRiskView,
    openCalendarView,
    upcomingWithin14,
    upcomingWithin7,
    summary.atRisk,
    summary.critical,
    summary.warning,
    summary.upcoming,
  ])

  const personaPresetConfig = useMemo(() => personaPresets[personaPreset], [personaPreset])

  const personaKpiCards = useMemo(() => {
    if (!personaPresetConfig?.kpis?.length) {
      return [] as Array<PersonaKpiConfig & { value: string }>
    }
    return personaPresetConfig.kpis.map((kpi) => {
      const rawValue = personaMetricValues[kpi.metric] ?? 0
      const formatted = `${kpi.prefix ?? ''}${rawValue}${kpi.suffix ?? ''}`
      return { ...kpi, value: formatted }
    })
  }, [personaPresetConfig, personaMetricValues])

  const personaHint = personaPresetConfig?.description

  const heroExplainers = useMemo<FlowExplainerItem[]>(() => {
    const preset = personaPresetConfig
    const riskSummary = summary.critical
      ? `Er zijn ${summary.critical} kritieke projecten die directe opvolging nodig hebben.`
      : summary.warning
        ? `Er zijn ${summary.warning} waarschuwingsprojecten die wekelijks opgevolgd worden.`
        : 'Geen risico’s gemeld. Houd explainers in de gaten voor nieuwe alerts.'
    const upcomingSummary = upcomingWithin7
      ? `Binnen 7 dagen starten ${upcomingWithin7} projecten.`
      : upcomingWithin14
        ? `Binnen 14 dagen starten ${upcomingWithin14} projecten.`
        : 'Geen geplande projecten in de komende 14 dagen.'

    return [
      {
        id: 'persona',
        icon: '🧭',
        title: preset?.label ?? 'Persona-dashboard',
        description: `Filters en explainers afgestemd op ${preset?.label ?? 'de geselecteerde'} verantwoordelijkheden.`,
        meta: `Statusfilter: ${describeStatusFilter(statusFilter)} · Risico: ${describeRiskFilter(riskFilter)}`,
      },
      {
        id: 'risk',
        icon: '⚡',
        title: 'Risicoregister',
        description: riskSummary,
        meta: upcomingSummary,
      },
      {
        id: 'view',
        icon: '📅',
        title: viewMode === 'calendar' ? 'Kalendermodus actief' : 'Dashboardmodus actief',
        description:
          viewMode === 'calendar'
            ? 'Sleep events om shifts en voorraad direct te updaten. Gebruik de explainers voor context.'
            : 'Bekijk alerts, crew en voorraad vanuit één cockpit. Schakel naar de kalender voor planning.',
        meta: calendarSyncing ? 'Kalendersynchronisatie actief' : 'Kalender klaar voor gebruik',
        action:
          viewMode === 'calendar'
            ? { label: 'Naar dashboard', onClick: () => setViewMode('dashboard') }
            : { label: 'Open kalender', onClick: () => setViewMode('calendar') },
      },
    ] satisfies FlowExplainerItem[]
  }, [
    calendarSyncing,
    personaPresetConfig?.label,
    riskFilter,
    statusFilter,
    summary.critical,
    summary.warning,
    upcomingWithin14,
    upcomingWithin7,
    viewMode,
  ])

  function shiftRange(delta: number) {
    setFormState((prev) => ({
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

  const secretsCallout = showSecretsShortcut ? (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
        alignItems: 'center',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(227, 232, 255, 0.86) 100%)',
        borderRadius: 24,
        padding: '20px 24px',
        border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
        color: brand.colors.secondary,
      }}
    >
      <div style={{ maxWidth: 520, display: 'grid', gap: 6 }}>
        <span
          style={{
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: brand.colors.mutedText,
          }}
        >
          Systeembeheer
        </span>
        <strong style={{ fontFamily: headingFontStack, fontSize: '1.2rem' }}>
          Nieuwe secrets-console beschikbaar
        </strong>
        <span style={{ color: brand.colors.mutedText }}>
          Vul alle .env-variabelen centraal en push ze naar FastAPI- en Express-services. Houd
          e-mail, betalingen en observability gekoppeld.
        </span>
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
  ) : null

  const heroFooter = (
    <div style={{ display: 'grid', gap: 20 }}>
      <FlowJourneyMap
        steps={plannerJourney}
        subtitle="Volg de aanbevolen volgorde om elke persona-flow en go-live check te voltooien."
      />
      {secretsCallout}
    </div>
  )

  const breadcrumbs = useMemo(() => {
    const items = [
      { id: 'home', label: 'Pilot start', href: '/' },
      { id: 'operations', label: 'Operations cockpit', href: '/planner' },
      { id: 'planner', label: 'Projectplanner' },
    ]
    if (personaPreset !== 'all' && personaPresetConfig) {
      items.push({ id: 'persona', label: personaPresetConfig.label })
    }
    return items
  }, [personaPreset, personaPresetConfig])

  const personaSummary = useMemo<FlowExperiencePersona>(() => {
    const personaName = personaPresetConfig ? personaPresetConfig.label : "Alle persona's"
    const normalizedRole = userRole && userRole !== 'pending' ? userRole : 'planner'
    const roleLabel = roleLabelMap[normalizedRole] ?? 'Pilot gebruiker'
    const persona: FlowExperiencePersona = {
      name: personaName,
      role: roleLabel,
    }
    if (userEmail) {
      persona.meta = userEmail
    }
    return persona
  }, [personaPresetConfig, userEmail, userRole])

  const stage = useMemo(() => {
    if (summary.total === 0) {
      return {
        label: 'Plan eerste projecten',
        status: 'upcoming' as const,
        detail: 'Voeg een project toe om dashboards en explainers te activeren.',
      }
    }
    if (summary.critical > 0) {
      return {
        label: 'Los voorraadblokkades op',
        status: 'in-progress' as const,
        detail: `${summary.critical} kritieke voorraadissues vereisen actie`,
      }
    }
    if (upcomingWithin7 > 0) {
      return {
        label: 'Bereid komende shows voor',
        status: 'in-progress' as const,
        detail: `${upcomingWithin7} projecten starten binnen 7 dagen`,
      }
    }
    return {
      label: 'Operaties op schema',
      status: 'completed' as const,
      detail:
        summary.warning > 0
          ? `${summary.warning} waarschuwingen gemonitord`
          : 'Geen kritieke of waarschuwing alerts actief',
    }
  }, [summary.critical, summary.total, summary.warning, upcomingWithin7])

  const statusMessage = useMemo(() => {
    if (feedback?.type === 'error') {
      return {
        tone: 'danger' as const,
        title: 'Actie geblokkeerd',
        description: feedback.message,
      }
    }
    if (summary.critical > 0) {
      return {
        tone: 'danger' as const,
        title: 'Voorraadblokkades actief',
        description: `${summary.critical} kritieke projecten wachten op voorraad of goedkeuring. Escaleer via het secrets-dashboard indien nodig.`,
      }
    }
    if (summary.warning > 0) {
      return {
        tone: 'warning' as const,
        title: 'Waarschuwingen in monitoring',
        description: `${summary.warning} projecten hebben een waarschuwing. Controleer crew of materiaal voordat de planning verspringt.`,
      }
    }
    if (summary.total === 0) {
      return {
        tone: 'info' as const,
        title: 'Start je eerste planning',
        description: 'Voeg een project toe of importeer data om de dashboard explainers te vullen.',
      }
    }
    if (upcomingWithin7 > 0) {
      return {
        tone: 'info' as const,
        title: 'Aankomende shows voorbereiden',
        description: `${upcomingWithin7} projecten starten binnen een week. Controleer crew, voorraad en transporttijdslijnen.`,
      }
    }
    return {
      tone: 'success' as const,
      title: 'Alle flows op schema',
      description: `${summary.total} projecten actief zonder kritieke alerts. Houd audittrails en monitoring in de gaten.`,
    }
  }, [feedback, summary.critical, summary.total, summary.warning, upcomingWithin7])

  const actions = useMemo(() => {
    const items: FlowExperienceAction[] = []
    if (showSecretsShortcut) {
      items.push({
        id: 'secrets',
        label: 'Secrets-dashboard',
        variant: 'secondary',
        href: '/dashboard',
        icon: '🗝️',
      })
    }
    items.push({
      id: 'logout',
      label: 'Uitloggen',
      variant: 'ghost',
      onClick: onLogout,
      icon: '🚪',
      testId: 'logout-button',
    })
    return items
  }, [onLogout, showSecretsShortcut])

  const footerAside = useMemo(
    () => (
      <div style={{ display: 'grid', gap: 10 }}>
        <strong style={{ fontSize: '0.95rem' }}>Operations handboek</strong>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            display: 'grid',
            gap: 6,
            fontSize: '0.85rem',
            color: withOpacity('#FFFFFF', 0.86),
          }}
        >
          <li>
            Gebruik de persona-presets om crew- en finance dashboards automatisch te synchroniseren.
          </li>
          <li>Escalaties verlopen via het secrets-dashboard en NOC monitoring documentatie.</li>
          <li>Plan rollback scenario’s wekelijks; auditlogs staan gekoppeld aan elke wijziging.</li>
        </ul>
        <a
          href={runbookUrl}
          target="_blank"
          rel="noreferrer"
          style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'none' }}
        >
          Bekijk het volledige runbook →
        </a>
      </div>
    ),
    [runbookUrl],
  )

  const navigationRail = useMemo(() => {
    const roleStatus: FlowNavigationStatus =
      userRole && userRole !== 'pending' ? 'complete' : 'blocked'
    const secretsStatus: FlowNavigationStatus = showSecretsShortcut ? 'upcoming' : 'blocked'

    return {
      title: 'Pilot gebruikersflows',
      caption:
        "Volg de navigator om alle persona's soepel door planning, crew en go-live stappen te leiden.",
      items: createFlowNavigation(
        'planner',
        {
          role: roleStatus,
          secrets: secretsStatus,
        },
        {
          login: userEmail ? `Ingelogd als ${userEmail}` : 'Actieve sessie zonder e-mail',
          role:
            roleStatus === 'complete'
              ? `Persona: ${(roleLabelMap[userRole] ?? userRole) || 'Onbekend'}`
              : 'Rol moet nog bevestigd worden via het onboarding team.',
          planner:
            viewMode === 'calendar'
              ? 'Kalenderweergave actief · crew hand-off beschikbaar'
              : 'Dashboardweergave actief · flows openen nieuwe governance tab',
          secrets:
            secretsStatus === 'blocked'
              ? 'Alleen admins kunnen het secrets-dashboard openen.'
              : 'Secrets-dashboard opent nu automatisch crew/billing/gov hand-offs via nieuwe tab.',
        },
      ),
      footer: (
        <span>
          Tip: Deel deze navigator tijdens go-live war rooms zodat alle stakeholders dezelfde
          context hebben.
        </span>
      ),
    }
  }, [showSecretsShortcut, userEmail, userRole, viewMode])

  return (
    <FlowExperienceShell
      eyebrow="Operations cockpit"
      heroBadge="Persona-intelligentie"
      title="Mister DJ projectplanner"
      description={
        <>
          <span>
            Persona-presets voor operations, sales, finance en compliance brengen KPI’s per
            stakeholder samen in één cockpit.
          </span>
          <span>
            Gebruik explainers per rol om crew, finance en escalaties vanuit één cockpit te sturen.
          </span>
        </>
      }
      heroPrologue={<FlowExplainerList items={heroExplainers} minWidth={240} />}
      heroFooter={heroFooter}
      breadcrumbs={breadcrumbs}
      persona={personaSummary}
      stage={stage}
      actions={actions}
      statusMessage={statusMessage}
      footerAside={footerAside}
      navigationRail={navigationRail}
    >
      <>
        <TipBanner module="projects" />

        <div
          data-testid="planner-view-toggle"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(227, 232, 255, 0.82) 100%)',
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
              ).map((option) => {
                const active = viewMode === option.key
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setViewMode(option.key)}
                    aria-pressed={active}
                    data-testid={`planner-view-${option.key}`}
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
          <span
            style={{
              fontSize: '0.85rem',
              color: calendarSyncing ? brand.colors.secondary : brand.colors.mutedText,
            }}
          >
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
          <SummaryMetric
            label="Actief"
            value={summary.active}
            tone="success"
            helpText="Inclusief risicoprojecten"
            testId="planner-metric-active"
          />
          <SummaryMetric label="Komend" value={summary.upcoming} testId="planner-metric-upcoming" />
          <SummaryMetric
            label="Afgerond"
            value={summary.completed}
            testId="planner-metric-completed"
          />
          <SummaryMetric
            label="Voorraadrisico"
            value={`${summary.critical} kritisch / ${summary.warning} waarschuwing`}
            tone={summary.critical ? 'danger' : summary.warning ? 'warning' : 'neutral'}
            testId="planner-metric-inventory-risk"
          />
        </div>

        {viewMode !== 'calendar' && <InventorySnapshot />}

        <FlowGuidancePanel
          eyebrow="User flows"
          title="Kies de juiste flow per persona"
          description="We vatten de belangrijkste taken per rol samen op basis van actuele planningsdata. Schakel direct tussen operations, support, sales, finance en compliance zonder context te verliezen."
          flows={personaFlows}
        />

        <section
          style={{
            display: 'grid',
            gap: 18,
            padding: '24px 28px',
            borderRadius: 26,
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(227, 232, 255, 0.86) 100%)',
            border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
            boxShadow: brand.colors.shadow,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'grid', gap: 6 }}>
              <h3
                style={{ margin: 0, fontFamily: headingFontStack, color: brand.colors.secondary }}
              >
                Operationale borging
              </h3>
              <p style={{ margin: 0, color: brand.colors.mutedText, maxWidth: 680 }}>
                SLA-verwachtingen en release highlights worden hier samengebracht zodat planners
                hand-offs kunnen verantwoorden richting crew, finance en governance.
              </p>
            </div>
            <button
              type="button"
              onClick={openGovernanceHandoff}
              data-testid="planner-open-governance"
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                border: 'none',
                background: brand.colors.primary,
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 12px 24px rgba(79, 70, 229, 0.2)',
              }}
            >
              Open governance samenvatting
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 18,
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            <article
              style={{
                display: 'grid',
                gap: 12,
                padding: '18px 20px',
                borderRadius: 20,
                background: '#ffffff',
                border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
              }}
            >
              <strong style={{ fontFamily: headingFontStack, color: brand.colors.secondary }}>
                SLA matrix
              </strong>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem',
                  color: brand.colors.secondary,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '8px 0',
                        borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.16)}`,
                      }}
                    >
                      Pakket
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '8px 0',
                        borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.16)}`,
                      }}
                    >
                      RTO
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '8px 0',
                        borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.16)}`,
                      }}
                    >
                      Coverage
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {serviceLevelMatrix.map((row) => (
                    <tr key={row.tier}>
                      <td
                        style={{
                          padding: '8px 0',
                          borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.08)}`,
                          fontWeight: 600,
                        }}
                      >
                        {row.tier}
                      </td>
                      <td
                        style={{
                          padding: '8px 0',
                          borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.08)}`,
                        }}
                      >
                        {row.rto}
                      </td>
                      <td
                        style={{
                          padding: '8px 0',
                          borderBottom: `1px solid ${withOpacity(brand.colors.secondary, 0.08)}`,
                        }}
                      >
                        {row.coverage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <span style={{ fontSize: '0.8rem', color: brand.colors.mutedText }}>
                Escalaties: {serviceLevelMatrix.map((row) => row.escalation).join(' • ')}
              </span>
            </article>

            <article
              style={{
                display: 'grid',
                gap: 12,
                padding: '18px 20px',
                borderRadius: 20,
                background: '#ffffff',
                border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
              }}
            >
              <strong style={{ fontFamily: headingFontStack, color: brand.colors.secondary }}>
                Release highlights
              </strong>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: 'grid',
                  gap: 6,
                  color: brand.colors.mutedText,
                  fontSize: '0.9rem',
                }}
              >
                {releaseHighlights.map((item) => (
                  <li key={item.version}>
                    <strong style={{ color: brand.colors.secondary }}>{item.version}:</strong>{' '}
                    {item.summary}
                  </li>
                ))}
              </ul>
              <a
                href="https://github.com/crisisk/RentGuy-v1/releases"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: brand.colors.primary,
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                }}
              >
                Bekijk volledige changelog →
              </a>
            </article>
          </div>
        </section>

        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(227, 232, 255, 0.82) 100%)',
            borderRadius: 24,
            padding: '24px 28px',
            border: `1px solid ${withOpacity(brand.colors.primary, 0.24)}`,
            boxShadow: brand.colors.shadow,
            display: 'grid',
            gap: 18,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: '0.85rem',
                color: brand.colors.mutedText,
              }}
            >
              Persona preset
              <select
                value={personaPreset}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                  const nextValue = event.target.value
                  if (isPersonaKey(nextValue)) {
                    applyPersonaPreset(nextValue)
                  }
                }}
                data-testid="planner-filter-persona"
                style={filterControlStyle}
              >
                {Object.entries(personaPresets).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: '0.85rem',
                color: brand.colors.mutedText,
              }}
            >
              Statusfilter
              <select
                value={statusFilter}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                  const nextValue = event.target.value
                  setStatusFilter(isStatusFilter(nextValue) ? nextValue : 'all')
                }}
                data-testid="planner-filter-status"
                style={filterControlStyle}
              >
                <option value="all">Alle</option>
                <option value="active">Actief</option>
                <option value="upcoming">Komend</option>
                <option value="completed">Afgerond</option>
                <option value="at_risk">Risico</option>
              </select>
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: '0.85rem',
                color: brand.colors.mutedText,
              }}
            >
              Voorraadrisico
              <select
                value={riskFilter}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                  const nextValue = event.target.value
                  setRiskFilter(isRiskFilter(nextValue) ? nextValue : 'all')
                }}
                data-testid="planner-filter-risk"
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
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(event.target.value)
                }
                data-testid="planner-filter-search"
                style={filterControlStyle}
              />
            </label>

            <button
              type="button"
              onClick={() => {
                applyPersonaPreset('all')
              }}
              data-testid="planner-reset-filters"
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
          {personaKpiCards.length > 0 && (
            <div
              role="list"
              aria-label="Persona KPI overzicht"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
              }}
            >
              {personaKpiCards.map((card) => (
                <article key={card.id} role="listitem" style={personaKpiCardStyle}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: brand.colors.mutedText,
                    }}
                  >
                    {card.label}
                  </span>
                  <strong style={{ fontSize: '1.5rem', color: brand.colors.secondary }}>
                    {card.value}
                  </strong>
                  {card.hint && (
                    <span style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>
                      {card.hint}
                    </span>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        {viewMode === 'calendar' && (
          <div
            data-testid="planner-calendar-wrapper"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(227, 232, 255, 0.84) 100%)',
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

        {feedback?.type === 'error' && (
          <div
            role="alert"
            data-testid="planner-feedback-error"
            style={{
              padding: '14px 18px',
              borderRadius: 14,
              backgroundColor: withOpacity(brand.colors.danger, 0.18),
              color: brand.colors.danger,
              border: `1px solid ${withOpacity(brand.colors.danger, 0.35)}`,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span>{feedback.message}</span>
            <button type="button" onClick={loadProjects} style={secondaryActionStyle}>
              Probeer opnieuw
            </button>
          </div>
        )}

        {feedback?.type === 'success' && (
          <div
            role="alert"
            data-testid="planner-feedback-success"
            style={{
              padding: '14px 18px',
              borderRadius: 14,
              backgroundColor:
                feedback.type === 'success'
                  ? withOpacity(brand.colors.success, 0.15)
                  : withOpacity(brand.colors.danger, 0.15),
              color: brand.colors.secondary,
              border: `1px solid ${withOpacity(brand.colors.success, 0.35)}`,
            }}
          >
            {feedback.message}
          </div>
        )}

        {viewMode !== 'calendar' && (
          <div
            data-testid="planner-projects-table-container"
            style={{
              overflowX: 'auto',
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(227, 232, 255, 0.8) 100%)',
              borderRadius: 28,
              border: `1px solid ${withOpacity(brand.colors.primary, 0.22)}`,
              boxShadow: brand.colors.shadow,
              padding: '12px',
            }}
          >
            <table
              data-testid="planner-projects-table"
              style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}
            >
              <thead>
                <tr>
                  {[
                    'Project',
                    'Klant',
                    'Status',
                    'Planning',
                    'Voorraad',
                    'Start',
                    'Einde',
                    'Acties',
                  ].map((label) => {
                    const sortable =
                      label === 'Status' ||
                      label === 'Voorraad' ||
                      label === 'Start' ||
                      label === 'Einde'
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
                        onClick={() =>
                          sortable && toggleSort(sortKeyMap[label as keyof typeof sortKeyMap])
                        }
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
                    <td colSpan={8} style={{ padding: '36px' }}>
                      <div
                        style={{
                          display: 'grid',
                          gap: 12,
                          justifyItems: 'center',
                          color: brand.colors.mutedText,
                        }}
                      >
                        <p style={{ margin: 0 }}>Geen projecten gevonden voor deze filters.</p>
                        <p style={{ margin: 0 }}>
                          Start een importwizard of reset de persona-instellingen.
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            gap: 12,
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                          }}
                        >
                          <button
                            type="button"
                            onClick={openImportWizard}
                            style={primaryActionStyle}
                            data-testid="planner-empty-import"
                          >
                            Start importwizard
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPersonaPreset('all')}
                            style={secondaryActionStyle}
                            data-testid="planner-empty-reset"
                          >
                            Reset filters
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {filteredEvents.map((eventItem) => {
                    const isExpanded = expandedRow === eventItem.id
                    return (
                      <React.Fragment key={eventItem.id}>
                        <tr
                          style={{
                            backgroundColor: isExpanded
                              ? withOpacity(brand.colors.primary, 0.12)
                              : 'transparent',
                            transition: 'background-color 0.2s ease',
                          }}
                          onDoubleClick={() => openEditor(eventItem)}
                        >
                          <td style={tableCellStyle}>{eventItem.name}</td>
                          <td style={tableCellStyle}>{eventItem.client}</td>
                          <td style={tableCellStyle}>
                            <StatusBadge status={eventItem.status} />
                          </td>
                          <td style={{ ...tableCellStyle, color: brand.colors.mutedText }}>
                            {timelineLabel(eventItem)}
                          </td>
                          <td style={tableCellStyle}>
                            <RiskBadge risk={eventItem.risk} />
                          </td>
                          <td style={{ ...tableCellStyle, color: brand.colors.mutedText }}>
                            {formatDate(eventItem.start)}
                          </td>
                          <td style={{ ...tableCellStyle, color: brand.colors.mutedText }}>
                            {formatDate(eventItem.end)}
                          </td>
                          <td
                            style={{ ...tableCellStyle, display: 'flex', gap: 8, flexWrap: 'wrap' }}
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedRow(isExpanded ? null : eventItem.id)}
                              style={secondaryActionStyle}
                            >
                              {isExpanded ? 'Sluit details' : 'Details'}
                            </button>
                            <Link
                              to={`/projects/${eventItem.id}`}
                              style={linkActionStyle}
                              data-testid={`planner-project-link-${eventItem.id}`}
                            >
                              Bekijk project
                            </Link>
                            <button
                              type="button"
                              onClick={() => openEditor(eventItem)}
                              style={primaryActionStyle}
                            >
                              Herplan
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td
                              colSpan={8}
                              style={{
                                padding: '18px 28px',
                                backgroundColor: withOpacity('#ffffff', 0.85),
                              }}
                            >
                              <div style={{ display: 'grid', gap: '12px' }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '16px',
                                    flexWrap: 'wrap',
                                    color: brand.colors.mutedText,
                                  }}
                                >
                                  <span>
                                    <strong>Doorlooptijd:</strong>{' '}
                                    {eventItem.durationDays
                                      ? `${eventItem.durationDays} dagen`
                                      : 'Onbekend'}
                                  </span>
                                  <span>
                                    <strong>Eindigt op:</strong> {formatDate(eventItem.end)}
                                  </span>
                                </div>
                                <div style={{ color: brand.colors.secondary, fontWeight: 600 }}>
                                  Projectnotities
                                </div>
                                <div
                                  style={{ color: brand.colors.mutedText, whiteSpace: 'pre-wrap' }}
                                >
                                  {eventItem.notes ? eventItem.notes : 'Geen notities toegevoegd.'}
                                </div>
                                {eventItem.alerts.length > 0 ? (
                                  <div>
                                    <div
                                      style={{
                                        color: brand.colors.secondary,
                                        fontWeight: 600,
                                        marginBottom: '6px',
                                      }}
                                    >
                                      Voorraaddetails
                                    </div>
                                    <ul
                                      style={{
                                        margin: 0,
                                        paddingLeft: '20px',
                                        color: brand.colors.danger,
                                      }}
                                    >
                                      {eventItem.alerts.map((alert, index) => (
                                        <li key={index}>{alert}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <div style={{ color: brand.colors.success }}>
                                    Geen voorraadissues voor dit project.
                                  </div>
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
            data-testid="planner-editor-form"
            style={{
              marginTop: 32,
              display: 'grid',
              gap: 16,
              maxWidth: 560,
              padding: '28px 32px',
              border: `1px solid ${withOpacity(brand.colors.primary, 0.24)}`,
              borderRadius: 24,
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(227, 232, 255, 0.84) 100%)',
              boxShadow: brand.colors.shadow,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <h3 style={{ margin: 0, color: brand.colors.secondary }}>Project herplannen</h3>
              <button
                type="button"
                onClick={closeEditor}
                data-testid="planner-editor-close"
                style={secondaryActionStyle}
              >
                Sluiten
              </button>
            </div>
            <p style={{ margin: 0, color: brand.colors.mutedText }}>
              Pas data en notities aan. Quick actions helpen om datumreeksen met één klik te
              verschuiven.
            </p>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                color: brand.colors.mutedText,
              }}
            >
              Projectnaam
              <input
                type="text"
                value={formState.name}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setFormState((current) => ({ ...current, name: event.target.value }))
                }
                required
                data-testid="planner-editor-name"
                style={{ ...filterControlStyle, width: '100%' }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                color: brand.colors.mutedText,
              }}
            >
              Klant
              <input
                type="text"
                value={formState.client}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setFormState((current) => ({ ...current, client: event.target.value }))
                }
                required
                data-testid="planner-editor-client"
                style={{ ...filterControlStyle, width: '100%' }}
              />
            </label>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  flex: '1 1 200px',
                  color: brand.colors.mutedText,
                }}
              >
                Startdatum
                <input
                  type="date"
                  value={formState.start}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormState((current) => ({ ...current, start: event.target.value }))
                  }
                  required
                  data-testid="planner-editor-start"
                  style={{ ...filterControlStyle, width: '100%' }}
                />
              </label>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  flex: '1 1 200px',
                  color: brand.colors.mutedText,
                }}
              >
                Einddatum
                <input
                  type="date"
                  value={formState.end}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormState((current) => ({ ...current, end: event.target.value }))
                  }
                  required
                  data-testid="planner-editor-end"
                  style={{ ...filterControlStyle, width: '100%' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button
                type="button"
                onClick={() => shiftRange(-1)}
                data-testid="planner-editor-shift-back"
                style={tertiaryActionStyle}
              >
                Vervroeg beide data 1 dag
              </button>
              <button
                type="button"
                onClick={() => shiftRange(1)}
                data-testid="planner-editor-shift-forward"
                style={tertiaryActionStyle}
              >
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
                data-testid="planner-editor-reset"
                style={tertiaryActionStyle}
              >
                Herstel oorspronkelijke waarden
              </button>
            </div>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                color: brand.colors.mutedText,
              }}
            >
              Notities voor crew & finance
              <textarea
                value={formState.notes}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormState((current) => ({ ...current, notes: event.target.value }))
                }
                rows={3}
                data-testid="planner-editor-notes"
                style={{
                  ...filterControlStyle,
                  width: '100%',
                  minHeight: 96,
                  resize: 'vertical',
                }}
              />
            </label>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="submit" data-testid="planner-editor-save" style={primaryActionStyle}>
                Opslaan
              </button>
              <button
                type="button"
                onClick={closeEditor}
                data-testid="planner-editor-cancel"
                style={secondaryActionStyle}
              >
                Annuleren
              </button>
            </div>
          </form>
        )}
      </>
    </FlowExperienceShell>
  )
}
