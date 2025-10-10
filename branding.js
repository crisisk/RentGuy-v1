export const brand = {
  name: 'Sevensa Intelligence Platform',
  shortName: 'Sevensa',
  url: 'https://sevensa.ai',
  tagline: 'AI-powered solutions for businesses.',
  colors: {
    primary: '#00A896',
    primaryDark: '#04706C',
    secondary: '#2D3A45',
    accent: '#4FD1C5',
    surface: '#F5FAF9',
    surfaceMuted: '#E0F2EF',
    text: '#1F2A32',
    mutedText: '#4A5A65',
    gradient: 'linear-gradient(135deg, #0BC5EA 0%, #00A896 45%, #0D3B66 100%)',
    outline: 'rgba(4, 112, 108, 0.18)',
    shadow: '0 28px 60px rgba(13, 59, 102, 0.22)',
    success: '#4CAF50',
    danger: '#F44336',
    warning: '#F59E0B',
  },
}

export const brandFontStack = `'Montserrat', 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

export function withOpacity(hex, alpha = 1) {
  if (!hex || hex[0] !== '#' || (hex.length !== 4 && hex.length !== 7)) {
    return hex
  }
  const normalized = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex
  const value = parseInt(normalized.slice(1), 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
