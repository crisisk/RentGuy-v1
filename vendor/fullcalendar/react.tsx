import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type ForwardedRef,
  type ReactElement,
} from 'react'

import type { EventInput } from './core'
import type { EventDropArg } from './interaction'

interface NormalizedEvent {
  id: string
  title: string
  start: Date
  end: Date | null
  allDay: boolean
  extendedProps: Record<string, unknown> | undefined
  original: EventInput
}

interface CalendarDayCell {
  date: Date
  inCurrentMonth: boolean
}

export interface FullCalendarApi {
  getDate(): Date
  getEvents(): EventInput[]
  next(): void
  prev(): void
  today(): void
}

export interface FullCalendarProps {
  events?: EventInput[]
  initialView?: 'dayGridMonth'
  eventDrop?: (arg: EventDropArg) => void
  editable?: boolean
  droppable?: boolean
  height?: number | string
  plugins?: unknown[]
}

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function startOfWeek(date: Date): Date {
  const result = startOfDay(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  return result
}

function buildCalendarGrid(anchor: Date): CalendarDayCell[][] {
  const firstOfMonth = startOfMonth(anchor)
  const gridStart = startOfWeek(firstOfMonth)
  const weeks: CalendarDayCell[][] = []
  const cursor = new Date(gridStart)
  for (let week = 0; week < 6; week += 1) {
    const days: CalendarDayCell[] = []
    for (let day = 0; day < 7; day += 1) {
      days.push({ date: new Date(cursor), inCurrentMonth: cursor.getMonth() === anchor.getMonth() })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(days)
  }
  return weeks
}

function normalizeEvents(events: EventInput[]): NormalizedEvent[] {
  return events
    .filter((event): event is EventInput & { id: string; title: string; start: string | Date } => Boolean(event.id && event.title && event.start))
    .map(event => {
      const start = event.start instanceof Date ? new Date(event.start) : new Date(event.start)
      const endValue = event.end instanceof Date ? event.end : event.end ? new Date(event.end) : null
      const extendedProps = cloneExtendedProps(event.extendedProps)
      return {
        id: event.id,
        title: event.title,
        start,
        end: endValue,
        allDay: Boolean(event.allDay),
        extendedProps,
        original: cloneEventInput(event, start, endValue),
      }
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}

function groupEventsByDay(events: NormalizedEvent[]): Map<string, NormalizedEvent[]> {
  const map = new Map<string, NormalizedEvent[]>()
  for (const event of events) {
    const key = startOfDay(event.start).toISOString()
    const bucket = map.get(key)
    if (bucket) {
      bucket.push(event)
    } else {
      map.set(key, [event])
    }
  }
  return map
}

function cloneExtendedProps(props?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!props) {
    return undefined
  }
  return { ...props }
}

function cloneEventInput(source: EventInput, start: Date, end: Date | null): EventInput {
  const cloned: EventInput = {
    ...source,
    start,
    end,
  }
  const extendedProps = cloneExtendedProps(source.extendedProps)
  if (extendedProps) {
    cloned.extendedProps = extendedProps
  } else if ('extendedProps' in cloned) {
    delete cloned.extendedProps
  }
  return cloned
}

function cloneEvents(events: NormalizedEvent[]): NormalizedEvent[] {
  return events.map(event => ({
    ...event,
    start: new Date(event.start),
    end: event.end ? new Date(event.end) : null,
    extendedProps: cloneExtendedProps(event.extendedProps),
    original: cloneEventInput(event.original, new Date(event.start), event.end ? new Date(event.end) : null),
  }))
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '1rem',
}

const navButtonStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  padding: '0.25rem 0.5rem',
  color: '#354052',
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: '0.5rem',
}

const cellStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.9)',
  borderRadius: 12,
  padding: '0.75rem',
  minHeight: 120,
  boxShadow: '0 8px 20px rgba(38, 51, 77, 0.12)',
  border: '1px solid rgba(101, 116, 139, 0.12)',
  display: 'flex',
  flexDirection: 'column',
}

const dayNumberStyle: CSSProperties = {
  fontWeight: 600,
  marginBottom: '0.5rem',
  color: '#17223B',
}

const mutedDayStyle: CSSProperties = {
  color: '#94A3B8',
}

const eventStyle: CSSProperties = {
  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12), rgba(14, 116, 144, 0.12))',
  color: '#1E293B',
  borderRadius: 10,
  padding: '0.5rem 0.75rem',
  fontSize: '0.85rem',
  marginBottom: '0.35rem',
  cursor: 'grab',
  userSelect: 'none',
  border: '1px solid rgba(79, 70, 229, 0.15)',
}

const weekdayHeaderStyle: CSSProperties = {
  textTransform: 'uppercase',
  fontSize: '0.7rem',
  letterSpacing: '0.08em',
  color: '#475569',
  fontWeight: 600,
}

const weekHeaderStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: '0.5rem',
  marginBottom: '0.5rem',
}

const weekDays = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

