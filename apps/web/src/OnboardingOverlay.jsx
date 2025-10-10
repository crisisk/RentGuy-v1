import React, { useEffect, useId, useRef } from 'react'
import { STATUS, useOnboardingProgress } from './useOnboardingProgress.js'

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', color: '#111', zIndex: 9999 },
  panel: { maxWidth: 720, margin: '60px auto', background: '#fff', borderRadius: 12, padding: 24, fontFamily: 'system-ui', boxShadow: '0 20px 40px rgba(15,23,42,0.18)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  closeButton: { border: '1px solid #cbd5f5', background: '#f8fafc', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' },
  bodyText: { marginTop: 12 },
  progressTrack: { margin: '16px 0 8px', background: '#e2e8f0', borderRadius: 8, overflow: 'hidden' },
  progressBar: { minHeight: 12, background: '#4ade80', transition: 'width 160ms ease-out' },
  progressLabel: { marginTop: 0 },
  statusCopy: { color: '#334155', marginBottom: 16 },
  alert: { background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 16 },
  alertButton: { border: 'none', background: '#b91c1c', color: '#fff', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' },
  empty: { color: '#334155', marginBottom: 16 },
  list: { listStyle: 'decimal inside', padding: 0, margin: 0 },
  listItemBase: { margin: '8px 0', padding: 12, border: '1px solid #e2e8f0', borderRadius: 10, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' },
  listTitle: { display: 'block', marginBottom: 4 },
  listDesc: { color: '#475569' },
  doneTag: { color: '#16a34a', fontWeight: 600 },
  actionButton: { border: 'none', background: '#2563eb', color: '#fff', padding: '6px 14px', borderRadius: 8 },
}

const StepItem = ({ step, isDone, isMarking, onMark }) => (
  <li style={{ ...styles.listItemBase, background: isDone ? '#f0fdf4' : '#fff' }}>
    <div style={{ flex: '1 1 240px' }}>
      <b style={styles.listTitle}>{step.title}</b>
      <div style={styles.listDesc}>{step.description}</div>
    </div>
    {isDone ? (
      <span aria-label="Stap afgerond" style={styles.doneTag}>
        ✅ Gereed
      </span>
    ) : (
      <button
        type="button"
        onClick={() => onMark(step)}
        disabled={isMarking}
        style={{ ...styles.actionButton, cursor: isMarking ? 'wait' : 'pointer', opacity: isMarking ? 0.7 : 1 }}
      >
        {isMarking ? 'Bijwerken…' : 'Markeer gereed'}
      </button>
    )}
  </li>
)

export default function OnboardingOverlay({ email, onClose = () => {} }) {
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

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={headingId} aria-describedby={descriptionId} style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h2 id={headingId} style={{ margin: 0 }}>
            Welkom bij Rentguy ✨
          </h2>
          <button type="button" onClick={onClose} ref={closeButtonRef} style={styles.closeButton}>
            Sluiten
          </button>
        </div>
        <p id={descriptionId} style={styles.bodyText}>
          Loop de stappen door voor een vliegende start. Markeer als voltooid zodra je klaar bent.
        </p>
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
        <p aria-live="polite" style={styles.progressLabel}>
          Voortgang: {progress}% ({done.size}/{steps.length || 0} stappen)
        </p>
        {status === STATUS.LOADING && <p style={styles.statusCopy}>Onboarding wordt geladen…</p>}
        {status === STATUS.ERROR && (
          <div role="alert" style={styles.alert}>
            <p style={{ margin: '0 0 8px' }}>{errorMessage || 'De onboarding kon niet geladen worden.'}</p>
            <button type="button" onClick={retry} style={styles.alertButton}>
              Probeer opnieuw
            </button>
          </div>
        )}
        {status === STATUS.EMPTY && <p style={styles.empty}>Er zijn nog geen onboarding-stappen beschikbaar voor dit account.</p>}
        {errorMessage && status === STATUS.READY && (
          <p role="status" style={styles.statusCopy}>
            {errorMessage}
          </p>
        )}
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
      </div>
    </div>
  )
}
