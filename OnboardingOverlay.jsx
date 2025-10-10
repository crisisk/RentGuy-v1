import React, { useEffect, useMemo, useState } from 'react'
import { getSteps, getProgress, completeStep, getTips } from './onbApi.js'
import onboardingTips from './onboarding_tips.json'
import { brand, brandFontStack, withOpacity } from './branding.js'

const fallbackSteps = [
  {
    code: 'welcome',
    title: 'Welkom bij MR-DJ Enterprise',
    description: 'Doorloop de checklist om de planner, crew en warehouse modules te activeren.',
  },
  {
    code: 'project',
    title: 'Maak je eerste MR-DJ show',
    description: 'Plan een evenement in de planner en voeg klant- en podiumdetails toe.',
  },
  {
    code: 'crew',
    title: 'Nodig crewleden uit',
    description: 'Stuur een uitnodiging naar technici en DJ’s met de MR-DJ briefing template.',
  },
  {
    code: 'booking',
    title: 'Plan je eerste crewbooking',
    description: 'Koppel een team aan het project en verstuur automatisch de draaiboeken.',
  },
  {
    code: 'scan',
    title: 'Scan je gear met de PWA',
    description: 'Gebruik de mobiele scanner om decks, speakers en lichten uit te geven.',
  },
  {
    code: 'transport',
    title: 'Optimaliseer transport en logistiek',
    description: 'Genereer een MR-DJ routebrief en coördineer het warehouse-team.',
  },
  {
    code: 'invoice',
    title: 'Activeer facturatie',
    description: 'Genereer een factuur met het MR-DJ factuursjabloon en verstuur naar de klant.',
  },
  {
    code: 'templates',
    title: 'Personaliseer templates',
    description: 'Pas crewbriefings, transportdocumenten en offertes aan in jullie MR-DJ branding.',
  },
]

const fallbackTips = onboardingTips.map((tip, index) => ({
  ...tip,
  id: tip.id ?? `fallback-${index}`,
}))

