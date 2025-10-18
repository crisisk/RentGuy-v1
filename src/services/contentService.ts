/**
 * Content Template Service for RentGuy
 *
 * Provides tenant-agnostic content templating with:
 * - Variable substitution (e.g., {tenantName}, {platformName})
 * - Multi-language support (nl, en)
 * - Content caching for performance
 * - AI-optimized templates
 *
 * Based on OpenRouter AI analysis recommendations
 * Source: /reports/CONTENT_IMPROVEMENT_RECOMMENDATIONS.md
 */

import type { Language, TemplateId } from '../content/templates'
import { getTemplateById, contentTemplates } from '../content/templates'

/**
 * Variables that can be used in templates
 */
export interface TemplateVariables {
  readonly tenantName?: string
  readonly platformName?: string
  readonly userName?: string
  readonly userEmail?: string
  readonly userRole?: string
  readonly platformFeature?: string
  readonly [key: string]: string | undefined
}

/**
 * Content render options
 */
export interface RenderOptions {
  readonly language?: Language
  readonly variables?: TemplateVariables
  readonly useCache?: boolean
}

/**
 * Cached content entry
 */
interface CacheEntry {
  readonly content: string
  readonly timestamp: number
}

/**
 * Content Service Configuration
 */
export interface ContentServiceConfig {
  readonly defaultLanguage?: Language
  readonly cacheEnabled?: boolean
  readonly cacheTTL?: number // milliseconds
}

/**
 * Content Template Service
 *
 * Manages content templates with variable substitution and caching
 */
export class ContentService {
  private readonly defaultLanguage: Language
  private readonly cacheEnabled: boolean
  private readonly cacheTTL: number
  private readonly cache: Map<string, CacheEntry>

  constructor(config: ContentServiceConfig = {}) {
    this.defaultLanguage = config.defaultLanguage ?? 'nl'
    this.cacheEnabled = config.cacheEnabled ?? true
    this.cacheTTL = config.cacheTTL ?? 5 * 60 * 1000 // 5 minutes default
    this.cache = new Map()
  }

  /**
   * Render a template with variables
   *
   * @param templateId - ID of the template to render
   * @param options - Render options (language, variables, caching)
   * @returns Rendered content string
   *
   * @example
   * ```typescript
   * const content = contentService.render('hero.cobranding', {
   *   language: 'nl',
   *   variables: { platformName: 'RentGuy' }
   * })
   * ```
   */
  public render(templateId: TemplateId, options: RenderOptions = {}): string {
    const language = options.language ?? this.defaultLanguage
    const variables = options.variables ?? {}
    const useCache = options.useCache ?? this.cacheEnabled

    // Check cache first
    if (useCache) {
      const cacheKey = this.getCacheKey(templateId, language, variables)
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }
    }

    // Get template
    const template = getTemplateById(templateId)
    if (!template) {
      console.warn(`Template not found: ${templateId}`)
      return ''
    }

    // Get content in requested language
    const content = template[language]

    // Replace variables
    const rendered = this.replaceVariables(content, variables)

    // Cache result
    if (useCache) {
      const cacheKey = this.getCacheKey(templateId, language, variables)
      this.setCache(cacheKey, rendered)
    }

    return rendered
  }

  /**
   * Render multiple templates at once
   *
   * @param templateIds - Array of template IDs to render
   * @param options - Render options
   * @returns Map of template ID to rendered content
   *
   * @example
   * ```typescript
   * const contents = contentService.renderBatch(
   *   ['hero.cobranding', 'hero.audit'],
   *   { language: 'en' }
   * )
   * ```
   */
  public renderBatch(
    templateIds: readonly TemplateId[],
    options: RenderOptions = {}
  ): Map<TemplateId, string> {
    const results = new Map<TemplateId, string>()

    for (const templateId of templateIds) {
      results.set(templateId, this.render(templateId, options))
    }

    return results
  }

  /**
   * Get all available template IDs
   */
  public getAvailableTemplates(): readonly TemplateId[] {
    return contentTemplates.map((template) => template.id)
  }

  /**
   * Get template metadata
   */
  public getTemplateMetadata(templateId: TemplateId) {
    const template = getTemplateById(templateId)
    return template?.metadata
  }

  /**
   * Clear the content cache
   */
  public clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; enabled: boolean; ttl: number } {
    return {
      size: this.cache.size,
      enabled: this.cacheEnabled,
      ttl: this.cacheTTL,
    }
  }

  /**
   * Replace variables in content string
   * Supports {variableName} syntax
   */
  private replaceVariables(content: string, variables: TemplateVariables): string {
    let result = content

    // Replace all {variableName} occurrences
    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined) {
        const pattern = new RegExp(`\\{${key}\\}`, 'g')
        result = result.replace(pattern, value)
      }
    }

    // Remove any unreplaced variables (optional: could leave them or warn)
    result = result.replace(/\{[^}]+\}/g, '')

    return result
  }

  /**
   * Generate cache key from template ID, language, and variables
   */
  private getCacheKey(
    templateId: TemplateId,
    language: Language,
    variables: TemplateVariables
  ): string {
    const variablesKey = JSON.stringify(
      Object.entries(variables)
        .sort(([a], [b]) => a.localeCompare(b))
        .filter(([, value]) => value !== undefined)
    )
    return `${templateId}:${language}:${variablesKey}`
  }

  /**
   * Get content from cache if not expired
   */
  private getFromCache(key: string): string | undefined {
    const entry = this.cache.get(key)
    if (!entry) {
      return undefined
    }

    const now = Date.now()
    if (now - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key)
      return undefined
    }

    return entry.content
  }

  /**
   * Store content in cache
   */
  private setCache(key: string, content: string): void {
    this.cache.set(key, {
      content,
      timestamp: Date.now(),
    })
  }
}

/**
 * Default content service instance
 * Can be used directly or customized per tenant
 */
export const defaultContentService = new ContentService({
  defaultLanguage: 'nl',
  cacheEnabled: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
})

/**
 * Convenience function to render content with default service
 */
export function renderContent(
  templateId: TemplateId,
  options: RenderOptions = {}
): string {
  return defaultContentService.render(templateId, options)
}

/**
 * Create a tenant-specific content service
 *
 * @example
 * ```typescript
 * const tenantService = createTenantContentService({
 *   tenantName: 'MisterDJ',
 *   platformName: 'RentGuy',
 *   defaultLanguage: 'nl'
 * })
 *
 * const content = tenantService.render('hero.cobranding')
 * ```
 */
export function createTenantContentService(
  tenantConfig: {
    tenantName?: string
    platformName?: string
    defaultLanguage?: Language
  } & ContentServiceConfig
): ContentService {
  const service = new ContentService({
    defaultLanguage: tenantConfig.defaultLanguage ?? 'nl',
    cacheEnabled: tenantConfig.cacheEnabled ?? true,
    ...(tenantConfig.cacheTTL !== undefined ? { cacheTTL: tenantConfig.cacheTTL } : {}),
  })

  // Pre-populate with tenant context
  const tenantVariables: TemplateVariables = {
    tenantName: tenantConfig.tenantName ?? '',
    platformName: tenantConfig.platformName ?? 'RentGuy',
  }

  // Wrap render method to auto-inject tenant variables
  const originalRender = service.render.bind(service)
  service.render = (templateId: TemplateId, options: RenderOptions = {}): string => {
    return originalRender(templateId, {
      ...options,
      variables: {
        ...tenantVariables,
        ...options.variables,
      },
    })
  }

  return service
}
