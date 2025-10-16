import type { CSSProperties, ReactNode } from 'react'
import { brand, brandFontStack, headingFontStack, withOpacity } from '@ui/branding'

export type FlowJourneyStatus = 'complete' | 'current' | 'upcoming' | 'blocked'

export interface FlowJourneyStep {
  id: string
  title: string
  description: string
  status: FlowJourneyStatus
  href?: string
  onNavigate?: () => void
  badge?: string
  meta?: ReactNode
}

export interface FlowJourneyMapProps {
  title?: string
  subtitle?: string
  steps: FlowJourneyStep[]
  layout?: 'horizontal' | 'vertical'
}

const statusTokens: Record<FlowJourneyStatus, { accent: string; background: string; ring: string }> = {
  complete: {
    accent: brand.colors.success,
    background: withOpacity(brand.colors.success, 0.12),
    ring: withOpacity(brand.colors.success, 0.4),
  },
  current: {
    accent: brand.colors.primary,
    background: withOpacity(brand.colors.primary, 0.14),
    ring: withOpacity(brand.colors.primary, 0.45),
  },
  upcoming: {
    accent: brand.colors.mutedText,
    background: withOpacity(brand.colors.secondary, 0.08),
    ring: withOpacity(brand.colors.secondary, 0.16),
  },
  blocked: {
    accent: brand.colors.danger,
    background: withOpacity(brand.colors.danger, 0.14),
    ring: withOpacity(brand.colors.danger, 0.45),
  },
}

const actionStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '8px 14px',
  borderRadius: 999,
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer',
}

export default function FlowJourneyMap({
  title = 'Gebruikersreis',
  subtitle,
  steps,
  layout = 'horizontal',
}: FlowJourneyMapProps) {
  if (!steps.length) {
    return null
  }

  const listStyle: CSSProperties = {
    display: 'grid',
    gap: 16,
    gridTemplateColumns:
      layout === 'horizontal'
        ? `repeat(auto-fit, minmax(${Math.max(Math.floor(720 / steps.length), 180)}px, 1fr))`
        : 'minmax(0, 1fr)',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  }

  return (
    <nav
      aria-label={title}
      style={{
        display: 'grid',
        gap: 16,
        fontFamily: brandFontStack,
      }}
    >
      <div style={{ display: 'grid', gap: 4 }}>
        <span
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: withOpacity(brand.colors.secondary, 0.65),
            fontWeight: 600,
          }}
        >
          {title}
        </span>
        {subtitle && <span style={{ color: brand.colors.mutedText, fontSize: '0.9rem' }}>{subtitle}</span>}
      </div>
      <ol style={listStyle}>
        {steps.map((step, index) => {
          const palette = statusTokens[step.status]
          const indicatorContent = step.status === 'complete' ? '✓' : index + 1
          const isInteractive = Boolean(step.href || step.onNavigate)

          const indicatorStyle: CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: palette.background,
            border: `2px solid ${palette.ring}`,
            color: palette.accent,
            fontWeight: 700,
            fontSize: '0.95rem',
          }

          const cardStyle: CSSProperties = {
            display: 'grid',
            gap: 10,
            padding: '18px 20px',
            borderRadius: 20,
            background: withOpacity('#FFFFFF', 0.82),
            border: `1px solid ${withOpacity(palette.accent, 0.18)}`,
            boxShadow: '0 18px 36px rgba(15, 23, 42, 0.14)',
            color: brand.colors.secondary,
            minHeight: 140,
          }

          return (
            <li key={step.id} style={cardStyle} aria-current={step.status === 'current' ? 'step' : undefined}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span aria-hidden style={indicatorStyle}>
                  {indicatorContent}
                </span>
                <div style={{ display: 'grid', gap: 4 }}>
                  {step.badge && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: palette.accent,
                        fontWeight: 600,
                      }}
                    >
                      {step.badge}
                    </span>
                  )}
                  <strong style={{ fontFamily: headingFontStack, fontSize: '1.05rem', lineHeight: 1.2 }}>{step.title}</strong>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: withOpacity(brand.colors.secondary, 0.85) }}>{step.description}</p>
              {step.meta && <div style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>{step.meta}</div>}
              {isInteractive && (
                step.href ? (
                  <a
                    href={step.href}
                    style={{
                      ...actionStyle,
                      background: palette.background,
                      color: palette.accent,
                      border: `1px solid ${palette.accent}`,
                    }}
                  >
                    Bekijk flow
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={step.onNavigate}
                    style={{
                      ...actionStyle,
                      background: palette.accent,
                      color: '#ffffff',
                      border: `1px solid ${palette.accent}`,
                    }}
                  >
                    Bekijk flow
                  </button>
                )
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
