import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { brand, brandFontStack, headingFontStack, withOpacity } from '@ui/branding'

type FlowStatus = 'success' | 'warning' | 'danger' | 'info'

type FlowActionVariant = 'primary' | 'secondary'

interface FlowAction {
  label: string
  onClick: () => void
  variant?: FlowActionVariant
}

export interface FlowItem {
  id: string
  title: string
  description: string
  icon?: ReactNode
  status: FlowStatus
  metricLabel: string
  metricValue: string
  helperText?: string
  primaryAction: FlowAction
  secondaryAction?: FlowAction
}

export interface FlowGuidancePanelProps {
  title: string
  description?: string
  eyebrow?: string
  flows: FlowItem[]
}

const statusPalette: Record<FlowStatus, { background: string; border: string; accent: string }> = {
  success: {
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(255,255,255,0.95) 100%)',
    border: withOpacity(brand.colors.success, 0.35),
    accent: brand.colors.success,
  },
  warning: {
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(255,255,255,0.94) 100%)',
    border: withOpacity(brand.colors.warning, 0.45),
    accent: brand.colors.warning,
  },
  danger: {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.24) 0%, rgba(255,255,255,0.94) 100%)',
    border: withOpacity(brand.colors.danger, 0.45),
    accent: brand.colors.danger,
  },
  info: {
    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.18) 0%, rgba(227, 232, 255, 0.94) 100%)',
    border: withOpacity(brand.colors.primary, 0.38),
    accent: brand.colors.primary,
  },
}

function resolveActionStyles(variant: FlowActionVariant = 'primary', tone: FlowStatus): CSSProperties {
  if (variant === 'secondary') {
    return {
      padding: '8px 16px',
      borderRadius: 999,
      border: `1px solid ${withOpacity(statusPalette[tone].accent, 0.5)}`,
      background: 'transparent',
      color: statusPalette[tone].accent,
      fontWeight: 600,
      cursor: 'pointer',
    }
  }

  return {
    padding: '10px 18px',
    borderRadius: 999,
    border: 'none',
    background: statusPalette[tone].accent,
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 16px 36px rgba(15, 23, 42, 0.16)',
  }
}

export function FlowGuidancePanel({ title, description, eyebrow, flows }: FlowGuidancePanelProps) {
  if (!flows.length) {
    return null
  }

  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      style={{
        display: 'grid',
        gap: 24,
        padding: '28px 32px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(227, 232, 255, 0.86) 100%)',
        borderRadius: 28,
        border: `1px solid ${withOpacity(brand.colors.primary, 0.22)}`,
        boxShadow: brand.colors.shadow,
        fontFamily: brandFontStack,
      }}
    >
      <div style={{ display: 'grid', gap: 10 }}>
        {eyebrow && (
          <span
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              fontSize: '0.75rem',
              color: withOpacity(brand.colors.secondary, 0.7),
            }}
          >
            {eyebrow}
          </span>
        )}
        <h3
          id={titleId}
          style={{
            margin: 0,
            fontFamily: headingFontStack,
            color: brand.colors.secondary,
            fontSize: '1.6rem',
          }}
        >
          {title}
        </h3>
        {description && (
          <p style={{ margin: 0, color: brand.colors.mutedText, maxWidth: 720 }}>{description}</p>
        )}
      </div>
      <div
        style={{
          display: 'grid',
          gap: 18,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        {flows.map(flow => {
          const palette = statusPalette[flow.status]
          return (
            <article
              key={flow.id}
              style={{
                display: 'grid',
                gap: 14,
                padding: '20px 22px',
                borderRadius: 22,
                background: palette.background,
                border: `1px solid ${palette.border}`,
                color: brand.colors.secondary,
                minHeight: 220,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: palette.accent }}>
                    {flow.metricLabel}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {flow.icon && <span style={{ fontSize: '1.5rem' }}>{flow.icon}</span>}
                    <strong style={{ fontFamily: headingFontStack, fontSize: '1.15rem' }}>{flow.title}</strong>
                  </div>
                </div>
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: withOpacity(palette.accent, 0.12),
                    color: palette.accent,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  {flow.metricValue}
                </span>
              </div>
              <p style={{ margin: 0, color: withOpacity(brand.colors.secondary, 0.84), fontSize: '0.95rem' }}>{flow.description}</p>
              {flow.helperText && (
                <span style={{ color: brand.colors.mutedText, fontSize: '0.8rem' }}>{flow.helperText}</span>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button
                  type="button"
                  onClick={flow.primaryAction.onClick}
                  style={resolveActionStyles(flow.primaryAction.variant, flow.status)}
                >
                  {flow.primaryAction.label}
                </button>
                {flow.secondaryAction && (
                  <button
                    type="button"
                    onClick={flow.secondaryAction.onClick}
                    style={resolveActionStyles(flow.secondaryAction.variant, flow.status)}
                  >
                    {flow.secondaryAction.label}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default FlowGuidancePanel
