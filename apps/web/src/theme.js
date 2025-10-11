export const brand = {
  name: 'Mister DJ - Sevensa Intelligence Platform',
  shortName: 'Mr. DJ',
  url: 'https://sevensa.ai',
  tagline: 'AI-powered solutions for enterprises.',
  colors: {
    primary: '#00A896',
    primaryDark: '#04706C',
    secondary: '#1F2A32',
    accent: '#4FD1C5',
    surface: '#F5FAF9',
    surfaceMuted: '#E0F2EF',
    text: '#1F2A32',
    mutedText: '#4A5A65',
    gradient: 'linear-gradient(135deg, #0BC5EA 0%, #00A896 45%, #0D3B66 100%)',
    outline: 'rgba(4, 112, 108, 0.18)',
    shadow: '0 28px 60px rgba(13, 59, 102, 0.12)',
    success: '#1ABC9C',
    danger: '#F44336',
    warning: '#F59E0B',
    info: '#0D3B66',
  },
}

export const brandFontStack = `'Montserrat', 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

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
