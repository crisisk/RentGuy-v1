import React, { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import axios from 'axios'
import { env } from '@config/env'

import { queueScan, flushQueue, getQueueCount } from './warehouse/offline-queue'

const API = env.apiBaseUrl

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function Scanner() {
  const videoRef = useRef(null)
  const [result, setResult] = useState('')
  const [direction, setDirection] = useState('out')
  const [projectId, setProjectId] = useState('1')
  const [qty, setQty] = useState(1)
  const [status, setStatus] = useState('Scan een QR-code om te starten.')
  const [resolution, setResolution] = useState(null)
  const [bundleMode, setBundleMode] = useState('explode')
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [loadingResolution, setLoadingResolution] = useState(false)

  const fetchQueueCount = useCallback(async () => {
    const count = await getQueueCount().catch(() => 0)
    setPendingCount(count)
  }, [])

  const pushScan = useCallback(async payload => {
    await axios.post(`${API}/api/v1/warehouse/scan`, payload, { headers: authHeaders() })
  }, [])

  const syncQueue = useCallback(async () => {
    const { processed, remaining } = await flushQueue(pushScan).catch(() => ({ processed: 0, remaining: pendingCount }))
    if (processed > 0) {
      setStatus(`Offline wachtrij verwerkt: ${processed} boekingen gesynchroniseerd.`)
    }
    setPendingCount(remaining)
  }, [pendingCount, pushScan])

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    reader.decodeFromVideoDevice(null, videoRef.current, (res) => {
      if (res) {
        setResult(res.getText())
      }
    })
    return () => reader.reset()
  }, [])

  useEffect(() => {
    async function resolveTag(value) {
      setLoadingResolution(true)
      try {
        const { data } = await axios.get(`${API}/api/v1/warehouse/tags/${encodeURIComponent(value)}`, { headers: authHeaders() })
        setResolution(data)
        if (data.kind === 'unknown') {
          setStatus('Tag niet gekoppeld. Registreer de tag in de backoffice.')
        } else if (data.kind === 'bundle') {
          setStatus('Bundel gevonden – kies een boekingsmodus.')
          setBundleMode('explode')
        } else {
          setStatus('Item gevonden. Controleer hoeveelheid en bevestig.')
        }
      } catch (err) {
        if (!err.response) {
          setIsOffline(true)
          setStatus('Geen verbinding: tagdetails worden niet opgehaald. Boeking wordt in wachtrij geplaatst.')
        } else if (err.response.status === 404) {
          setStatus('Tag onbekend of gedeactiveerd.')
        } else {
          setStatus('Fout bij ophalen van taginformatie.')
        }
        setResolution(null)
      } finally {
        setLoadingResolution(false)
      }
    }

    if (result) {
      resolveTag(result)
    } else {
      setResolution(null)
      setBundleMode('explode')
    }
  }, [result])

  useEffect(() => {
    fetchQueueCount()

    const handleOnline = () => {
      setIsOffline(false)
      syncQueue()
    }
    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [fetchQueueCount, syncQueue])

  const submit = useCallback(async () => {
    if (!result) return
    const projectIdInt = parseInt(projectId, 10)
    if (Number.isNaN(projectIdInt)) {
      setStatus('Project ID moet numeriek zijn.')
      return
    }

    const payload = {
      tag_value: result,
      direction,
      project_id: projectIdInt,
      qty,
      bundle_mode: resolution?.kind === 'bundle' ? bundleMode : null,
    }

    if (resolution?.kind === 'bundle' && !bundleMode) {
      setStatus('Kies eerst of je de bundel uitklapt of als geheel boekt.')
      return
    }

    try {
      await pushScan(payload)
      setStatus('Beweging geregistreerd.')
      setResult('')
      setResolution(null)
      setBundleMode('explode')
    } catch (err) {
      if (err?.response?.status === 409 && err.response?.data?.code === 'bundle_mode_required') {
        setStatus('De server vraagt om een bundelmodus. Kies een optie en probeer opnieuw.')
        return
      }
      if (!err.response) {
        await queueScan(payload)
        await fetchQueueCount()
        setStatus('Offline: scan toegevoegd aan wachtrij. Wordt verstuurd zodra de verbinding terug is.')
        setResult('')
        setResolution(null)
      } else if (err.response.status === 404) {
        setStatus('Boeking geweigerd: tag onbekend.')
      } else {
        setStatus(err.response?.data?.detail || 'Onverwachte fout bij boeken.')
      }
    }
  }, [bundleMode, direction, fetchQueueCount, projectId, pushScan, qty, resolution, result])

  const resolutionDetails = () => {
    if (!result) return null
    if (loadingResolution) {
      return <p style={{ marginTop: 12 }}>Tag analyseren…</p>
    }
    if (!resolution) return <p style={{ marginTop: 12 }}>Geen taginformatie beschikbaar.</p>
    if (resolution.kind === 'item') {
      return (
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>Item</h4>
          <p>Item-ID: <strong>{resolution.item_id}</strong></p>
        </div>
      )
    }
    if (resolution.kind === 'bundle') {
      return (
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>Bundel #{resolution.bundle_id}</h4>
          <p>Deze bundel bevat:</p>
          <ul>
            {resolution.bundle_items.map(item => (
              <li key={`${item.item_id}`}>Item {item.item_id} × {item.quantity}</li>
            ))}
          </ul>
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'block' }}>
              <input
                type="radio"
                name="bundle-mode"
                value="explode"
                checked={bundleMode === 'explode'}
                onChange={() => setBundleMode('explode')}
              />{' '}
              Bundel uitklappen (boekt alle componenten)
            </label>
            <label style={{ display: 'block', marginTop: 4 }}>
              <input
                type="radio"
                name="bundle-mode"
                value="book_all"
                checked={bundleMode === 'book_all'}
                onChange={() => setBundleMode('book_all')}
              />{' '}
              Bundel als geheel boeken (1 regel)
            </label>
          </div>
        </div>
      )
    }
    return <p style={{ marginTop: 12 }}>Tag niet gekoppeld aan een item of bundel.</p>
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 12, maxWidth: 520, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Rentguy – QR Scanner</h2>
        <div style={{ textAlign: 'right', fontSize: 12 }}>
          <div style={{ color: isOffline ? '#c0392b' : '#27ae60' }}>{isOffline ? 'Offline modus' : 'Online'}</div>
          {pendingCount > 0 && <div>{pendingCount} wachtrij item(s)</div>}
        </div>
      </header>
      <video ref={videoRef} style={{ width: '100%', maxWidth: 480, background: '#000', borderRadius: 12 }} />
      <p style={{ marginTop: 12 }}>Laatste scan: <strong>{result || '—'}</strong></p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label style={fieldStyle}>
          Project ID
          <input value={projectId} onChange={e => setProjectId(e.target.value)} style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          Aantal
          <input
            type="number"
            min={1}
            value={qty}
            onChange={e => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
            style={inputStyle}
          />
        </label>
      </div>
      <div style={{ margin: '12px 0' }}>
        <label style={{ marginRight: 12 }}>
          <input type="radio" name="dir" value="out" checked={direction === 'out'} onChange={() => setDirection('out')} /> Uitgaand
        </label>
        <label>
          <input type="radio" name="dir" value="in" checked={direction === 'in'} onChange={() => setDirection('in')} /> Inkomend
        </label>
      </div>
      {resolutionDetails()}
      <button onClick={submit} disabled={!result} style={primaryButtonStyle}>
        Boek beweging
      </button>
      <button onClick={syncQueue} style={{ ...secondaryButtonStyle, marginLeft: 8 }}>
        Synchroniseer wachtrij
      </button>
      <p style={{ marginTop: 16, minHeight: 24 }}>{status}</p>
    </div>
  )
}

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  fontSize: 14,
}

const inputStyle = {
  marginTop: 4,
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid #ccc',
}

const cardStyle = {
  border: '1px solid #dfe6e9',
  padding: 12,
  borderRadius: 8,
  background: '#f9fbfc',
  marginTop: 8,
}

const cardTitleStyle = {
  margin: '0 0 4px 0',
}

const primaryButtonStyle = {
  background: '#1e88e5',
  color: '#fff',
  border: 'none',
  padding: '10px 16px',
  borderRadius: 8,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  background: '#ecf0f1',
  color: '#2c3e50',
  border: 'none',
  padding: '10px 16px',
  borderRadius: 8,
  cursor: 'pointer',
}
