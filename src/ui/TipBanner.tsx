import { useEffect, useState } from 'react'
import { getTips, type OnboardingTip } from '@application/onboarding/api'
import { brand, brandFontStack, headingFontStack, withOpacity } from '@ui/branding'

export interface TipBannerProps {
  module?: string
}

export function TipBanner({ module }: TipBannerProps) {
  const [tip, setTip] = useState<OnboardingTip | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const tips = await getTips(module)
        const [firstTip] = tips
        if (!cancelled && firstTip) {
          setTip(firstTip)
        }
      } catch (error) {
        console.warn('Kon onboarding tip niet laden', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [module])

  if (!tip) {
    return null
  }

  return (
    <div
      style={{
        padding: '18px 22px',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(107, 70, 193, 0.16) 100%)',
        border: `1px solid ${withOpacity(brand.colors.primary, 0.32)}`,
        borderRadius: 20,
        margin: '12px 0',
        fontFamily: brandFontStack,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        boxShadow: '0 16px 34px rgba(49, 46, 129, 0.14)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minWidth: 140,
        }}
      >
        <span
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            fontSize: '0.7rem',
            color: brand.colors.secondary,
          }}
        >
          {brand.tenant.name}
        </span>
        <strong style={{ fontFamily: headingFontStack, color: brand.colors.secondary }}>
          UAT tip
        </strong>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        <span style={{ color: brand.colors.secondary, fontSize: '0.95rem' }}>{tip.message}</span>
        {tip.cta && (
          <button
            type="button"
            style={{
              marginTop: 2,
              alignSelf: 'flex-start',
              padding: '6px 14px',
              borderRadius: 999,
              border: 'none',
              backgroundImage: brand.colors.gradient,
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 12px 22px rgba(79, 70, 229, 0.25)',
            }}
          >
            {tip.cta}
          </button>
        )}
        <span style={{ color: brand.colors.mutedText, fontSize: '0.8rem' }}>{brand.partnerTagline}</span>
      </div>
    </div>
  )
}

export default TipBanner
