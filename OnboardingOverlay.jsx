import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { completeStep, getProgress, getSteps, getTips } from './onbApi.js'
import defaults from './mr_dj_onboarding.json'
import { brand, brandFontStack, withOpacity } from './branding.js'

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

const defaultSteps = normalizeSteps(defaults.steps)
const defaultTips = normalizeTips(defaults.tips)

const overlayBackdrop = withOpacity('#05020f', 0.72)
const accentSurface = withOpacity(brand.colors.accent, 0.12)
const accentBorder = `1px solid ${withOpacity(brand.colors.accent, 0.35)}`
const progressTrack = withOpacity('#ffffff', 0.2)
const progressFill = withOpacity('#ffffff', 0.9)
const stepBorder = `1px solid ${withOpacity(brand.colors.mutedText, 0.18)}`
const tipBorder = `1px solid ${withOpacity(brand.colors.mutedText, 0.16)}`
const stepSurface = withOpacity('#f7f5ff', 0.8)
const successColor = '#0f5132'

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: overlayBackdrop,
    color: brand.colors.text,
    zIndex: 9999,
    fontFamily: brandFontStack,
    overflowY: 'auto',
    padding: '48px 16px',
  },
  panel: {
    maxWidth: 960,
    margin: '0 auto',
    background: '#fff',
    borderRadius: 28,
    padding: '36px 40px',
    boxShadow: '0 30px 80px rgba(9, 4, 24, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  header: {
    background: brand.colors.gradient,
    borderRadius: 24,
    padding: '28px 32px',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    position: 'relative',
  },
  closeButton: {
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
  },
  checklistGrid: {
    display: 'grid',
    gap: 24,
    gridTemplateColumns: 'minmax(0, 1.65fr) minmax(0, 1fr)',
  },
  callout: {
    background: accentSurface,
    border: accentBorder,
    borderRadius: 18,
    padding: '16px 20px',
    color: brand.colors.secondary,
    fontSize: '0.95rem',
  },
}

export default function OnboardingOverlay({ email, onClose }) {
  const [steps, setSteps] = useState(defaultSteps)
  const [tips, setTips] = useState(defaultTips)
  const [done, setDone] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [busyStep, setBusyStep] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage('')

      try {
        const [stepsResult, progressResult, tipsResult] = await Promise.allSettled([
          getSteps(),
          getProgress(email),
          getTips(),
        ])

        if (cancelled) {
          return
        }

        const resolvedSteps =
          stepsResult.status === 'fulfilled' && stepsResult.value.length
            ? normalizeSteps(stepsResult.value)
            : defaultSteps

        const resolvedTips =
          tipsResult.status === 'fulfilled' && tipsResult.value.length
            ? normalizeTips(tipsResult.value)
            : defaultTips

        const resolvedProgress =
          progressResult.status === 'fulfilled' && Array.isArray(progressResult.value)
            ? progressResult.value
            : []

        setSteps(resolvedSteps)
        setTips(resolvedTips)
        setDone(extractCompleted(resolvedProgress))

        const usedFallback =
          stepsResult.status !== 'fulfilled' || !stepsResult.value.length ||
          tipsResult.status !== 'fulfilled' || !tipsResult.value.length ||
          progressResult.status !== 'fulfilled'

        if (usedFallback) {
          setErrorMessage('We tonen de MR-DJ standaard onboarding omdat live data tijdelijk niet beschikbaar is.')
        }
      } catch (error) {
        console.error('Kon onboardinggegevens niet laden', error)
        if (!cancelled) {
          setSteps(defaultSteps)
          setTips(defaultTips)
          setDone(new Set())
          setErrorMessage('We tonen de MR-DJ standaard onboarding omdat live data tijdelijk niet beschikbaar is.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (email) {
      load()
    }

    return () => {
      cancelled = true
    }
  }, [email])

  const progress = useMemo(() => {
    return steps.length ? Math.round((done.size / steps.length) * 100) : 0
  }, [done, steps])

  const allComplete = steps.length > 0 && done.size === steps.length

  const handleMarkStep = useCallback(
    async stepCode => {
      if (!stepCode || busyStep) {
        return
      }
      setBusyStep(stepCode)
      setErrorMessage('')
      try {
        await completeStep(email, stepCode)
        const progressData = await getProgress(email)
        setDone(extractCompleted(progressData))
      } catch (error) {
        console.error('Stap kon niet worden bijgewerkt', error)
        setErrorMessage('Kon de stap niet bijwerken. Probeer het opnieuw of contacteer MR-DJ support.')
      } finally {
        setBusyStep('')
      }
    },
    [busyStep, email]
  )

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <header style={styles.header}>
          <button onClick={onClose} style={styles.closeButton}>
            Later doorgaan
          </button>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.8rem' }}>
            MR-DJ Launchpad
          </span>
          <h2 style={{ margin: 0, fontSize: '2.1rem' }}>Onboarding cockpit</h2>
          <p style={{ margin: 0, maxWidth: 520, lineHeight: 1.5 }}>
            {allComplete
              ? 'Fantastisch! Alle modules zijn geactiveerd. Gebruik de tips hieronder om je workflow te verfijnen.'
              : 'Volg de stappen om alle MR-DJ modules te activeren. We tonen contextuele tips per module zodat jouw team direct aan de slag kan.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
              <span>{progress}% voltooid</span>
              {loading && <span style={{ fontSize: '0.85rem' }}>Data laden…</span>}
            </div>
            <div style={{ height: 14, background: progressTrack, borderRadius: 999 }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: progressFill,
                  transition: 'width 0.3s ease',
                }}
              ></div>
            </div>
          </div>
        </header>

        {errorMessage && <div style={styles.callout}>{errorMessage}</div>}

        <div style={styles.checklistGrid}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: brand.colors.secondary }}>Checklist</h3>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {steps.map(step => (
                <StepCard
                  key={step.code}
                  step={step}
                  completed={done.has(step.code)}
                  onMark={() => handleMarkStep(step.code)}
                  busy={busyStep === step.code}
                />
              ))}
            </ol>
          </section>
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: brand.colors.secondary }}>MR-DJ tips</h3>
            <div style={{ display: 'grid', gap: 14 }}>
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

