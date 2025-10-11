export const sevensaBrand = {
  name: 'Sevensa',
  url: 'https://sevensa.ai',
  tagline: 'Enterprise AI copilots voor operations.',
}

export const misterDjBrand = {
  name: 'Mister DJ',
  url: 'https://www.mr-dj.nl',
  tagline: '100% Dansgarantie',
  colors: {
    primary: '#6C2BD9',
    primaryDark: '#4C1D95',
    secondary: '#1F1A4A',
    accent: '#F5B400',
    gradient: 'linear-gradient(135deg, #1F1A4A 0%, #6C2BD9 42%, #FF6EC7 100%)',
  },
}

export const rentGuyBrand = {
  name: 'Sevensa RentGuy Enterprise',
  shortName: 'Sevensa × Mister DJ',
  tagline: `${misterDjBrand.tagline} · Powered by Sevensa`,
  url: 'https://sevensa.ai/rentguy',
}

export const brand = {
  ...rentGuyBrand,
  provider: sevensaBrand,
  tenant: misterDjBrand,
  partnerTagline: `${misterDjBrand.tagline} · Powered by Sevensa`,
  colors: {
    primary: misterDjBrand.colors.primary,
    primaryDark: misterDjBrand.colors.primaryDark,
    secondary: '#0B1026',
    accent: misterDjBrand.colors.accent,
    surface: '#F4F6FF',
    surfaceMuted: '#E3E7FF',
    surfaceInverse: '#111827',
    text: '#0F172A',
    mutedText: '#475569',
    gradient: misterDjBrand.colors.gradient,
    gradientSoft:
      'linear-gradient(155deg, rgba(108, 43, 217, 0.18) 0%, rgba(255, 110, 199, 0.18) 48%, rgba(37, 99, 235, 0.18) 100%)',
    appBackground:
      'radial-gradient(circle at 10% 12%, rgba(245, 180, 0, 0.18) 0%, rgba(15, 23, 42, 0) 46%), radial-gradient(circle at 88% 16%, rgba(255, 110, 199, 0.16) 0%, rgba(15, 23, 42, 0) 52%), linear-gradient(135deg, #0F172A 0%, #1F1A4A 58%, #312E81 100%)',
    outline: 'rgba(108, 43, 217, 0.28)',
    shadow: '0 32px 72px rgba(15, 23, 42, 0.28)',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#2563EB',
    overlay: 'rgba(15, 23, 42, 0.72)',
    softHighlight: 'rgba(255, 110, 199, 0.2)',
  },
}

export const brandFontStack = `'Poppins', 'Montserrat', 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
export const headingFontStack = `'Montserrat', 'Poppins', 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

export function withOpacity(hex, alpha = 1) {
  if (!hex || hex[0] !== '#' || (hex.length !== 4 && hex.length !== 7)) {
    return hex
  }
  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex
  const value = parseInt(normalized.slice(1), 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function applyBrandSurface() {
  if (typeof document === 'undefined') return () => {}

  const previous = {
    background: document.body.style.background,
    color: document.body.style.color,
    fontFamily: document.body.style.fontFamily,
  }

  document.body.style.background = brand.colors.appBackground
  document.body.style.color = brand.colors.text
  document.body.style.fontFamily = brandFontStack

  return () => {
    document.body.style.background = previous.background
    document.body.style.color = previous.color
    document.body.style.fontFamily = previous.fontFamily
  }
}
