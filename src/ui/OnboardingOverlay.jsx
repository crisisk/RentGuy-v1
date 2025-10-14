// @ts-nocheck
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { getSteps, getProgress, completeStep, getTips } from '@application/onboarding/api'
import onboardingTips from './onboarding_tips.json'
import { brand, brandFontStack, headingFontStack, withOpacity } from '@ui/branding'

const fallbackSteps = [
  {
    code: 'kickoff',
    title: 'Kick-off met Mister DJ',
    description: 'Controleer tenantgegevens, hoofdcontacten en eventkalender voor het komende seizoen.',
  },
  {
    code: 'branding',
    title: 'Branding & tone-of-voice',
    description: 'Upload het paars-blauwe gradient, logo’s en stel de 100% Dansgarantie tagline in.',
  },
  {
    code: 'packages',
    title: 'Pakketstructuur valideren',
    description: 'Bevestig Silver, Gold, Diamond en Platinum shows inclusief add-ons en kortingen.',
  },
  {
    code: 'inventory',
    title: 'Gear & voorraad importeren',
    description: 'Importeer Pioneer decks, moving heads en microfoons als MR-DJ kits voor scanning.',
  },
  {
    code: 'crew',
    title: 'Crew en draaiboeken koppelen',
    description: 'Nodig Bart’s team uit en activeer automatische briefings per shift.',
  },
  {
    code: 'transport',
    title: 'Logistiek en routes plannen',
    description: 'Plan ritten, chauffeurs en bufferuren voor op- en afbouw inclusief QR-check-ins.',
  },
  {
    code: 'billing',
    title: 'Facturatie & Mollie koppelen',
    description: 'Link Invoice Ninja, voorschotten en Mollie betalingen aan RentGuy milestones.',
  },
  {
    code: 'automation',
    title: 'Automatiseringen activeren',
    description: 'Trigger WhatsApp-updates, voorraadalerts en dashboards na elke mijlpaal.',
  },
]

const fallbackTips = onboardingTips.map((tip, index) => ({
  ...tip,
  id: tip.id ?? `fallback-${index}`,
}))

const stepMeta = {
  kickoff: { module: 'projects', icon: '🚀' },
  branding: { module: 'templates', icon: '🎨' },
  packages: { module: 'inventory', icon: '🎛️' },
  inventory: { module: 'warehouse', icon: '📦' },
  crew: { module: 'crew', icon: '🎤' },
  transport: { module: 'transport', icon: '🚚' },
  billing: { module: 'billing', icon: '💸' },
  automation: { module: 'automation', icon: '⚙️' },
}

const moduleLabels = {
  projects: 'Planner',
  inventory: 'Inventory',
  crew: 'Crew & HR',
  warehouse: 'Warehouse',
  billing: 'Billing',
  transport: 'Transport',
  templates: 'Templates',
  automation: 'Automations',
}

const moduleIcons = {
  projects: '🎚️',
  inventory: '📦',
  crew: '🎤',
  warehouse: '🏭',
  billing: '💳',
  transport: '🚚',
  templates: '🧾',
  automation: '⚙️',
}

const stepActions = {
  kickoff: {
    href: '/onboarding/company',
    label: 'Tenantprofiel openen',
    description: 'Verifieer contactpersonen, SLA’s en branding-afspraken met Mister DJ.',
  },
  branding: {
    href: '/design/theme',
    label: 'Branding instellingen',
    description: 'Upload logo’s, stel het paars-blauwe gradient in en check fonts en tagline.',
  },
  packages: {
    href: '/catalog/packages',
    label: 'Pakketten beheren',
    description: 'Zorg dat Silver/Gold/Diamond/Platinum showprofielen correct staan.',
  },
  inventory: {
    href: '/inventory/import',
    label: 'Importeer gear CSV',
    description: 'Gebruik de voorbereide sjabloon zodat kits en voorraad direct beschikbaar zijn.',
  },
  crew: {
    href: '/crew',
    label: 'Crew uitnodigen',
    description: 'Koppel rollen, shifts en briefingtemplates voor technici en chauffeurs.',
  },
  transport: {
    href: '/transport/routes',
    label: 'Routes plannen',
    description: 'Leg ritten vast met buffer en verstuur QR-check-ins naar chauffeurs.',
  },
  billing: {
    href: '/billing/invoices/new',
    label: 'Facturatie activeren',
    description: 'Activeer Invoice Ninja + Mollie en genereer een voorschotfactuur.',
  },
  automation: {
    href: '/automation/studio',
    label: 'Automatiseringen openen',
    description: 'Automatiseer WhatsApp-updates en voorraadalerts na elke showfase.',
  },
}

