import { brand } from './branding'

const HELP_CENTER_ORIGIN = 'https://help.sevensa.nl'
const STATUS_PAGE_ORIGIN = 'https://status.sevensa.nl'

export interface SupportConfig {
  readonly tenantSlug: string
  readonly helpCenterBaseUrl: string
  readonly statusPageUrl: string
}

interface BaseExperienceConfig {
  readonly hostname: string
  readonly support: SupportConfig
}

export interface MarketingExperienceConfig extends BaseExperienceConfig {
  readonly mode: 'marketing'
  readonly primaryCtaHref: string
  readonly secondaryCtaHref: string
  readonly demoPagePath: string
  readonly demoVideoUrl?: string
}

export interface TenantExperienceConfig extends BaseExperienceConfig {
  readonly mode: 'tenant'
  readonly tenantKey: string
  readonly routerBasePath: string
  readonly defaultAuthenticatedPath: string
  readonly defaultUnauthenticatedPath: string
  readonly postLoginPath: string
  readonly secretsFocusPath?: string
  readonly stagingDomainNote?: string
}

export type ExperienceConfig = MarketingExperienceConfig | TenantExperienceConfig

type ExperienceModeOverride = 'marketing' | 'tenant'

interface ResolveExperienceOptions {
  readonly search?: string
  readonly modeOverride?: ExperienceModeOverride
}

function sanitiseTenantSlug(raw: string | undefined): string {
  if (!raw) {
    return 'rentguy'
  }
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed) {
    return 'rentguy'
  }
  const slug = trimmed
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'rentguy'
}

function createSupportConfig(tenantKey?: string): SupportConfig {
  const tenantSlug = sanitiseTenantSlug(tenantKey)
  const helpCenterBaseUrl = `${HELP_CENTER_ORIGIN}/${tenantSlug}`
  const statusPageUrl = tenantSlug === 'rentguy'
    ? `${STATUS_PAGE_ORIGIN}/rentguy`
    : `${STATUS_PAGE_ORIGIN}/?tenant=${encodeURIComponent(tenantSlug)}`

  return {
    tenantSlug,
    helpCenterBaseUrl,
    statusPageUrl,
  }
}

const DEFAULT_SUPPORT = createSupportConfig('rentguy')

const DEFAULT_TENANT_CONFIG: TenantExperienceConfig = {
  mode: 'tenant',
  hostname: 'localhost',
  tenantKey: 'default',
  routerBasePath: '',
  defaultAuthenticatedPath: '/planner',
  defaultUnauthenticatedPath: '/login',
  postLoginPath: '/planner',
  support: DEFAULT_SUPPORT,
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

function readModeOverrideFromSearch(search: string | undefined): ExperienceModeOverride | undefined {
  if (!search) {
    return undefined
  }
  try {
    const params = new URLSearchParams(search)
    const mode = params.get('mode')?.trim().toLowerCase()
    if (!mode) {
      return undefined
    }
    if (mode === 'marketing') {
      return 'marketing'
    }
    if (mode === 'tenant' || mode === 'planner' || mode === 'app' || mode === 'portal') {
      return 'tenant'
    }
    return undefined
  } catch (error) {
    console.warn('Kon query-parameter "mode" niet lezen', error)
    return undefined
  }
}

function createMarketingExperience(hostname: string): MarketingExperienceConfig {
  return {
    mode: 'marketing',
    hostname,
    primaryCtaHref: '/demo',
    secondaryCtaHref: '#contact',
    demoPagePath: '/demo',
    demoVideoUrl: 'https://cdn.sevensa.ai/rentguy/demo/rentguy-teaser.mp4',
    support: DEFAULT_SUPPORT,
  }
}

export function resolveExperienceConfig(
  rawHostname?: string,
  options: ResolveExperienceOptions = {},
): ExperienceConfig {
  const hostname = normaliseHostname(rawHostname ?? (typeof window !== 'undefined' ? window.location.hostname : undefined))
  const search = options.search ?? (typeof window !== 'undefined' ? window.location.search : '')
  const queryOverride = readModeOverrideFromSearch(search)
  const forcedMode = options.modeOverride ?? queryOverride

  if (forcedMode === 'marketing') {
    return createMarketingExperience(hostname)
  }

  if (forcedMode !== 'tenant' && (hostname === 'rentguy.nl' || hostname === 'www.rentguy.nl' || hostname === 'rentguy.sevensa.nl')) {
    return createMarketingExperience(hostname)
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
      support: createSupportConfig('mr-dj'),
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
      support: createSupportConfig(subdomain),
    }
  }

  return { ...DEFAULT_TENANT_CONFIG, hostname, support: DEFAULT_SUPPORT }
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

export function resolveSupportConfig(
  rawHostname?: string,
  options: ResolveExperienceOptions = {},
): SupportConfig {
  const experience = resolveExperienceConfig(rawHostname, options)
  return experience.support
}

export function buildHelpCenterUrl(support: SupportConfig, path?: string): string {
  if (!path) {
    return support.helpCenterBaseUrl
  }
  const trimmed = `${path}`.trim().replace(/^\/+/, '')
  if (!trimmed) {
    return support.helpCenterBaseUrl
  }
  return `${support.helpCenterBaseUrl}/${trimmed}`
}
