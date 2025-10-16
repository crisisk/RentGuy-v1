import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { fetchEmailDiagnostics, fetchManagedSecrets, syncManagedSecrets, updateManagedSecret } from '@application/platform/secrets/api'
import type { EmailDiagnostics, ManagedSecret } from '@rg-types/platform'
import { brand, brandFontStack, headingFontStack, withOpacity } from '@ui/branding'

interface SecretsDashboardProps {
  onLogout: () => void
}

type FeedbackTone = 'success' | 'error' | 'info'

interface FeedbackMessage {
  tone: FeedbackTone
  message: string
}

const timestampFormatter = new Intl.DateTimeFormat('nl-NL', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatTimestamp(value?: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return timestampFormatter.format(parsed)
}

const categoryLabels: Record<string, string> = {
  core: 'Kernconfiguratie',
  email: 'E-mail & notificaties',
  payments: 'Betalingen',
  integrations: 'Integraties',
  observability: 'Observability',
  custom: 'Aangepast',
}

const categoryOrder = ['core', 'email', 'payments', 'integrations', 'observability', 'custom']

function categoryWeight(category: string): number {
  const index = categoryOrder.indexOf(category)
  return index === -1 ? categoryOrder.length : index
}

export default function SecretsDashboard({ onLogout }: SecretsDashboardProps): JSX.Element {
  const [secrets, setSecrets] = useState<ManagedSecret[]>([])
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)
  const [savingKeys, setSavingKeys] = useState<Set<string>>(() => new Set())
  const [syncing, setSyncing] = useState(false)
  const [emailDiagnostics, setEmailDiagnostics] = useState<EmailDiagnostics | null>(null)

  const markSaving = useCallback((key: string, saving: boolean) => {
    setSavingKeys(prev => {
      const next = new Set(prev)
      if (saving) {
        next.add(key)
      } else {
        next.delete(key)
      }
      return next
    })
  }, [])

  const fetchSecrets = useCallback(async () => {
    const result = await fetchManagedSecrets()
    if (result.ok) {
      setSecrets(result.value)
      setError(null)
      return true
    }
    setError(result.error.message ?? 'Secrets konden niet geladen worden.')
    return false
  }, [])

  const refreshEmailDiagnostics = useCallback(async () => {
    const result = await fetchEmailDiagnostics()
    if (result.ok) {
      setEmailDiagnostics(result.value)
    } else {
      setEmailDiagnostics(null)
      console.warn('Kon e-maildiagnose niet laden', result.error)
    }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      await fetchSecrets()
      if (active) {
        setLoading(false)
      }
    })()
    refreshEmailDiagnostics()
    return () => {
      active = false
    }
  }, [fetchSecrets, refreshEmailDiagnostics])

  const grouped = useMemo(() => {
    const buckets = new Map<string, ManagedSecret[]>()
    for (const secret of secrets) {
      const bucketKey = secret.category || 'custom'
      const bucket = buckets.get(bucketKey) ?? []
      bucket.push(secret)
      buckets.set(bucketKey, bucket)
    }
    return buckets
  }, [secrets])

  const handleInputChange = useCallback((key: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const handleSave = useCallback(
    async (secret: ManagedSecret) => {
      const draftValue = formValues[secret.key] ?? ''
      const trimmed = draftValue.trim()

      if (!secret.hasValue && trimmed.length === 0) {
        setFeedback({ tone: 'error', message: `Vul een waarde in voor ${secret.label} voordat je opslaat.` })
        return
      }

      setFeedback(null)
      markSaving(secret.key, true)
      const result = await updateManagedSecret(secret.key, { value: trimmed.length > 0 ? trimmed : '' })
      if (result.ok) {
        setSecrets(prev => prev.map(item => (item.key === secret.key ? result.value : item)))
        setFormValues(prev => ({ ...prev, [secret.key]: '' }))
        setFeedback({ tone: trimmed.length > 0 ? 'success' : 'info', message: `${secret.label} is ${trimmed.length > 0 ? 'opgeslagen' : 'leeg gemaakt'}.` })
        await refreshEmailDiagnostics()
      } else {
        setFeedback({ tone: 'error', message: result.error.message ?? 'Opslaan mislukt. Probeer het opnieuw.' })
      }
      markSaving(secret.key, false)
    },
    [formValues, markSaving, refreshEmailDiagnostics],
  )

  const handleSync = useCallback(async () => {
    setFeedback(null)
    setSyncing(true)
    const result = await syncManagedSecrets()
    if (result.ok) {
      const restartHint = result.value.triggeredRestart ? ' Herstart de backend-service om wijzigingen toe te passen.' : ''
      setFeedback({
        tone: 'success',
        message: `Secrets opgeslagen naar ${result.value.envPath}. ${restartHint}`.trim(),
      })
      await fetchSecrets()
      await refreshEmailDiagnostics()
    } else {
      setFeedback({ tone: 'error', message: result.error.message ?? 'Synchroniseren naar het systeem is mislukt.' })
    }
    setSyncing(false)
  }, [fetchSecrets, refreshEmailDiagnostics])

  const renderFeedback = () => {
    if (!feedback) return null
    const color = feedback.tone === 'success' ? brand.colors.success : feedback.tone === 'error' ? brand.colors.danger : brand.colors.primary
    return (
      <div
        role="status"
        style={{
          padding: '14px 18px',
          borderRadius: 16,
          background: withOpacity(color, 0.12),
          border: `1px solid ${withOpacity(color, 0.4)}`,
          color: color,
          fontWeight: 600,
        }}
      >
        {feedback.message}
      </div>
    )
  }

  const renderEmailDiagnostics = () => {
    if (!emailDiagnostics) {
      return (
        <div
          style={{
            display: 'grid',
            gap: 8,
            padding: '20px 24px',
            borderRadius: 20,
            background: withOpacity(brand.colors.primary, 0.05),
            border: `1px dashed ${withOpacity(brand.colors.primary, 0.4)}`,
          }}
        >
          <strong style={{ fontFamily: headingFontStack, color: brand.colors.primary }}>E-maildiagnose niet beschikbaar</strong>
          <span style={{ color: brand.colors.mutedText }}>
            De status kon niet worden opgehaald. Controleer de verbinding en probeer het later opnieuw.
          </span>
        </div>
      )
    }

    const statusColor = emailDiagnostics.status === 'ok' ? brand.colors.success : emailDiagnostics.status === 'warning' ? brand.colors.warning : brand.colors.danger
    return (
      <div
        style={{
          display: 'grid',
          gap: 12,
          padding: '24px 28px',
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(227, 232, 255, 0.82) 100%)',
          border: `1px solid ${withOpacity(statusColor, 0.4)}`,
          boxShadow: brand.colors.shadow,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.22em', color: brand.colors.mutedText }}>
              E-mailintegratie
            </span>
            <h3 style={{ margin: 4, fontFamily: headingFontStack, color: statusColor }}>Status: {emailDiagnostics.status.toUpperCase()}</h3>
          </div>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              fontWeight: 600,
              color: '#fff',
              background: statusColor,
              letterSpacing: '0.04em',
            }}
          >
            {emailDiagnostics.nodeReady ? 'Express-ready' : 'Configuratie vereist'}
          </div>
        </div>
        <p style={{ margin: 0, color: brand.colors.mutedText }}>{emailDiagnostics.message}</p>
        {emailDiagnostics.missing.length > 0 && (
          <div style={{ color: brand.colors.danger }}>
            Ontbrekend: {emailDiagnostics.missing.join(', ')}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, color: brand.colors.mutedText }}>
          <strong style={{ fontFamily: headingFontStack }}>Geconfigureerd:</strong>
          {emailDiagnostics.configured.length > 0 ? emailDiagnostics.configured.join(', ') : '—'}
        </div>
        <div style={{ color: brand.colors.mutedText }}>
          Authenticatie: {emailDiagnostics.authConfigured ? 'ingesteld' : 'niet ingesteld'}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: brand.colors.appBackground,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: brandFontStack,
          color: brand.colors.text,
        }}
      >
        <div style={{ display: 'grid', gap: 16, textAlign: 'center' }}>
          <div
            aria-hidden
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: `4px solid ${withOpacity(brand.colors.primary, 0.2)}`,
              borderTopColor: brand.colors.primary,
              animation: 'rg-spin 1s linear infinite',
              margin: '0 auto',
            }}
          />
          <span style={{ fontWeight: 600 }}>Gegevens laden…</span>
          <style>
            {`@keyframes rg-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
          </style>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: brand.colors.appBackground,
        padding: '32px 20px 64px',
        fontFamily: brandFontStack,
        color: brand.colors.text,
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '28px 32px',
            borderRadius: 28,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(227, 232, 255, 0.82) 100%)',
            boxShadow: brand.colors.shadow,
            border: `1px solid ${withOpacity(brand.colors.primary, 0.28)}`,
          }}
        >
          <div style={{ display: 'grid', gap: 8 }}>
            <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.22em', color: brand.colors.mutedText }}>
              {brand.shortName} · Secrets dashboard
            </span>
            <h1 style={{ margin: 0, fontFamily: headingFontStack, color: brand.colors.secondary }}>Systeemconfiguratie</h1>
            <p style={{ margin: 0, maxWidth: 520, color: brand.colors.mutedText }}>
              Beheer alle .env-variabelen centraal en publiceer ze automatisch naar het platform. Wijzigingen worden versleuteld opgeslagen
              en kunnen na synchronisatie door de FastAPI- en Express-componenten worden opgehaald.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              to="/planner"
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                border: `1px solid ${withOpacity(brand.colors.primary, 0.4)}`,
                background: '#ffffff',
                color: brand.colors.primary,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Terug naar planner
            </Link>
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
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '16px 20px',
              borderRadius: 18,
              border: `1px solid ${withOpacity(brand.colors.danger, 0.4)}`,
              background: withOpacity(brand.colors.danger, 0.08),
              color: brand.colors.danger,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {renderFeedback()}

        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: brand.colors.mutedText }}>Synchroniseer opgeslagen waarden naar het systeem.</span>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                border: 'none',
                background: syncing ? withOpacity(brand.colors.primary, 0.4) : brand.colors.primary,
                color: '#fff',
                fontWeight: 600,
                cursor: syncing ? 'not-allowed' : 'pointer',
                boxShadow: syncing ? 'none' : '0 12px 24px rgba(79, 70, 229, 0.24)',
                transition: 'background 0.2s ease',
              }}
            >
              {syncing ? 'Synchroniseren…' : 'Secrets synchroniseren'}
            </button>
          </div>
          {renderEmailDiagnostics()}
        </div>

        <div style={{ display: 'grid', gap: 24 }}>
          {Array.from(grouped.entries())
            .sort((a, b) => categoryWeight(a[0]) - categoryWeight(b[0]))
            .map(([category, items]) => {
              const label = categoryLabels[category] ?? categoryLabels.custom
              const sortedItems = [...items].sort((a, b) => a.label.localeCompare(b.label))
              return (
                <section key={category} style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontFamily: headingFontStack, color: brand.colors.secondary }}>{label}</h2>
                    <span style={{ color: brand.colors.mutedText }}>{sortedItems.length} variabelen</span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gap: 16,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(227, 232, 255, 0.86) 100%)',
                      borderRadius: 24,
                      padding: '18px 24px',
                      border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
                      boxShadow: brand.colors.shadow,
                    }}
                  >
                    {sortedItems.map(item => {
                      const inputValue = formValues[item.key] ?? ''
                      const saving = savingKeys.has(item.key)
                      const placeholder = item.hasValue
                        ? item.isSensitive
                          ? item.valueHint ?? 'Waarde geconfigureerd'
                          : item.valueHint ?? 'Waarde geconfigureerd'
                        : 'Nog niet ingesteld'

                      return (
                        <div
                          key={item.key}
                          style={{
                            display: 'grid',
                            gap: 8,
                            padding: '14px 16px',
                            borderRadius: 18,
                            background: '#ffffff',
                            border: `1px solid ${withOpacity(brand.colors.primary, 0.12)}`,
                          }}
                        >
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
                            <div>
                              <strong style={{ fontFamily: headingFontStack }}>{item.label}</strong>
                              <div style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>{item.description ?? '—'}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 999,
                                  background: withOpacity(item.hasValue ? brand.colors.success : brand.colors.warning, 0.15),
                                  color: item.hasValue ? brand.colors.success : brand.colors.warning,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  letterSpacing: '0.05em',
                                }}
                              >
                                {item.hasValue ? 'Geconfigureerd' : 'Ontbreekt'}
                              </span>
                              {item.requiresRestart && (
                                <span
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                    background: withOpacity(brand.colors.secondary, 0.15),
                                    color: brand.colors.secondary,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Herstart vereist
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'grid', gap: 12 }}>
                            <input
                              type={item.isSensitive ? 'password' : 'text'}
                              value={inputValue}
                              placeholder={placeholder}
                              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                handleInputChange(item.key, event.target.value)
                              }
                              style={{
                                padding: '10px 14px',
                                borderRadius: 12,
                                border: `1px solid ${withOpacity(brand.colors.primary, 0.24)}`,
                                fontSize: '1rem',
                                fontFamily: 'inherit',
                              }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: brand.colors.mutedText }}>
                              <span>Laatst gewijzigd: {formatTimestamp(item.updatedAt)}</span>
                              <span>Laatste sync: {formatTimestamp(item.lastSyncedAt)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => handleSave(item)}
                                disabled={saving}
                                style={{
                                  padding: '8px 18px',
                                  borderRadius: 999,
                                  border: 'none',
                                  background: saving ? withOpacity(brand.colors.primary, 0.4) : brand.colors.primary,
                                  color: '#fff',
                                  fontWeight: 600,
                                  cursor: saving ? 'not-allowed' : 'pointer',
                                  boxShadow: saving ? 'none' : '0 10px 20px rgba(79, 70, 229, 0.2)',
                                  minWidth: 140,
                                }}
                              >
                                {saving ? 'Opslaan…' : 'Opslaan'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
        </div>
      </div>
    </div>
  )
}
