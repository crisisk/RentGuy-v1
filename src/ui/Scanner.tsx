import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'

import { api } from '@infra/http/api'
import { flushQueue, getQueueCount, queueScan } from '@infra/offline-queue'
import { mapUnknownToApiError, type ApiError } from '@errors'

type ScanDirection = 'in' | 'out'

type BundleMode = 'explode' | 'book_all'

interface BundleItem {
  item_id?: number | string
  quantity?: number
}

interface BundleResolution {
  kind: 'bundle'
  bundle_id?: number | string
  bundle_items?: BundleItem[]
  [key: string]: unknown
}

interface ItemResolution {
  kind: 'item'
  item_id?: number | string
  [key: string]: unknown
}

interface UnknownResolution {
  kind: 'unknown'
  [key: string]: unknown
}

interface GenericResolution {
  kind: string
  [key: string]: unknown
}

type TagResolution = BundleResolution | ItemResolution | UnknownResolution | GenericResolution

interface ScanPayload {
  tag_value: string
  direction: ScanDirection
  project_id: number
  qty: number
  bundle_mode: BundleMode | null
}

interface ResponseMeta {
  code?: string
  detail?: string
  [key: string]: unknown
}

const DEFAULT_STATUS = 'Scan een QR-code om te starten.'
const DEFAULT_BUNDLE_MODE: BundleMode = 'explode'
const MAX_PROJECT_ID_LENGTH = 12

function isBrowserOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true
  }
  return navigator.onLine
}

function isBundleResolution(resolution: TagResolution): resolution is BundleResolution {
  return resolution.kind === 'bundle'
}

function isItemResolution(resolution: TagResolution): resolution is ItemResolution {
  return resolution.kind === 'item'
}

function extractResponseMeta(error: ApiError): ResponseMeta | null {
  const response = error.meta?.response
  if (response && typeof response === 'object') {
    return response as ResponseMeta
  }
  return null
}

