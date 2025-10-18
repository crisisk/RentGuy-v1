/**
 * Content Loader Service
 *
 * Loads tenant content from Decap CMS YAML files
 */

import yaml from 'js-yaml'

export interface TenantContent {
  tenantId: string
  name: string
  domain: string
  primaryColor: string
  hero: {
    title: string
    subtitle: string
    loginWelcome: string
  }
  demoAccounts: {
    account1: string
    account2: string
    password: string
  }
  branding?: {
    logoUrl?: string
    faviconUrl?: string
    backgroundColor?: string
    textColor?: string
  }
  seo?: {
    title?: string
    description?: string
    keywords?: string
  }
  contact?: {
    email?: string
    phone?: string
    address?: string
  }
  customContent?: {
    extra1?: string
    extra2?: string
    extraText?: string
  }
}

// Cache for loaded content
const contentCache = new Map<string, TenantContent>()

/**
 * Load tenant content from YAML file
 */
export async function loadTenantContent(tenantId: string): Promise<TenantContent | null> {
  // Check cache first
  if (contentCache.has(tenantId)) {
    return contentCache.get(tenantId)!
  }

  try {
    const response = await fetch(`/content/tenants/${tenantId}.yml`)

    if (!response.ok) {
      console.warn(`Failed to load content for tenant ${tenantId}: ${response.status}`)
      return null
    }

    const yamlText = await response.text()
    const content = yaml.load(yamlText) as TenantContent

    // Validate content structure
    if (!content.tenantId || !content.hero) {
      console.error(`Invalid content structure for tenant ${tenantId}`)
      return null
    }

    // Cache the content
    contentCache.set(tenantId, content)

    return content
  } catch (error) {
    console.error(`Error loading content for tenant ${tenantId}:`, error)
    return null
  }
}

/**
 * Get all available tenant IDs
 */
export function getAvailableTenants(): string[] {
  return ['sevensa', 'mrdj']
}

/**
 * Preload content for all tenants
 */
export async function preloadAllContent(): Promise<void> {
  const tenants = getAvailableTenants()
  await Promise.all(tenants.map(loadTenantContent))
}

/**
 * Clear content cache
 */
export function clearContentCache(): void {
  contentCache.clear()
}

/**
 * Get content from cache (synchronous)
 */
export function getCachedContent(tenantId: string): TenantContent | null {
  return contentCache.get(tenantId) || null
}