function StepCard({ step, completed, onMark, busy }) {
  const badgeLabel = moduleLabels[step.module] || step.module || 'Module'
  const badgeIcon = step.icon || moduleIcons[step.module] || '✨'
  const background = completed ? withOpacity(brand.colors.accent, 0.16) : stepSurface

  return (
    <li
      style={{
        padding: '18px 20px',
        borderRadius: 18,
        border: stepBorder,
        background,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '1.4rem' }}>{badgeIcon}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{ fontSize: '1.05rem', color: brand.colors.secondary }}>{step.title}</strong>
            {step.module && (
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
                {badgeLabel}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.95rem', color: brand.colors.mutedText }}>{step.description}</span>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {completed ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: successColor, fontWeight: 600 }}>
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
  const moduleIcon = tip.icon || moduleIcons[tip.module] || '✨'

  return (
    <article
      style={{
        padding: '18px 20px',
        borderRadius: 18,
        border: tipBorder,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 14px 28px rgba(24, 16, 48, 0.12)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '1.3rem' }}>{moduleIcon}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: brand.colors.mutedText }}>
            {moduleLabel}
          </span>
          <p style={{ margin: 0, color: brand.colors.secondary, lineHeight: 1.4 }}>{tip.message}</p>
        </div>
      </div>
      {tip.cta && <span style={{ fontSize: '0.85rem', color: brand.colors.primaryDark, fontWeight: 600 }}>{tip.cta}</span>}
    </article>
  )
}

function normalizeSteps(list = []) {
  return list
    .filter(Boolean)
    .map(step => ({
      ...step,
      code:
        step.code ||
        (step.title ? step.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') : 'step'),
    }))
}

function normalizeTips(list = []) {
  return list
    .filter(Boolean)
    .map((tip, index) => ({
      ...tip,
      id: tip.id || `${tip.module || 'tip'}-${index}`,
    }))
}

function extractCompleted(progress = []) {
  return new Set(
    progress
      .filter(item => item && item.status === 'complete' && item.step_code)
      .map(item => item.step_code)
  )
}
