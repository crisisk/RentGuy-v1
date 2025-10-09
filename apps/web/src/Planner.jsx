import React, { useEffect, useState } from 'react'
import { api } from './api.js'

function EventRow({ event, onEdit }) {
  return (
    <tr key={event.id}>
      <td>{event.name}</td>
      <td>{event.client}</td>
      <td>{event.start}</td>
      <td>{event.end}</td>
      <td>
        <button onClick={() => onEdit(event)}>Wijzig</button>
      </td>
    </tr>
  )
}

export default function Planner({ onLogout }) {
  const [events, setEvents] = useState([])
  const [editing, setEditing] = useState(null)
  const [formState, setFormState] = useState({ start: '', end: '' })
  const [status, setStatus] = useState(null)

  async function loadProjects() {
    try {
      const { data } = await api.get('/api/v1/projects')
      const ev = data.map(p => ({
        id: p.id,
        name: p.name,
        client: p.client_name,
        start: p.start_date,
        end: p.end_date,
      }))
      setEvents(ev)
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: 'Projecten konden niet worden geladen.' })
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  function openEditor(event) {
    setEditing(event)
    setFormState({ start: event.start, end: event.end })
    setStatus(null)
  }

  async function submitUpdate(e) {
    e.preventDefault()
    if (!editing) return
    try {
      await api.put(`/api/v1/projects/${editing.id}/dates`, {
        name: editing.name,
        client_name: editing.client,
        start_date: formState.start,
        end_date: formState.end,
        notes: '',
      })
      setStatus({ type: 'success', message: 'Project bijgewerkt.' })
      setEditing(null)
      await loadProjects()
    } catch (err) {
      console.error(err)
      setStatus({ type: 'error', message: 'Bijwerken mislukt. Controleer beschikbaarheid.' })
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: '12px', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Projectplanner</h2>
        <button onClick={onLogout}>Uitloggen</button>
      </div>

      {status && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            marginBottom: '16px',
            backgroundColor: status.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: status.type === 'success' ? '#065f46' : '#991b1b',
          }}
        >
          {status.message}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '8px' }}>Project</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '8px' }}>Klant</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '8px' }}>Startdatum</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '8px' }}>Einddatum</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '8px' }}>Acties</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <EventRow key={event.id} event={event} onEdit={openEditor} />
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <form onSubmit={submitUpdate} style={{ marginTop: '24px', display: 'grid', gap: '12px', maxWidth: '420px' }}>
          <h3 style={{ margin: 0 }}>Project bijwerken</h3>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            Startdatum
            <input
              type="date"
              value={formState.start}
              onChange={e => setFormState({ ...formState, start: e.target.value })}
              required
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            Einddatum
            <input
              type="date"
              value={formState.end}
              onChange={e => setFormState({ ...formState, end: e.target.value })}
              required
            />
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit">Opslaan</button>
            <button type="button" onClick={() => setEditing(null)}>Annuleren</button>
          </div>
        </form>
      )}
    </div>
  )
}