export default function Scanner(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [result, setResult] = useState<string>('')
  const [direction, setDirection] = useState<ScanDirection>('out')
  const [projectId, setProjectId] = useState<string>('1')
  const [qty, setQty] = useState<number>(1)
  const [status, setStatus] = useState<string>(DEFAULT_STATUS)
  const [resolution, setResolution] = useState<TagResolution | null>(null)
  const [bundleMode, setBundleMode] = useState<BundleMode>(DEFAULT_BUNDLE_MODE)
  const [isOffline, setIsOffline] = useState<boolean>(() => !isBrowserOnline())
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [loadingResolution, setLoadingResolution] = useState<boolean>(false)

  const fetchQueueCount = useCallback(async () => {
    try {
      const count = await getQueueCount()
      setPendingCount(count)
    } catch {
      setPendingCount(0)
    }
  }, [])

  const pushScan = useCallback(async (payload: ScanPayload) => {
    await api.post('/api/v1/warehouse/scan', payload)
  }, [])

  const syncQueue = useCallback(async () => {
    try {
      const { processed, remaining } = await flushQueue<ScanPayload>(pushScan)
      if (processed > 0) {
        setStatus(`Offline wachtrij verwerkt: ${processed} boekingen gesynchroniseerd.`)
      }
      setPendingCount(remaining)
    } catch (error) {
      const appError = mapUnknownToApiError(error)
      setStatus(appError.message)
      await fetchQueueCount()
    }
  }, [fetchQueueCount, pushScan])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const reader = new BrowserMultiFormatReader()
    let controls: IScannerControls | undefined
    let cancelled = false

    reader
      .decodeFromVideoDevice(null, videoRef.current, (res, _err, nextControls) => {
        if (nextControls) {
          controls = nextControls
        }
        if (cancelled) {
          return
        }
        if (res) {
          setResult(res.getText())
        }
      })
      .catch(error => {
        const appError = mapUnknownToApiError(error)
        setStatus(appError.message)
      })

    return () => {
      cancelled = true
      controls?.stop()
      reader.reset()
    }
  }, [])

  useEffect(() => {
    if (!result) {
      setResolution(null)
      setBundleMode(DEFAULT_BUNDLE_MODE)
      return
    }

    let cancelled = false

    const resolveTag = async (value: string) => {
      setLoadingResolution(true)
      try {
        const { data } = await api.get<TagResolution>(`/api/v1/warehouse/tags/${encodeURIComponent(value)}`)
        if (cancelled) {
          return
        }
        setResolution(data)
        if (isBundleResolution(data)) {
          setStatus('Bundel gevonden – kies een boekingsmodus.')
          setBundleMode(DEFAULT_BUNDLE_MODE)
        } else if (isItemResolution(data)) {
          setStatus('Item gevonden. Controleer hoeveelheid en bevestig.')
        } else if (data.kind === 'unknown') {
          setStatus('Tag niet gekoppeld. Registreer de tag in de backoffice.')
        } else {
          setStatus('Taginformatie opgehaald.')
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        const appError = mapUnknownToApiError(error)
        if (appError.code === 'network') {
          setIsOffline(true)
          setStatus('Geen verbinding: tagdetails worden niet opgehaald. Boeking wordt in wachtrij geplaatst.')
        } else if (appError.code === 'not_found') {
          setStatus('Tag onbekend of gedeactiveerd.')
        } else {
          setStatus(appError.message)
        }
        setResolution(null)
      } finally {
        if (!cancelled) {
          setLoadingResolution(false)
        }
      }
    }

    void resolveTag(result)

    return () => {
      cancelled = true
    }
  }, [result])

  useEffect(() => {
    void fetchQueueCount()

    if (typeof window === 'undefined') {
      return
    }

    const handleOnline = () => {
      setIsOffline(false)
      void syncQueue()
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
    if (!result) {
      return
    }

    const trimmedProjectId = projectId.trim().slice(0, MAX_PROJECT_ID_LENGTH)
    const projectIdInt = Number.parseInt(trimmedProjectId, 10)
    if (Number.isNaN(projectIdInt)) {
      setStatus('Project ID moet numeriek zijn.')
      return
    }

    const payload: ScanPayload = {
      tag_value: result,
      direction,
      project_id: projectIdInt,
      qty,
      bundle_mode: isBundleResolution(resolution ?? { kind: 'unknown' }) ? bundleMode : null,
    }

    if (isBundleResolution(resolution ?? { kind: 'unknown' }) && !bundleMode) {
      setStatus('Kies eerst of je de bundel uitklapt of als geheel boekt.')
      return
    }

    try {
      await pushScan(payload)
      setStatus('Beweging geregistreerd.')
      setResult('')
      setResolution(null)
      setBundleMode(DEFAULT_BUNDLE_MODE)
    } catch (error) {
      const appError = mapUnknownToApiError(error)
      const response = extractResponseMeta(appError)

      if (appError.httpStatus === 409 && response?.code === 'bundle_mode_required') {
        setStatus('De server vraagt om een bundelmodus. Kies een optie en probeer opnieuw.')
        return
      }

      if (appError.code === 'network') {
        await queueScan(payload)
        await fetchQueueCount()
        setIsOffline(true)
        setStatus('Offline: scan toegevoegd aan wachtrij. Wordt verstuurd zodra de verbinding terug is.')
        setResult('')
        setResolution(null)
        return
      }

      if (appError.code === 'not_found') {
        setStatus('Boeking geweigerd: tag onbekend.')
        return
      }

      setStatus((response?.detail && String(response.detail)) || appError.message)
    }
  }, [bundleMode, direction, fetchQueueCount, projectId, pushScan, qty, resolution, result])

  const resolutionDetails = useMemo(() => {
    if (!result) {
      return null
    }
    if (loadingResolution) {
      return <p style={{ marginTop: 12 }}>Tag analyseren…</p>
    }
    if (!resolution) {
      return <p style={{ marginTop: 12 }}>Geen taginformatie beschikbaar.</p>
    }
    if (isItemResolution(resolution)) {
      return (
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>Item</h4>
          <p>
            Item-ID: <strong>{resolution.item_id ?? 'Onbekend'}</strong>
          </p>
        </div>
      )
    }
    if (isBundleResolution(resolution)) {
      const items: BundleItem[] = Array.isArray(resolution.bundle_items) ? resolution.bundle_items : []
      return (
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>Bundel #{resolution.bundle_id ?? '—'}</h4>
          {items.length > 0 ? (
            <>
              <p>Deze bundel bevat:</p>
              <ul>
                {items.map(item => (
                  <li key={`${item.item_id ?? 'onbekend'}`}>
                    Item {item.item_id ?? 'onbekend'} × {item.quantity ?? 1}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>Deze bundel bevat geen bekende componenten.</p>
          )}
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
  }, [bundleMode, loadingResolution, resolution, result])

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
      <p style={{ marginTop: 12 }}>
        Laatste scan: <strong>{result || '—'}</strong>
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label style={fieldStyle}>
          Project ID
          <input
            value={projectId}
            maxLength={MAX_PROJECT_ID_LENGTH}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setProjectId(event.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={fieldStyle}>
          Aantal
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const next = Number.parseInt(event.target.value, 10)
              setQty(Number.isNaN(next) || next <= 0 ? 1 : next)
            }}
            style={inputStyle}
          />
        </label>
      </div>
      <div style={{ margin: '12px 0' }}>
        <label style={{ marginRight: 12 }}>
          <input
            type="radio"
            name="dir"
            value="out"
            checked={direction === 'out'}
            onChange={() => setDirection('out')}
          />{' '}
          Uitgaand
        </label>
        <label>
          <input
            type="radio"
            name="dir"
            value="in"
            checked={direction === 'in'}
            onChange={() => setDirection('in')}
          />{' '}
          Inkomend
        </label>
      </div>
      {resolutionDetails}
      <button onClick={submit} disabled={!result} style={primaryButtonStyle}>
        Boek beweging
      </button>
      <button onClick={() => void syncQueue()} style={{ ...secondaryButtonStyle, marginLeft: 8 }}>
        Synchroniseer wachtrij
      </button>
      <p style={{ marginTop: 16, minHeight: 24 }}>{status}</p>
    </div>
  )
}

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  fontSize: 14,
}

const inputStyle: CSSProperties = {
  marginTop: 4,
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid #ccc',
}

const cardStyle: CSSProperties = {
  border: '1px solid #dfe6e9',
  padding: 12,
  borderRadius: 8,
  background: '#f9fbfc',
  marginTop: 8,
}

const cardTitleStyle: CSSProperties = {
  margin: '0 0 4px 0',
}

const primaryButtonStyle: CSSProperties = {
  background: '#1e88e5',
  color: '#fff',
  border: 'none',
  padding: '10px 16px',
  borderRadius: 8,
  cursor: 'pointer',
}

const secondaryButtonStyle: CSSProperties = {
  background: '#ecf0f1',
  color: '#2c3e50',
  border: 'none',
  padding: '10px 16px',
  borderRadius: 8,
  cursor: 'pointer',
}