const stepMeta = {
  welcome: { module: 'projects', icon: '🚀' },
  project: { module: 'projects', icon: '🎛️' },
  crew: { module: 'crew', icon: '🎤' },
  booking: { module: 'crew', icon: '📅' },
  scan: { module: 'warehouse', icon: '📲' },
  transport: { module: 'transport', icon: '🚚' },
  invoice: { module: 'billing', icon: '💸' },
  templates: { module: 'templates', icon: '🧾' },
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

export default function OnboardingOverlay({ email, onClose }) {
  const [steps, setSteps] = useState(() => normalizeSteps(fallbackSteps))
  const [done, setDone] = useState(new Set())
  const [tips, setTips] = useState(() => normalizeTips(fallbackTips))
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [busyStep, setBusyStep] = useState('')

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setErrorMessage('')
    ;(async () => {
      try {
        const [stepsResult, progressResult, tipsResult] = await Promise.allSettled([
          getSteps(),
          getProgress(email),
          getTips(),
        ])

        if (ignore) return

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
            'We tonen de MR-DJ standaard onboarding omdat live data tijdelijk niet beschikbaar is.'
          )
        }
      } catch (error) {
        console.error('Kon onboardinggegevens niet laden', error)
        if (!ignore) {
          setSteps(normalizeSteps(fallbackSteps))
          setTips(normalizeTips(fallbackTips))
          setDone(new Set())
          setErrorMessage(
            'We tonen de MR-DJ standaard onboarding omdat live data tijdelijk niet beschikbaar is.'
          )
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    })()

    return () => {
      ignore = true
    }
  }, [email])

  const progress = useMemo(() => {
    return steps.length ? Math.round((done.size / steps.length) * 100) : 0
  }, [done, steps])

  const allComplete = steps.length > 0 && done.size === steps.length

  async function mark(step) {
    if (busyStep) return
    setBusyStep(step.code)
    setErrorMessage('')
    try {
      await completeStep(email, step.code)
      const progressData = await getProgress(email)
      setDone(new Set(progressData.filter(item => item.status === 'complete').map(item => item.step_code)))
    } catch (error) {
      console.error('Stap kon niet worden bijgewerkt', error)
      setErrorMessage('Kon de stap niet bijwerken. Probeer het opnieuw of contacteer MR-DJ support.')
    } finally {
      setBusyStep('')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: withOpacity('#05020f', 0.72),
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
          background: '#fff',
          borderRadius: 28,
          padding: '36px 40px',
          boxShadow: '0 30px 80px rgba(9, 4, 24, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        <header
          style={{
            background: brand.colors.gradient,
            borderRadius: 24,
            padding: '28px 32px',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: withOpacity('#ffffff', 0.14),
              border: 'none',
              borderRadius: 999,
              color: '#fff',
              padding: '8px 16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Later doorgaan
          </button>
          <span style={{textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.8rem'}}>MR-DJ Launchpad</span>
          <h2 style={{margin: 0, fontSize: '2.1rem'}}>Onboarding cockpit</h2>
          <p style={{margin: 0, maxWidth: 520, lineHeight: 1.5}}>
            {allComplete
              ? 'Fantastisch! Alle modules zijn geactiveerd. Gebruik de tips hieronder om je workflow te verfijnen.'
              : 'Volg de stappen om alle MR-DJ modules te activeren. We tonen contextuele tips per module zodat jouw team direct aan de slag kan.'}
          </p>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem'}}>
              <span>{progress}% voltooid</span>
              {loading && <span style={{fontSize: '0.85rem'}}>Data laden…</span>}
            </div>
            <div style={{height: 14, background: withOpacity('#ffffff', 0.2), borderRadius: 999}}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: withOpacity('#ffffff', 0.9),
                  transition: 'width 0.3s ease',
                }}
              ></div>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div
            style={{
              background: withOpacity(brand.colors.accent, 0.12),
              border: `1px solid ${withOpacity(brand.colors.accent, 0.35)}`,
              borderRadius: 18,
              padding: '16px 20px',
              color: brand.colors.secondary,
              fontSize: '0.95rem',
            }}
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
          <section style={{display: 'flex', flexDirection: 'column', gap: 16}}>
            <h3 style={{margin: 0, fontSize: '1.2rem', color: brand.colors.secondary}}>Checklist</h3>
            <ol style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14}}>
              {steps.map(step => {
                const meta = stepMeta[step.code] || {}
                const completed = done.has(step.code)
                return (
                  <StepCard
                    key={step.code}
                    step={step}
                    meta={meta}
                    completed={completed}
                    onMark={() => mark(step)}
                    busy={busyStep === step.code}
                  />
                )
              })}
            </ol>
          </section>
          <aside style={{display: 'flex', flexDirection: 'column', gap: 16}}>
            <h3 style={{margin: 0, fontSize: '1.2rem', color: brand.colors.secondary}}>MR-DJ tips</h3>
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

function StepCard({ step, meta, completed, onMark, busy }) {
  return (
    <li
      style={{
        padding: '18px 20px',
        borderRadius: 18,
        border: `1px solid ${withOpacity(brand.colors.mutedText, 0.18)}`,
        background: completed ? withOpacity(brand.colors.accent, 0.16) : withOpacity('#f7f5ff', 0.8),
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
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
          </div>
          <span style={{fontSize: '0.95rem', color: brand.colors.mutedText}}>{step.description}</span>
        </div>
      </div>
      <div style={{display: 'flex', justifyContent: 'flex-end'}}>
        {completed ? (
          <span style={{display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0f5132', fontWeight: 600}}>
            ✅ Gereed
          </span>
        ) : (
          <button
            onClick={onMark}
            disabled={busy}
            style={{
              border: 'none',
              padding: '8px 18px',
              borderRadius: 999,
              background: brand.colors.primary,
              color: '#fff',
              fontWeight: 600,
              cursor: busy ? 'wait' : 'pointer',
              boxShadow: busy ? 'none' : '0 12px 24px rgba(255, 45, 146, 0.3)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Bezig…' : 'Markeer gereed'}
          </button>
        )}
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
        border: `1px solid ${withOpacity(brand.colors.mutedText, 0.16)}`,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 14px 28px rgba(24, 16, 48, 0.12)',
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