function CalendarComponent(
  { events = [], eventDrop, editable = true, height }: FullCalendarProps,
  ref: ForwardedRef<FullCalendarApi>,
): ReactElement {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()))
  const [internalEvents, setInternalEvents] = useState<NormalizedEvent[]>(() => normalizeEvents(events))
  const dragState = useRef<{ snapshot: NormalizedEvent[]; event: NormalizedEvent } | null>(null)

  useEffect(() => {
    setInternalEvents(normalizeEvents(events))
  }, [events])

  useImperativeHandle(
    ref,
    () => ({
      getDate: () => new Date(currentMonth),
      getEvents: () =>
        internalEvents.map(event => cloneEventInput(event.original, new Date(event.start), event.end ? new Date(event.end) : null)),
      next: () => setCurrentMonth(prev => addMonths(prev, 1)),
      prev: () => setCurrentMonth(prev => addMonths(prev, -1)),
      today: () => setCurrentMonth(startOfMonth(new Date())),
    }),
    [currentMonth, internalEvents],
  )

  const weeks = useMemo(() => buildCalendarGrid(currentMonth), [currentMonth])
  const eventsByDay = useMemo(() => groupEventsByDay(internalEvents), [internalEvents])

  const handleDragStart = (dragEvent: DragEvent<HTMLDivElement>, calendarEvent: NormalizedEvent) => {
    if (!editable) return
    dragState.current = {
      snapshot: cloneEvents(internalEvents),
      event: calendarEvent,
    }
    dragEvent.dataTransfer?.setData('text/plain', calendarEvent.id)
    dragEvent.dataTransfer?.setDragImage(dragEvent.currentTarget, 0, 0)
  }

  const handleDragOver = (dragEvent: DragEvent<HTMLDivElement>) => {
    if (!editable) return
    dragEvent.preventDefault()
  }

  const handleDrop = (dragEvent: DragEvent<HTMLDivElement>, targetDate: Date) => {
    if (!editable) return
    dragEvent.preventDefault()
    const dragInfo = dragState.current
    if (!dragInfo) return

    const previous = dragInfo.snapshot
    const duration = dragInfo.event.end ? dragInfo.event.end.getTime() - dragInfo.event.start.getTime() : 0
    const newStart = startOfDay(targetDate)
    const newEnd = dragInfo.event.end ? new Date(newStart.getTime() + duration) : null

    const nextEvents = internalEvents.map(event =>
      event.id === dragInfo.event.id
        ? {
            ...event,
            start: newStart,
            end: newEnd,
            original: cloneEventInput(event.original, newStart, newEnd),
          }
        : event,
    )

    setInternalEvents(nextEvents)
    dragState.current = null

    if (eventDrop) {
      const dropArg: EventDropArg = {
        event: {
          id: dragInfo.event.id,
          title: dragInfo.event.title,
          startStr: newStart.toISOString(),
          endStr: newEnd ? newEnd.toISOString() : null,
          start: newStart,
          end: newEnd,
        },
        revert: () => {
          setInternalEvents(cloneEvents(previous))
        },
      }
      eventDrop(dropArg)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: height ?? 'auto',
        gap: '0.5rem',
      }}
    >
      <div style={headerStyle}>
        <button type="button" onClick={() => setCurrentMonth(prev => addMonths(prev, -1))} style={navButtonStyle} aria-label="Vorige maand">
          ‹
        </button>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1F2937' }}>{formatMonth(currentMonth)}</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={() => setCurrentMonth(startOfMonth(new Date()))} style={navButtonStyle} aria-label="Vandaag">
            •
          </button>
          <button type="button" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} style={navButtonStyle} aria-label="Volgende maand">
            ›
          </button>
        </div>
      </div>

      <div style={weekHeaderStyle}>
        {weekDays.map(day => (
          <div key={day} style={weekdayHeaderStyle}>
            {day}
          </div>
        ))}
      </div>

      <div style={gridStyle}>
        {weeks.map((week, weekIndex) => (
          <div key={String(currentMonth.getTime()) + weekIndex} style={{ display: 'contents' }}>
            {week.map(day => {
              const dayKey = startOfDay(day.date).toISOString()
              const items = eventsByDay.get(dayKey) ?? []
              return (
                <div
                  key={dayKey}
                  onDragOver={handleDragOver}
                  onDrop={(dragEvent: DragEvent<HTMLDivElement>) => handleDrop(dragEvent, day.date)}
                  style={{
                    ...cellStyle,
                    opacity: day.inCurrentMonth ? 1 : 0.5,
                  }}
                  data-date={dayKey}
                >
                  <div style={{ ...dayNumberStyle, ...(day.inCurrentMonth ? {} : mutedDayStyle) }}>{day.date.getDate()}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    {items.map(event => (
                      <div
                        key={event.id}
                        draggable={editable}
                        onDragStart={(dragEvent: DragEvent<HTMLDivElement>) => handleDragStart(dragEvent, event)}
                        style={{
                          ...eventStyle,
                          background: event.original.backgroundColor ?? eventStyle.background,
                          color: event.original.textColor ?? eventStyle.color,
                          border: event.original.borderColor ? `1px solid ${event.original.borderColor}` : eventStyle.border,
                        }}
                      >
                        <div>{event.title}</div>
                        {!event.allDay && (
                          <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: '#475569' }}>
                            {event.start.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                            {event.end
                              ? ` – ${event.end.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
                              : null}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

const FullCalendar = forwardRef<FullCalendarApi, FullCalendarProps>(CalendarComponent)

export type { EventInput }
export default FullCalendar
