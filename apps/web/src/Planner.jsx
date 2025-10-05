import React, { useEffect, useState, useRef } from 'react'
import { api } from './api.js'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export default function Planner({ onLogout }) {
  const [events, setEvents] = useState([])
  const calRef = useRef(null)

  async function loadProjects() {
    const { data } = await api.get('/api/v1/projects')
    const ev = data.map(p => ({
      id: String(p.id),
      title: `${p.name} (${p.client_name})`,
      start: p.start_date,
      end: new Date(new Date(p.end_date).getTime() + 24*60*60*1000).toISOString().slice(0,10), // FullCalendar exclusive end
      allDay: true
    }))
    setEvents(ev)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  async function onEventDrop(info) {
    const id = parseInt(info.event.id, 10)
    const start = info.event.startStr.slice(0,10)
    // FullCalendar gives exclusive end for allDay; subtract one day
    const endDate = new Date(info.event.endStr || info.event.startStr)
    endDate.setDate(endDate.getDate() - 1)
    const end = endDate.toISOString().slice(0,10)

    try {
      await api.put(`/api/v1/projects/${id}/dates`, { name: info.event.title, client_name: '', start_date: start, end_date: end, notes: '' })
      // reload to be safe
      await loadProjects()
    } catch (e) {
      alert('Herplannen geblokkeerd: waarschijnlijk onvoldoende voorraad in de nieuwe periode.')
      info.revert()
    }
  }

  return (
    <div style={{fontFamily:'system-ui', padding:'12px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2>Planner Kalender</h2>
        <button onClick={onLogout}>Uitloggen</button>
      </div>
      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        editable={true}
        droppable={true}
        events={events}
        eventDrop={onEventDrop}
        height="auto"
      />
    </div>
  )
}
