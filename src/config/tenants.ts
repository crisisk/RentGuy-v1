/**
 * Tenant Configuration System
 *
 * Provides custom content, branding, and configuration for each tenant.
 * Tenants are identified by their domain and can have custom colors,
 * logos, and content strings.
 */

/**
 * Configuration interface for a single tenant
 */
export interface TenantConfig {
  /** Unique identifier for the tenant */
  id: string
  /** Display name for the tenant */
  name: string
  /** Primary domain for this tenant */
  domain: string
  /** Primary brand color (hex format) */
  primaryColor: string
  /** Optional logo URL */
  logoUrl?: string
  /** Custom content key-value pairs for tenant-specific text */
  customContent: Record<string, string>
}

/**
 * Tenant configurations
 */
const tenants: TenantConfig[] = [
  {
    id: 'mrdj',
    name: 'Mister DJ',
    domain: 'mr-dj.rentguy.nl',
    primaryColor: '#FF6B35',
    customContent: {
      heroTitle: 'Dansgarantie Crew Planner',
      heroSubtitle: 'Beheer jouw DJ\'s en evenementen met ease',
      loginWelcome: 'Welkom bij de Dansgarantie Planner',
      demoAccount1: 'dansgarantie1@mr-dj.nl',
      demoAccount2: 'dansgarantie2@mr-dj.nl',
    },
  },
  {
    id: 'sevensa',
    name: 'Sevensa',
    domain: 'sevensa.rentguy.nl',
    primaryColor: '#2563EB',
    customContent: {
      heroTitle: 'Sevensa Operations Dashboard',
      heroSubtitle: 'Professioneel project- en teammanagement',
      loginWelcome: 'Welkom bij Sevensa RentGuy',
      demoAccount1: 'info@sevensa.nl',
      demoAccount2: 'admin@sevensa.nl',
    },
  },
]

/**
 * Default tenant configuration (fallback)
 */
const defaultTenant: TenantConfig = {
  id: 'default',
  name: 'RentGuy',
  domain: 'rentguy.nl',
  primaryColor: '#3B82F6',
  customContent: {
    heroTitle: 'RentGuy Platform',
    heroSubtitle: 'Manage your operations efficiently',
    loginWelcome: 'Welcome to RentGuy',
    demoAccount1: 'demo@rentguy.nl',
    demoAccount2: 'admin@rentguy.nl',
  },
}

/**
 * Get tenant configuration by domain
 *
 * @param domain - The domain to search for
 * @returns The matching tenant configuration or null if not found
 */
export function getTenantByDomain(domain: string): TenantConfig | null {
  const tenant = tenants.find((t) => t.domain === domain)
  return tenant || null
}

/**
 * Get the current tenant based on the browser's hostname
 *
 * @returns The current tenant configuration (falls back to default if not found)
 */
export function getCurrentTenant(): TenantConfig {
  // In browser environment
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname
    const tenant = getTenantByDomain(hostname)

    if (tenant) {
      return tenant
    }
  }

  // Fallback to default tenant
  return defaultTenant
}

/**
 * Get all available tenants
 *
 * @returns Array of all tenant configurations
 */
export function getAllTenants(): TenantConfig[] {
  return [...tenants]
}

/**
 * Get custom content value for the current tenant
 *
 * @param key - The content key to retrieve
 * @param fallback - Optional fallback value if key is not found
 * @returns The custom content value or fallback
 */
export function getCustomContent(key: string, fallback?: string): string {
  const tenant = getCurrentTenant()
  return tenant.customContent[key] || fallback || ''
}
