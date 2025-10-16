import { brand } from './branding'

export interface MarketingExperienceConfig {
  readonly mode: 'marketing'
  readonly hostname: string
  readonly primaryCtaHref: string
  readonly secondaryCtaHref: string
  readonly demoVideoUrl?: string
}

export interface TenantExperienceConfig {
  readonly mode: 'tenant'
  readonly hostname: string
  readonly tenantKey: string
  readonly routerBasePath: string
  readonly defaultAuthenticatedPath: string
  readonly defaultUnauthenticatedPath: string
  readonly postLoginPath: string
  readonly secretsFocusPath?: string
  readonly stagingDomainNote?: string
}

export type ExperienceConfig = MarketingExperienceConfig | TenantExperienceConfig

const DEFAULT_TENANT_CONFIG: TenantExperienceConfig = {
  mode: 'tenant',
  hostname: 'localhost',
  tenantKey: 'default',
  routerBasePath: '',
  defaultAuthenticatedPath: '/planner',
  defaultUnauthenticatedPath: '/login',
  postLoginPath: '/planner',
}

function normaliseHostname(rawHostname?: string): string {
  if (!rawHostname || typeof rawHostname !== 'string') {
    return DEFAULT_TENANT_CONFIG.hostname
  }

  const hostname = rawHostname.trim().toLowerCase()
  if (!hostname) {
    return DEFAULT_TENANT_CONFIG.hostname
  }

  return hostname
}

export function resolveExperienceConfig(rawHostname?: string): ExperienceConfig {
  const hostname = normaliseHostname(rawHostname ?? (typeof window !== 'undefined' ? window.location.hostname : undefined))

  if (hostname === 'rentguy.nl' || hostname === 'www.rentguy.nl') {
    return {
      mode: 'marketing',
      hostname,
      primaryCtaHref: 'https://mr-dj.rentguy.nl/login',
      secondaryCtaHref: '#contact',
      demoVideoUrl: 'https://cdn.sevensa.ai/rentguy/demo/rentguy-teaser.mp4',
    }
  }

  if (hostname === 'mr-dj.rentguy.nl') {
    return {
      mode: 'tenant',
      hostname,
      tenantKey: 'mr-dj',
      routerBasePath: '',
      defaultAuthenticatedPath: '/dashboard',
      defaultUnauthenticatedPath: '/login',
      postLoginPath: '/dashboard',
      secretsFocusPath: '/dashboard',
      stagingDomainNote: 'Houd er rekening mee dat www.mr-dj.nl momenteel verwijst naar staging.sevensa.nl; update DNS na validatie.',
    }
  }

  if (hostname.endsWith('.rentguy.nl')) {
    const subdomain = hostname.replace('.rentguy.nl', '')
    return {
      ...DEFAULT_TENANT_CONFIG,
      hostname,
      tenantKey: subdomain,
      routerBasePath: '',
      postLoginPath: '/planner',
      defaultAuthenticatedPath: '/planner',
    }
  }

  return { ...DEFAULT_TENANT_CONFIG, hostname }
}

export function describeTenantDisplayName(config: TenantExperienceConfig): string {
  if (config.tenantKey === 'mr-dj') {
    return `${brand.tenant.name} Control Center`
  }

  const capitalised = config.tenantKey
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  return capitalised ? `${capitalised} Control Center` : `${brand.shortName} Control Center`
}
