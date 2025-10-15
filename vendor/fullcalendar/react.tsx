import { createElement, type JSX } from 'react'

export interface FullCalendarProps {
  events?: unknown[]
  [key: string]: unknown
}

export default function FullCalendar(props: FullCalendarProps): JSX.Element {
  const eventCount = Array.isArray(props.events) ? props.events.length : 0
  return createElement(
    'div',
    {
      'data-testid': 'fullcalendar-stub',
      'data-event-count': eventCount,
      style: { border: '1px dashed #999', padding: '1rem', borderRadius: '0.5rem' },
    },
    'FullCalendar stub',
  )
}
