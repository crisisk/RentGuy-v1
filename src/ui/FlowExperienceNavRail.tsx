import type { CSSProperties, ReactNode } from 'react'
import { brand, brandFontStack, headingFontStack, withOpacity } from '@ui/branding'

export type FlowNavigationStatus = 'complete' | 'current' | 'upcoming' | 'blocked'

export interface FlowExperienceNavRailItem {
  id: string
  label: string
  description: string
  status: FlowNavigationStatus
  href?: string
  onClick?: () => void
  icon?: ReactNode
  badge?: string
  meta?: ReactNode
}

export interface FlowExperienceNavRailProps {
  title?: string
  caption?: string
  items: FlowExperienceNavRailItem[]
  footer?: ReactNode
}

const statusPalette: Record<FlowNavigationStatus, { background: string; border: string; accent: string; text: string }> = {
  complete: {
    background: withOpacity(brand.colors.success, 0.16),
    border: withOpacity(brand.colors.success, 0.32),
    accent: brand.colors.success,
    text: brand.colors.secondary,
  },
  current: {
    background: withOpacity(brand.colors.primary, 0.18),
    border: withOpacity(brand.colors.primary, 0.42),
    accent: brand.colors.primary,
    text: '#0f172a',
  },
  upcoming: {
    background: withOpacity(brand.colors.secondary, 0.08),
    border: withOpacity(brand.colors.secondary, 0.16),
    accent: brand.colors.secondary,
    text: brand.colors.secondary,
  },
  blocked: {
    background: withOpacity(brand.colors.danger, 0.16),
    border: withOpacity(brand.colors.danger, 0.35),
    accent: brand.colors.danger,
    text: brand.colors.secondary,
  },
}

const statusLabel: Record<FlowNavigationStatus, string> = {
  complete: 'Afgerond',
  current: 'Actief',
  upcoming: 'Volgende',
  blocked: 'Geblokkeerd',
}

export default function FlowExperienceNavRail({ title, caption, items, footer }: FlowExperienceNavRailProps) {
  if (!items.length) {
    return null
  }

  return (
    <nav
      aria-label={title ?? 'Gebruikersflows'}
      style={{
        display: 'grid',
        gap: 20,
        padding: '20px 22px',
        borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(226, 232, 255, 0.88) 100%)',
        border: `1px solid ${withOpacity(brand.colors.primary, 0.18)}`,
        boxShadow: brand.colors.shadow,
        fontFamily: brandFontStack,
        minHeight: '100%',
      }}
    >
      <div style={{ display: 'grid', gap: 10 }}>
        {title && (
          <h3
            style={{
              margin: 0,
              fontFamily: headingFontStack,
              fontSize: '1.25rem',
              color: brand.colors.secondary,
            }}
          >
            {title}
          </h3>
        )}
        {caption && <p style={{ margin: 0, color: brand.colors.mutedText, fontSize: '0.9rem' }}>{caption}</p>}
      </div>

      <ul
        style={{
          display: 'grid',
          gap: 12,
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {items.map(item => {
          const palette = statusPalette[item.status]
          const cardStyle: CSSProperties = {
            display: 'grid',
            gap: 10,
            padding: '16px 18px',
            borderRadius: 18,
            background: palette.background,
            border: `1px solid ${palette.border}`,
            color: palette.text,
            textDecoration: 'none',
            boxShadow: '0 18px 36px rgba(15, 23, 42, 0.12)',
          }
          const content = (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.icon && <span aria-hidden style={{ fontSize: '1.4rem' }}>{item.icon}</span>}
                    <div style={{ display: 'grid', gap: 4 }}>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: withOpacity(palette.accent, 0.85),
                            fontWeight: 600,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      <strong style={{ fontFamily: headingFontStack, fontSize: '1rem', color: palette.text }}>{item.label}</strong>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: withOpacity(palette.text, 0.85) }}>{item.description}</p>
                  {item.meta && <div style={{ fontSize: '0.82rem', color: withOpacity(palette.text, 0.75) }}>{item.meta}</div>}
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: withOpacity(palette.accent, 0.12),
                    color: palette.accent,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {statusLabel[item.status]}
                </span>
              </div>
            </div>
          )

          if (item.href) {
            return (
              <li key={item.id}>
                <a
                  href={item.href}
                  onClick={item.onClick}
                  style={cardStyle}
                  aria-current={item.status === 'current' ? 'page' : undefined}
                >
                  {content}
                </a>
              </li>
            )
          }

          const interactiveProps = item.onClick
            ? {
                role: 'button' as const,
                onClick: item.onClick,
                tabIndex: 0,
              }
            : {}

          return (
            <li key={item.id}>
              <div
                style={{ ...cardStyle, cursor: item.onClick ? 'pointer' : 'default' }}
                aria-current={item.status === 'current' ? 'step' : undefined}
                {...interactiveProps}
              >
                {content}
              </div>
            </li>
          )
        })}
      </ul>

      {footer && <div style={{ fontSize: '0.85rem', color: brand.colors.mutedText }}>{footer}</div>}
    </nav>
  )
}
