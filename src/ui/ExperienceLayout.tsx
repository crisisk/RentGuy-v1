import type { CSSProperties, ReactNode } from 'react'
import { brand, brandFontStack, headingFontStack, withOpacity } from '@ui/branding'

export interface ExperienceLayoutProps {
  eyebrow?: string
  title: string
  description?: ReactNode
  heroBadge?: string
  heroPrologue?: ReactNode
  heroAside?: ReactNode
  heroFooter?: ReactNode
  children?: ReactNode
  layout?: 'stacked' | 'split'
  heroTone?: 'light' | 'dark'
  headerSlot?: ReactNode
}

const skipLinkStyle: CSSProperties = {
  position: 'absolute',
  top: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '10px 16px',
  borderRadius: 999,
  background: '#ffffff',
  color: brand.colors.primary,
  textDecoration: 'none',
  fontWeight: 600,
  zIndex: 100,
}

export function ExperienceLayout({
  eyebrow,
  title,
  description,
  heroBadge,
  heroPrologue,
  heroAside,
  heroFooter,
  children,
  layout = 'stacked',
  heroTone = 'light',
  headerSlot,
}: ExperienceLayoutProps) {
  const heroIsDark = heroTone === 'dark'
  const heroBackground = heroIsDark
    ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 27, 75, 0.92) 45%, rgba(17, 24, 39, 0.94) 100%)'
    : 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(227, 232, 255, 0.92) 100%)'
  const heroBorder = heroIsDark ? withOpacity('#FFFFFF', 0.22) : withOpacity(brand.colors.primary, 0.24)
  const heroTextColor = heroIsDark ? '#ffffff' : brand.colors.secondary

  const containerStyle: CSSProperties = {
    minHeight: '100vh',
    background: `radial-gradient(circle at top, ${withOpacity(brand.colors.primary, 0.08)} 0%, transparent 45%) ${brand.colors.appBackground}`,
    fontFamily: brandFontStack,
    color: brand.colors.text,
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    padding: '16px clamp(18px, 4vw, 36px)',
    color: '#ffffff',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.86) 100%)',
    borderBottom: `1px solid ${withOpacity('#FFFFFF', 0.08)}`,
    backdropFilter: 'blur(18px)',
  }

  const heroGridStyle: CSSProperties = layout === 'split' && heroAside
    ? {
        display: 'grid',
        gap: 32,
        gridTemplateColumns: 'minmax(0, 1.1fr) minmax(clamp(260px, 30vw, 420px), 1fr)',
        alignItems: 'start',
      }
    : {
        display: 'grid',
        gap: 24,
      }

  const heroAsideStyle: CSSProperties = {
    background: heroIsDark ? withOpacity('#000000', 0.35) : '#ffffff',
    borderRadius: 24,
    padding: heroIsDark ? 'clamp(24px, 3vw, 32px)' : 'clamp(20px, 3vw, 28px)',
    boxShadow: heroIsDark ? '0 28px 56px rgba(15, 23, 42, 0.55)' : brand.colors.shadow,
    border: heroIsDark ? `1px solid ${withOpacity('#FFFFFF', 0.18)}` : `1px solid ${withOpacity(brand.colors.primary, 0.16)}`,
    color: heroIsDark ? '#ffffff' : brand.colors.secondary,
    display: 'grid',
    gap: 20,
    width: '100%',
    maxWidth: 'min(100%, 420px)',
  }

  return (
    <div style={containerStyle}>
      <a href="#experience-main" style={skipLinkStyle}>
        Ga naar hoofdinhoud
      </a>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: withOpacity('#FFFFFF', 0.12),
              color: '#ffffff',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontSize: '0.72rem',
            }}
          >
            {brand.shortName} · {brand.tenant.name}
          </div>
          <span style={{ fontSize: '0.85rem', color: withOpacity('#FFFFFF', 0.75) }}>{brand.partnerTagline}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{headerSlot}</div>
      </header>
      <main
        id="experience-main"
        style={{
          padding: 'clamp(24px, 4vw, 64px) clamp(16px, 5vw, 64px)',
        }}
      >
        <div style={{ maxWidth: 'min(1200px, 100%)', margin: '0 auto', display: 'grid', gap: 28 }}>
          <section
            style={{
              background: heroBackground,
              borderRadius: 32,
              padding: 'clamp(32px, 4vw, 44px)',
              boxShadow: heroIsDark ? '0 36px 72px rgba(15, 23, 42, 0.6)' : brand.colors.shadow,
              border: `1px solid ${heroBorder}`,
              color: heroTextColor,
            }}
          >
            <div style={heroGridStyle}>
              <div style={{ display: 'grid', gap: 16 }}>
                {eyebrow && (
                  <span
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.22em',
                      fontSize: '0.75rem',
                      color: heroIsDark ? withOpacity('#FFFFFF', 0.75) : withOpacity(brand.colors.secondary, 0.7),
                      fontWeight: 600,
                    }}
                  >
                    {eyebrow}
                  </span>
                )}
                <div style={{ display: 'grid', gap: 12 }}>
                  {heroBadge && (
                    <span
                      style={{
                        alignSelf: 'flex-start',
                        padding: '6px 14px',
                        borderRadius: 999,
                        background: heroIsDark ? withOpacity('#FFFFFF', 0.18) : withOpacity(brand.colors.primary, 0.14),
                        color: heroIsDark ? '#ffffff' : brand.colors.primary,
                        fontSize: '0.8rem',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      {heroBadge}
                    </span>
                  )}
                  <h1
                    style={{
                      margin: 0,
                      fontFamily: headingFontStack,
                      fontSize: '2.6rem',
                      lineHeight: 1.1,
                      color: heroTextColor,
                    }}
                  >
                    {title}
                  </h1>
                  {description && (
                    <div
                      style={{
                        margin: 0,
                        color: heroIsDark ? withOpacity('#FFFFFF', 0.84) : withOpacity(brand.colors.secondary, 0.86),
                        fontSize: '1.05rem',
                        display: 'grid',
                        gap: 12,
                        maxWidth: layout === 'split' && heroAside ? 560 : 680,
                      }}
                    >
                      {description}
                    </div>
                  )}
                </div>
                {heroPrologue && <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>{heroPrologue}</div>}
              </div>
              {heroAside && <aside style={heroAsideStyle}>{heroAside}</aside>}
            </div>
            {heroFooter && (
              <div style={{ marginTop: 32, display: 'grid', gap: 20 }}>{heroFooter}</div>
            )}
          </section>

          {children && (
            <div style={{ display: 'grid', gap: 28 }}>{children}</div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ExperienceLayout