const COMPLETION_RATE_LIMIT_MS = 1500

function emitOnboardingEvent(type, payload = {}) {
  const detail = { type, timestamp: new Date().toISOString(), ...payload }
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('rentguy:onboarding', { detail }))
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: `rentguy_${type}`, ...detail })
      }
    } catch (error) {
      console.warn('Onboarding event kon niet verstuurd worden', error)
    }
  }
  if (typeof console !== 'undefined' && console.info) {
    console.info('[onboarding]', type, detail)
  }
}

function normalizeSteps(list) {
  return (list ?? []).map(step => ({
    ...step,
    code: step.code || step.title?.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'step',
  }))
}

function normalizeTips(list) {
  return (list ?? []).map((tip, index) => ({
    ...tip,
    id: tip.id ?? `${tip.module || 'tip'}-${index}`,
  }))
}

export default function OnboardingOverlay(props) {
  const { email, onClose, onSnooze, onFinish } = props || {}
  const snoozeHandler = onSnooze ?? onClose
  const finishHandler = onFinish ?? onClose
  const [steps, setSteps] = useState(() => normalizeSteps(fallbackSteps))
  const [done, setDone] = useState(new Set())
  const [tips, setTips] = useState(() => normalizeTips(fallbackTips))
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [busyStep, setBusyStep] = useState('')
  const [busyActionStep, setBusyActionStep] = useState('')
  const [refreshingProgress, setRefreshingProgress] = useState(false)
  const controllersRef = useRef(new Set())
  const containerRef = useRef(null)
  const [headingId] = useState(() => `onboarding-heading-${Math.random().toString(36).slice(2)}`)
  const [descriptionId] = useState(
    () => `onboarding-description-${Math.random().toString(36).slice(2)}`
  )
  const lastCompletionRef = useRef(0)

  useEffect(() => {
    return () => {
      controllersRef.current.forEach(controller => controller.abort())
      controllersRef.current.clear()
    }
  }, [])

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()
    controllersRef.current.add(controller)
    setLoading(true)
    setErrorMessage('')
    ;(async () => {
      try {
        const [stepsResult, progressResult, tipsResult] = await Promise.allSettled([
          getSteps({ signal: controller.signal }),
          getProgress(email, { signal: controller.signal }),
          getTips(undefined, { signal: controller.signal }),
        ])

        if (ignore || controller.signal.aborted) return

        const resolvedSteps =
          stepsResult.status === 'fulfilled' && stepsResult.value.length
            ? normalizeSteps(stepsResult.value)
            : normalizeSteps(fallbackSteps)

        const resolvedTips =
          tipsResult.status === 'fulfilled' && tipsResult.value.length
            ? normalizeTips(tipsResult.value)
            : normalizeTips(fallbackTips)

        const resolvedProgress =
          progressResult.status === 'fulfilled' && Array.isArray(progressResult.value)
            ? progressResult.value
            : []

        setSteps(resolvedSteps)
        setTips(resolvedTips)
        setDone(
          new Set(resolvedProgress.filter(item => item.status === 'complete').map(item => item.step_code))
        )

        const usedFallbackSteps = stepsResult.status !== 'fulfilled' || !stepsResult.value.length
        const usedFallbackTips = tipsResult.status !== 'fulfilled' || !tipsResult.value.length
        const usedFallbackProgress = progressResult.status !== 'fulfilled'

        if (usedFallbackSteps || usedFallbackTips || usedFallbackProgress) {
          setErrorMessage(
            'We tonen de Mister DJ standaard onboarding (cached) omdat live data tijdelijk niet beschikbaar is.'
          )
          emitOnboardingEvent('data_fallback', {
            email,
            usedFallbackSteps,
            usedFallbackTips,
            usedFallbackProgress,
          })
        }
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('Kon onboardinggegevens niet laden', error)
        if (!ignore) {
          setSteps(normalizeSteps(fallbackSteps))
          setTips(normalizeTips(fallbackTips))
          setDone(new Set())
          setErrorMessage(
            'We tonen de Mister DJ standaard onboarding (cached) omdat live data tijdelijk niet beschikbaar is.'
          )
          emitOnboardingEvent('data_error', { email, message: error?.message })
        }
      } finally {
        controllersRef.current.delete(controller)
        if (!ignore && !controller.signal.aborted) {
          setLoading(false)
        }
      }
    })()

    return () => {
      ignore = true
      controller.abort()
      controllersRef.current.delete(controller)
    }
  }, [email])

  useEffect(() => {
    if (!containerRef.current) return
    const previouslyFocused = document.activeElement
    containerRef.current.focus({ preventScroll: true })
    return () => {
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [])

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        snoozeHandler?.()
      }
    },
    [snoozeHandler]
  )

  const progress = useMemo(() => {
    return steps.length ? Math.round((done.size / steps.length) * 100) : 0
  }, [done, steps])

  const nextStep = useMemo(() => {
    return steps.find(step => !done.has(step.code)) || null
  }, [steps, done])

  const allComplete = steps.length > 0 && done.size === steps.length
  const nextStepCode = nextStep?.code || ''

  const refreshProgress = useCallback(async () => {
    if (refreshingProgress) return
    const controller = new AbortController()
    controllersRef.current.add(controller)
    setRefreshingProgress(true)
    try {
      const progressData = await getProgress(email, { signal: controller.signal })
      if (controller.signal.aborted) return
      setDone(new Set(progressData.filter(item => item.status === 'complete').map(item => item.step_code)))
    } catch (error) {
      if (controller.signal.aborted) return
      console.error('Kon voortgang niet verversen', error)
      setErrorMessage('Kon de voortgang niet verversen. Probeer het opnieuw of contacteer het Sevensa supportteam.')
    } finally {
      controllersRef.current.delete(controller)
      if (!controller.signal.aborted) {
        setRefreshingProgress(false)
      }
    }
  }, [email, refreshingProgress])

  async function mark(step) {
    if (busyStep) return
    const now = Date.now()
    if (now - lastCompletionRef.current < COMPLETION_RATE_LIMIT_MS) {
      setErrorMessage('Rustig aan! Wacht een paar tellen voordat je de volgende stap afrondt.')
      return
    }
    const controller = new AbortController()
    controllersRef.current.add(controller)
    setBusyStep(step.code)
    setErrorMessage('')
    try {
      await completeStep(email, step.code, { signal: controller.signal })
      const progressData = await getProgress(email, { signal: controller.signal })
      if (controller.signal.aborted) return
      setDone(new Set(progressData.filter(item => item.status === 'complete').map(item => item.step_code)))
      lastCompletionRef.current = Date.now()
      emitOnboardingEvent('step_completed', { email, step: step.code })
    } catch (error) {
      if (controller.signal.aborted) return
      console.error('Stap kon niet worden bijgewerkt', error)
      setErrorMessage('Kon de stap niet bijwerken. Probeer het opnieuw of contacteer het Sevensa supportteam.')
      emitOnboardingEvent('step_error', { email, step: step.code, message: error?.message })
    } finally {
      controllersRef.current.delete(controller)
      if (!controller.signal.aborted) {
        setBusyStep('')
      }
    }
  }

  const handleAction = useCallback(
    step => {
      if (!step?.code) return
      const action = stepActions[step.code]
      if (!action?.href) return
      setBusyActionStep(step.code)
      emitOnboardingEvent('cta_clicked', { email, step: step.code, href: action.href })
      if (typeof window === 'undefined') {
        setBusyActionStep('')
        return
      }
      window.requestAnimationFrame(() => {
        try {
          window.open(action.href, '_blank', 'noopener,noreferrer')
        } finally {
          setTimeout(() => setBusyActionStep(''), 400)
        }
      })
    },
    [email]
  )

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        inset: 0,
        background: `linear-gradient(120deg, ${withOpacity(brand.colors.secondary, 0.9)} 0%, ${withOpacity(
          brand.colors.primaryDark,
          0.92
        )} 45%, ${withOpacity('#051923', 0.85)} 100%)`,
        color: brand.colors.text,
        zIndex: 9999,
        fontFamily: brandFontStack,
        overflowY: 'auto',
        padding: '48px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(227, 232, 255, 0.84) 100%)',
          borderRadius: 32,
          padding: '36px 40px',
          boxShadow: brand.colors.shadow,
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        <header
          style={{
            background: brand.colors.gradient,
            borderRadius: 26,
            padding: '32px 36px',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => snoozeHandler?.()}
              style={{
                background: withOpacity('#ffffff', 0.2),
                border: '1px solid rgba(255,255,255,0.45)',
                borderRadius: 999,
                color: '#fff',
                padding: '8px 16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Later doorgaan
            </button>
            {finishHandler && (
              <button
                onClick={() => allComplete && finishHandler?.()}
                disabled={!allComplete}
                style={{
                  backgroundImage: allComplete
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.75))'
                    : withOpacity('#ffffff', 0.1),
                  border: allComplete ? '1px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.35)',
                  borderRadius: 999,
                  color: allComplete ? brand.colors.secondary : 'rgba(255,255,255,0.85)',
                  padding: '8px 18px',
                  fontWeight: 600,
                  cursor: allComplete ? 'pointer' : 'not-allowed',
                  opacity: allComplete ? 1 : 0.6,
                  transition: 'transform 0.2s ease',
                }}
              >
                Checklist afgerond
              </button>
            )}
          </div>
          <span
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.24em',
              fontSize: '0.8rem',
              opacity: 0.85,
            }}
          >
            {brand.shortName} × {brand.tenant.name} launchpad
          </span>
          <h2
            id={headingId}
            style={{ margin: 0, fontSize: '2.2rem', fontFamily: headingFontStack }}
          >
            Onboarding cockpit
          </h2>
          <p id={descriptionId} style={{ margin: 0, maxWidth: 540, lineHeight: 1.5 }}>
            {allComplete
              ? 'Fantastisch! Alle Mister DJ modules zijn geactiveerd binnen Sevensa RentGuy. Gebruik de tips hieronder om de UAT-scenario’s te verfijnen.'
              : 'Volg de stappen om branding, pakketten, crew en finance voor Mister DJ te activeren. We koppelen elke stap aan Sevensa governance en realtime tips.'}
          </p>
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', flexWrap: 'wrap', gap: 8}}>
              <span>{progress}% voltooid</span>
              <div style={{display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
                {loading && <span style={{fontSize: '0.85rem'}}>Data laden…</span>}
                <button
                  onClick={refreshProgress}
                  disabled={refreshingProgress || loading}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    background: withOpacity('#FFFFFF', refreshingProgress || loading ? 0.18 : 0.32),
                    color: brand.colors.secondary,
                    padding: '6px 18px',
                    fontWeight: 600,
                    cursor: refreshingProgress || loading ? 'wait' : 'pointer',
                    boxShadow: refreshingProgress || loading ? 'none' : '0 16px 32px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  {refreshingProgress ? 'Verversen…' : 'Voortgang verversen'}
                </button>
              </div>
            </div>
            <div style={{ height: 14, background: withOpacity('#ffffff', 0.2), borderRadius: 999 }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, rgba(245, 180, 0, 0.65) 0%, rgba(255, 255, 255, 0.85) 100%)',
                  transition: 'width 0.3s ease',
                }}
              ></div>
            </div>
            {!allComplete && nextStep && (
              <div style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', flexWrap: 'wrap'}}>
                <span style={{opacity: 0.85}}>Volgende actie:</span>
                <strong style={{display: 'inline-flex', alignItems: 'center', gap: 6}}>
                  <span>{stepMeta[nextStep.code]?.icon || '✨'}</span>
                  {nextStep.title}
                </strong>
              </div>
            )}
          </div>
        </header>

        {errorMessage && (
          <div
            style={{
              background: withOpacity(brand.colors.danger, 0.12),
              border: `1px solid ${withOpacity(brand.colors.danger, 0.35)}`,
              borderRadius: 18,
              padding: '16px 20px',
              color: brand.colors.secondary,
              fontSize: '0.95rem',
            }}
            role="alert"
            aria-live="assertive"
          >
            {errorMessage}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gap: 24,
            gridTemplateColumns: 'minmax(0, 1.65fr) minmax(0, 1fr)',
          }}
        >
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: brand.colors.secondary }}>Checklist</h3>
            <ol style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14}}>
              {loading && (
                <SkeletonRows />
              )}
              {!loading && steps.map(step => {
                const meta = stepMeta[step.code] || {}
                const completed = done.has(step.code)
                const isNext = !completed && step.code === nextStepCode
                const action = stepActions[step.code]
                return (
                  <StepCard
                    key={step.code}
                    step={step}
                    meta={meta}
                    completed={completed}
                    onMark={() => mark(step)}
                    busy={busyStep === step.code}
                    isNext={isNext}
                    action={action}
                    onAction={() => handleAction(step)}
                    actionBusy={busyActionStep === step.code}
                  />
                )
              })}
            </ol>
          </section>
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: brand.colors.secondary }}>
              Tenant tips & UAT call-outs
            </h3>
            <div style={{display: 'grid', gap: 14}}>
              {tips.map(tip => (
                <TipCard key={tip.id} tip={tip} />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function StepCard({ step, meta, completed, onMark, busy, isNext, action, onAction, actionBusy }) {
  const highlight = isNext && !completed
  const borderColor = highlight
    ? withOpacity(brand.colors.primary, 0.5)
    : completed
    ? withOpacity(brand.colors.accent, 0.35)
    : withOpacity(brand.colors.secondary, 0.14)
  const background = completed
    ? 'linear-gradient(135deg, rgba(107, 70, 193, 0.14) 0%, rgba(16, 185, 129, 0.12) 100%)'
    : highlight
    ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(107, 70, 193, 0.18) 100%)'
    : withOpacity('#FFFFFF', 0.86)
  return (
    <li
      style={{
        padding: '18px 20px',
        borderRadius: 18,
        border: `1px solid ${borderColor}`,
        background,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: highlight ? '0 24px 46px rgba(49, 46, 129, 0.24)' : 'none',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{fontSize: '1.4rem'}}>{meta.icon || '✨'}</span>
        <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <strong style={{fontSize: '1.05rem', color: brand.colors.secondary}}>{step.title}</strong>
            {meta.module && (
              <span
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: withOpacity(brand.colors.secondary, 0.12),
                  color: brand.colors.secondary,
                }}
              >
                {moduleLabels[meta.module] || meta.module}
              </span>
            )}
            {highlight && (
              <span
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: withOpacity(brand.colors.primary, 0.18),
                  color: brand.colors.primary,
                }}
              >
                Volgende actie
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.95rem', color: brand.colors.mutedText }}>{step.description}</span>
      </div>
    </div>
    <div style={{display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'}}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220, flex: 1}}>
        {action?.description && (
          <p style={{margin: 0, fontSize: '0.85rem', color: brand.colors.mutedText}}>{action.description}</p>
        )}
        {action && (
          <button
            type="button"
            onClick={onAction}
            disabled={actionBusy}
            style={{
              alignSelf: 'flex-start',
              border: `1px solid ${withOpacity(brand.colors.primary, 0.38)}`,
              padding: '8px 16px',
              borderRadius: 12,
              background: actionBusy
                ? withOpacity(brand.colors.primary, 0.2)
                : withOpacity('#FFFFFF', 0.92),
              color: brand.colors.secondary,
              fontWeight: 600,
              cursor: actionBusy ? 'wait' : 'pointer',
              boxShadow: actionBusy ? 'none' : '0 18px 34px rgba(37, 99, 235, 0.18)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            {actionBusy ? 'Openen…' : action.label}
          </button>
        )}
      </div>
      <div>
        {completed ? (
          <span style={{display: 'inline-flex', alignItems: 'center', gap: 6, color: brand.colors.success, fontWeight: 600}}>
            ✅ Gereed
          </span>
        ) : (
          <button
            type="button"
            onClick={onMark}
            disabled={busy}
            style={{
              border: 'none',
              padding: '8px 18px',
              borderRadius: 999,
              backgroundImage: brand.colors.gradient,
              color: '#fff',
              fontWeight: 600,
              cursor: busy ? 'wait' : 'pointer',
              boxShadow: busy ? 'none' : '0 18px 36px rgba(79, 70, 229, 0.24)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              opacity: busy ? 0.75 : 1,
            }}
          >
            {busy ? 'Bezig…' : 'Markeer gereed'}
          </button>
        )}
      </div>
    </div>
    </li>
  )
}

function TipCard({ tip }) {
  const moduleLabel = moduleLabels[tip.module] || 'Algemeen'
  const moduleIcon = moduleIcons[tip.module] || '✨'
  return (
    <article
      style={{
        padding: '18px 20px',
        borderRadius: 18,
        border: `1px solid ${withOpacity(brand.colors.primary, 0.26)}`,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(227, 232, 255, 0.82) 100%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 18px 40px rgba(49, 46, 129, 0.16)',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{fontSize: '1.3rem'}}>{moduleIcon}</span>
        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <span style={{fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: brand.colors.mutedText}}>
            {moduleLabel}
          </span>
          <p style={{margin: 0, color: brand.colors.secondary, lineHeight: 1.4}}>{tip.message}</p>
        </div>
      </div>
      {tip.cta && (
        <span style={{fontSize: '0.85rem', color: brand.colors.primaryDark, fontWeight: 600}}>{tip.cta}</span>
      )}
    </article>
  )
}

function SkeletonRows() {
  const baseStyle = {
    padding: '18px 20px',
    borderRadius: 18,
    border: `1px solid ${withOpacity(brand.colors.secondary, 0.08)}`,
    background: withOpacity('#ffffff', 0.7),
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  }
  const barStyle = height => ({
    height,
    borderRadius: 8,
    background: withOpacity('#0d3b66', 0.1),
  })
  return (
    <>
      {[0, 1, 2].map(index => (
        <li key={`skeleton-${index}`} aria-hidden="true" style={baseStyle}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <span style={{width: 28, height: 28, borderRadius: '50%', background: withOpacity('#0d3b66', 0.12)}}></span>
            <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 6}}>
              <span style={barStyle(16)}></span>
              <span style={{...barStyle(12), width: '65%'}}></span>
            </div>
          </div>
          <span style={{...barStyle(10), width: '40%'}}></span>
        </li>
      ))}
    </>
  )
}
// @ts-nocheck
