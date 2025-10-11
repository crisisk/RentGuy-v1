import React, { useEffect, useId, useRef } from 'react'
import { STATUS, useOnboardingProgress } from './useOnboardingProgress.js'
import { brand, brandFontStack, withOpacity } from './theme.js'

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: withOpacity('#0D3B66', 0.72),
    color: brand.colors.text,
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '48px 16px',
    fontFamily: brandFontStack,
    overflowY: 'auto',
  },
  panel: {
    maxWidth: 860,
    width: '100%',
    background: '#ffffff',
    borderRadius: 28,
    padding: '36px 44px',
    boxShadow: brand.colors.shadow,
    border: `1px solid ${withOpacity(brand.colors.primary, 0.2)}`,
    display: 'grid',
    gap: 24,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  closeButton: {
    border: `1px solid ${withOpacity(brand.colors.primary, 0.35)}`,
    background: withOpacity(brand.colors.surfaceMuted, 0.8),
    color: brand.colors.secondary,
    padding: '8px 16px',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 600,
  },
  progressTrack: {
    background: withOpacity(brand.colors.surfaceMuted, 0.9),
    borderRadius: 999,
    overflow: 'hidden',
    height: 12,
  },
  progressBar: {
    minHeight: 12,
    background: brand.colors.gradient,
    transition: 'width 180ms ease-out',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'grid',
    gap: 12,
  },
  listItemBase: {
    borderRadius: 18,
    padding: '18px 20px',
    border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
    display: 'grid',
    gap: 12,
    alignItems: 'flex-start',
    background: withOpacity('#ffffff', 0.95),
  },
  alert: {
    background: withOpacity(brand.colors.danger, 0.12),
    border: `1px solid ${withOpacity(brand.colors.danger, 0.28)}`,
    color: '#B71C1C',
    padding: '16px 18px',
    borderRadius: 18,
    display: 'grid',
    gap: 12,
  },
  alertButton: {
    border: 'none',
    background: brand.colors.danger,
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 999,
    fontWeight: 600,
    cursor: 'pointer',
    justifySelf: 'flex-start',
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionPrimary: {
    border: 'none',
    background: brand.colors.gradient,
    color: '#fff',
    padding: '12px 18px',
    borderRadius: 999,
    fontWeight: 600,
    cursor: 'pointer',
  },
  actionSecondary: {
    border: 'none',
    background: withOpacity(brand.colors.primary, 0.12),
    color: brand.colors.primaryDark,
    padding: '12px 18px',
    borderRadius: 999,
    fontWeight: 600,
    cursor: 'pointer',
  },
}

const StepItem = ({ step, isDone, isMarking, onMark }) => (
  <li
    style={{
      ...styles.listItemBase,
      background: isDone ? withOpacity(brand.colors.success, 0.12) : styles.listItemBase.background,
      border: isDone
        ? `1px solid ${withOpacity(brand.colors.success, 0.35)}`
        : styles.listItemBase.border,
    }}
  >
    <div style={{ display: 'grid', gap: 6 }}>
      <b style={{ fontSize: '1.05rem', color: brand.colors.secondary }}>{step.title}</b>
      <div style={{ color: brand.colors.mutedText }}>{step.description}</div>
    </div>
    {isDone ? (
      <span aria-label="Stap afgerond" style={{ color: brand.colors.success, fontWeight: 600 }}>
        ✅ Gereed
      </span>
    ) : (
      <button
        type="button"
        onClick={() => onMark(step)}
        disabled={isMarking}
        style={{
          border: 'none',
          background: brand.colors.gradient,
          color: '#fff',
          padding: '10px 16px',
          borderRadius: 999,
          fontWeight: 600,
          cursor: isMarking ? 'wait' : 'pointer',
          opacity: isMarking ? 0.75 : 1,
        }}
      >
        {isMarking ? 'Bijwerken…' : 'Markeer gereed'}
      </button>
    )}
  </li>
)

export default function OnboardingOverlay({ email, onClose = () => {}, onSnooze, onFinish }) {
  const { steps, done, status, errorMessage, marking, progress, mark, retry } = useOnboardingProgress(email)
  const closeButtonRef = useRef(null)
  const headingId = useId()
  const descriptionId = useId()

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSnooze = () => {
    if (typeof onSnooze === 'function') {
      onSnooze()
    } else {
      onClose()
    }
  }

  const handleFinish = () => {
    if (typeof onFinish === 'function') {
      onFinish()
    } else {
      onClose()
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={headingId} aria-describedby={descriptionId} style={styles.overlay}>
      <div style={styles.panel}>
        <header style={styles.header}>
          <div style={{ display: 'grid', gap: 6 }}>
            <h2 id={headingId} style={{ margin: 0, color: brand.colors.secondary }}>
              Welkom bij {brand.shortName}
            </h2>
            <p id={descriptionId} style={{ margin: 0, color: brand.colors.mutedText }}>
              Doorloop de belangrijkste activatiestappen zodat ieder teamlid direct waarde ziet.
            </p>
          </div>
          <button type="button" onClick={onClose} ref={closeButtonRef} style={styles.closeButton}>
            Sluiten
          </button>
        </header>

        <section style={{ display: 'grid', gap: 12 }}>
          <div style={styles.progressTrack}>
            <div
              role="progressbar"
              aria-label="Onboarding voortgang"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{ ...styles.progressBar, width: `${progress}%` }}
            />
          </div>
          <p aria-live="polite" style={{ margin: 0, color: brand.colors.secondary }}>
            Voortgang: {progress}% ({done.size}/{steps.length || 0} stappen)
          </p>
          {status === STATUS.LOADING && (
            <p style={{ margin: 0, color: brand.colors.mutedText }}>Onboarding wordt geladen…</p>
          )}
          {status === STATUS.ERROR && (
            <div role="alert" style={styles.alert}>
              <p style={{ margin: 0 }}>{errorMessage || 'De onboarding kon niet geladen worden.'}</p>
              <button type="button" onClick={retry} style={styles.alertButton}>
                Probeer opnieuw
              </button>
            </div>
          )}
          {status === STATUS.EMPTY && (
            <p style={{ margin: 0, color: brand.colors.mutedText }}>
              Er zijn nog geen onboarding-stappen beschikbaar voor dit account.
            </p>
          )}
          {errorMessage && status === STATUS.READY && (
            <p role="status" style={{ margin: 0, color: brand.colors.warning }}>
              {errorMessage}
            </p>
          )}
        </section>

        <ol aria-busy={status === STATUS.LOADING} style={styles.list}>
          {steps.map(step => (
            <StepItem
              key={step.code}
              step={step}
              isDone={done.has(step.code)}
              isMarking={Boolean(marking[step.code])}
              onMark={mark}
            />
          ))}
        </ol>

        <footer style={styles.footer}>
          <div style={{ color: brand.colors.mutedText }}>
            Klaar met de checklist? Markeer als voltooid zodat we je dashboard schoon houden.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleSnooze} style={styles.actionSecondary}>
              Later herinneren
            </button>
            <button type="button" onClick={handleFinish} style={styles.actionPrimary}>
              Onboarding afgerond
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
