import React, { useEffect, useState } from 'react'
import { getTips } from './onbApi.js'
import { brand, brandFontStack, withOpacity } from './theme.js'

const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
}

export default function TipBanner({ module }) {
  const [tip, setTip] = useState(null)
  const [status, setStatus] = useState(STATUS.IDLE)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setStatus(STATUS.LOADING)
    setErrorMessage('')

    ;(async () => {
      try {
        const tips = await getTips(module, { signal: controller.signal })
        if (!active) return
        if (Array.isArray(tips) && tips.length > 0) {
          setTip(tips[0])
          setStatus(STATUS.READY)
        } else {
          setTip(null)
          setStatus(STATUS.IDLE)
        }
      } catch (error) {
        if (!active) return
        setStatus(STATUS.ERROR)
        setErrorMessage('Contextuele tip tijdelijk niet beschikbaar.')
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [module])

  if (status === STATUS.IDLE && !tip) {
    return null
  }

  if (status === STATUS.ERROR) {
    return (
      <div
        role="status"
        style={{
          padding: '14px 18px',
          background: withOpacity(brand.colors.danger, 0.16),
          border: `1px solid ${withOpacity(brand.colors.danger, 0.32)}`,
          borderRadius: 16,
          margin: '12px 0',
          fontFamily: brandFontStack,
          color: '#B71C1C',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span aria-hidden style={iconStyle}>
          ⚠️
        </span>
        <span>{errorMessage}</span>
      </div>
    )
  }

  if (status === STATUS.LOADING && !tip) {
    return (
      <div
        aria-live="polite"
        style={{
          padding: '14px 18px',
          background: withOpacity(brand.colors.surfaceMuted, 0.75),
          border: `1px solid ${withOpacity(brand.colors.primary, 0.28)}`,
          borderRadius: 16,
          margin: '12px 0',
          fontFamily: brandFontStack,
        }}
      >
        <div style={{ width: '40%', height: 12, background: withOpacity('#ffffff', 0.6), borderRadius: 999 }} />
      </div>
    )
  }

  if (!tip) {
    return null
  }

  return (
    <div
      style={{
        padding: '14px 18px',
        background: withOpacity('#ffffff', 0.94),
        border: `1px solid ${brand.colors.outline}`,
        borderRadius: 18,
        margin: '12px 0',
        fontFamily: brandFontStack,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 18px 42px rgba(15, 23, 42, 0.12)',
      }}
    >
      <span aria-hidden style={iconStyle}>
        🎧
      </span>
      <div style={{ display: 'grid', gap: 4 }}>
        <strong style={{ color: brand.colors.secondary, fontSize: '0.9rem', letterSpacing: '0.04em' }}>
          Backstage tip voor {module || 'jou'}
        </strong>
        <span style={{ color: brand.colors.mutedText }}>{tip.message}</span>
        {tip.cta && (
          <button
            type="button"
            style={{
              marginTop: 4,
              alignSelf: 'flex-start',
              padding: '6px 12px',
              borderRadius: 999,
              border: 'none',
              backgroundImage: brand.colors.gradient,
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tip.cta}
          </button>
        )}
      </div>
    </div>
  )
}

const iconStyle = {
  width: 34,
  height: 34,
  borderRadius: '12px',
  background: brand.colors.gradient,
  color: '#fff',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 700,
}
