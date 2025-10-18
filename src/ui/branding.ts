export type HexColor = `#${string}`

export interface BrandIdentity {
  name: string
  url: string
  tagline: string
  helpUrl?: string
  statusUrl?: string
}

export interface BrandPalette {
  primary: HexColor
  secondary: HexColor
  accent: HexColor
  gradient: string
}

export interface BrandTheme extends BrandIdentity {
  shortName: string
  productName: string
  provider: BrandIdentity
  tenant: BrandIdentity & { colors: BrandPalette }
  partnerTagline: string
  colors: {
    primary: HexColor
    primaryDark: HexColor
    secondary: HexColor
    accent: HexColor
    surface: HexColor
    surfaceMuted: HexColor
    text: HexColor
    mutedText: HexColor
    gradient: string
    appBackground: string
    outline: string
    shadow: string
    success: HexColor
    danger: HexColor
    warning: HexColor
    overlay: string
    softHighlight: string
  }
}

export const sevensaBrand: BrandIdentity = {
  name: 'Sevensa',
  url: 'https://sevensa.ai',
  tagline: 'AI-powered solutions for businesses.',
}

export const mrDjBrand: BrandIdentity & { colors: BrandPalette } = {
  name: 'Mister DJ',
  url: 'https://www.mr-dj.nl',
  tagline: '100% Dansgarantie',
  colors: {
    primary: '#6B46C1',
    secondary: '#1E1B4B',
    accent: '#F5B400',
    gradient: 'linear-gradient(135deg, #1E1B4B 0%, #6B46C1 45%, #2563EB 100%)',
  },
}

export const rentGuyBrand: BrandIdentity & { shortName: string; productName: string } = {
  name: 'Sevensa RentGuy Enterprise',
  shortName: 'RentGuy',
  productName: 'RentGuy',
  tagline: 'Enterprise equipment rental co-piloted by Sevensa.',
  url: 'https://sevensa.ai/rentguy',
}

export const brand: BrandTheme = {
  ...rentGuyBrand,
  provider: sevensaBrand,
  tenant: mrDjBrand,
  partnerTagline: `${mrDjBrand.tagline} · Powered by Sevensa`,
  colors: {
    primary: mrDjBrand.colors.primary,
    primaryDark: '#4C1D95',
    secondary: '#0B1026',
    accent: mrDjBrand.colors.accent,
    surface: '#F5F7FF',
    surfaceMuted: '#E3E8FF',
    text: '#0F172A',
    mutedText: '#3B4C7A',
    gradient: mrDjBrand.colors.gradient,
    appBackground:
      'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.18) 0%, rgba(15, 23, 42, 0.06) 45%), linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #312E81 100%)',
    outline: 'rgba(79, 70, 229, 0.25)',
    shadow: '0 32px 72px rgba(15, 23, 42, 0.32)',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    overlay: 'rgba(15, 23, 42, 0.65)',
    softHighlight: 'rgba(245, 180, 0, 0.12)',
  },
}

export const brandFontStack = `'Poppins', 'Montserrat', 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

export const headingFontStack = `'Montserrat', 'Poppins', 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

export function withOpacity(hex: string, alpha = 1) {
  if (!hex || hex[0] !== '#' || (hex.length !== 4 && hex.length !== 7)) {
    return hex
  }
  const normalized = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex
  const value = Number.parseInt(normalized.slice(1), 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
