export const brand = {
  name: 'MR-DJ Enterprise Suite',
  shortName: 'MR•DJ',
  url: 'https://mr-dj.nl',
  tagline: 'Backstage control voor premium eventprofessionals.',
  colors: {
    primary: '#ff2d92',
    primaryDark: '#b31163',
    secondary: '#1a0938',
    accent: '#33f0ff',
    surface: '#f7f5ff',
    text: '#1f1d2b',
    mutedText: '#5a5472',
    gradient: 'linear-gradient(135deg, #ff2d92 0%, #5f2eea 48%, #33f0ff 100%)',
  },
}

export const brandFontStack = `'Poppins', 'Montserrat', 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

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
