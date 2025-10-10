import React, { useEffect, useState } from 'react'
import { getTips } from './onbApi.js'
import { brand, brandFontStack, withOpacity } from './branding.js'

export default function TipBanner({ module }){
  const [tip, setTip] = useState(null)
  useEffect(()=>{
    (async()=>{
      const tips = await getTips(module)
      if (tips.length) setTip(tips[0])
    })()
  }, [module])
  if (!tip) return null
  return (
    <div
      style={{
        padding: '14px 18px',
        background: withOpacity(brand.colors.surfaceMuted, 0.8),
        border: `1px solid ${brand.colors.outline}`,
        borderRadius: 16,
        margin: '12px 0',
        fontFamily: brandFontStack,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: '12px',
          background: brand.colors.primary,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 700,
        }}
        aria-hidden
      >
        ℹ️
      </span>
      <div style={{ display: 'grid', gap: 4 }}>
        <strong style={{ color: brand.colors.secondary, fontSize: '0.9rem', letterSpacing: '0.04em' }}>Tip</strong>
        <span style={{ color: brand.colors.mutedText }}>{tip.message}</span>
        {tip.cta && (
          <button
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
