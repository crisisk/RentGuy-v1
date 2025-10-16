import type { CSSProperties, ReactNode } from 'react'
import { brand, headingFontStack, withOpacity } from '@ui/branding'

export interface FlowExplainerAction {
  label: string
  href?: string
  onClick?: () => void
}

export interface FlowExplainerItem {
  id: string
  title: string
  description: ReactNode
  icon?: ReactNode
  badge?: string
  meta?: ReactNode
  action?: FlowExplainerAction
}

export interface FlowExplainerListProps {
  items: FlowExplainerItem[]
  tone?: 'light' | 'dark'
  minWidth?: number
}

const defaultCardStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: '18px 20px',
  borderRadius: 20,
}

export function FlowExplainerList({ items, tone = 'light', minWidth = 220 }: FlowExplainerListProps) {
  if (!items.length) {
    return null
  }

  const background = tone === 'dark' ? withOpacity('#000000', 0.24) : withOpacity(brand.colors.secondary, 0.06)
  const border = tone === 'dark' ? withOpacity('#FFFFFF', 0.18) : withOpacity(brand.colors.primary, 0.14)
  const textColor = tone === 'dark' ? '#ffffff' : brand.colors.secondary
  const metaColor = tone === 'dark' ? withOpacity('#FFFFFF', 0.72) : brand.colors.mutedText

  return (
    <div
      role="list"
      style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
      }}
    >
      {items.map(item => {
        const style: CSSProperties = {
          ...defaultCardStyle,
          background,
          border: `1px solid ${border}`,
          color: textColor,
          boxShadow: tone === 'dark' ? '0 18px 40px rgba(15, 23, 42, 0.45)' : '0 16px 32px rgba(15, 23, 42, 0.12)',
        }

        const actionStyle: CSSProperties = {
          justifySelf: 'flex-start',
          padding: '8px 14px',
          borderRadius: 999,
          border: tone === 'dark' ? `1px solid ${withOpacity('#FFFFFF', 0.4)}` : `1px solid ${withOpacity(brand.colors.primary, 0.4)}`,
          background: 'transparent',
          color: textColor,
          fontWeight: 600,
          cursor: 'pointer',
          textDecoration: 'none',
        }

        return (
          <article key={item.id} role="listitem" style={style}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {item.icon && <span aria-hidden style={{ fontSize: '1.5rem' }}>{item.icon}</span>}
              <div style={{ display: 'grid', gap: 6 }}>
                {item.badge && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: tone === 'dark' ? withOpacity('#FFFFFF', 0.7) : withOpacity(brand.colors.secondary, 0.7),
                    }}
                  >
                    {item.badge}
                  </span>
                )}
                <strong style={{ fontFamily: headingFontStack, fontSize: '1.05rem' }}>{item.title}</strong>
              </div>
            </div>
            <div style={{ fontSize: '0.92rem', color: tone === 'dark' ? withOpacity('#FFFFFF', 0.82) : withOpacity(brand.colors.secondary, 0.82) }}>{item.description}</div>
            {item.meta && <div style={{ fontSize: '0.82rem', color: metaColor }}>{item.meta}</div>}
            {item.action && (
              item.action.href ? (
                <a href={item.action.href} style={actionStyle}>
                  {item.action.label}
                </a>
              ) : (
                <button type="button" onClick={item.action.onClick} style={actionStyle}>
                  {item.action.label}
                </button>
              )
            )}
          </article>
        )
      })}
    </div>
  )
}

export default FlowExplainerList
