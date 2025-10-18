/**
 * Content Service Usage Examples
 *
 * This file demonstrates how to use the ContentService for rendering
 * tenant-agnostic content templates in RentGuy.
 */

import {
  ContentService,
  defaultContentService,
  renderContent,
  createTenantContentService,
  type RenderOptions,
} from './contentService'

// ============================================================================
// EXAMPLE 1: Basic Usage with Default Service
// ============================================================================

export function example1_basicUsage() {
  console.log('Example 1: Basic Usage')
  console.log('======================\n')

  // Render a single template in Dutch (default)
  const heroContent = renderContent('hero.cobranding')
  console.log('Hero (NL):', heroContent)

  // Render in English
  const heroContentEn = renderContent('hero.cobranding', { language: 'en' })
  console.log('Hero (EN):', heroContentEn)

  // Render audit trail message
  const auditContent = renderContent('hero.audit')
  console.log('Audit (NL):', auditContent)
}

// ============================================================================
// EXAMPLE 2: Using Variables (when templates support them)
// ============================================================================

export function example2_withVariables() {
  console.log('\nExample 2: With Variables')
  console.log('==========================\n')

  // Note: Current templates don't use variables, but the service supports them
  // This example shows how it would work with variable-based templates

  const options: RenderOptions = {
    language: 'nl',
    variables: {
      tenantName: 'MisterDJ',
      platformName: 'RentGuy Platform',
      userName: 'Bart',
    },
  }

  const content = renderContent('hero.cobranding', options)
  console.log('Content with variables:', content)
}

// ============================================================================
// EXAMPLE 3: Batch Rendering
// ============================================================================

export function example3_batchRendering() {
  console.log('\nExample 3: Batch Rendering')
  console.log('===========================\n')

  // Render multiple templates at once
  const templates = defaultContentService.renderBatch(
    ['hero.cobranding', 'hero.audit', 'credentials.operations', 'journey.login', 'flow.role'],
    { language: 'nl' }
  )

  templates.forEach((content, templateId) => {
    console.log(`${templateId}: ${content}`)
  })
}

// ============================================================================
// EXAMPLE 4: Tenant-Specific Service
// ============================================================================

export function example4_tenantService() {
  console.log('\nExample 4: Tenant-Specific Service')
  console.log('===================================\n')

  // Create a service configured for a specific tenant
  const misterdJService = createTenantContentService({
    tenantName: 'MisterDJ',
    platformName: 'RentGuy',
    defaultLanguage: 'nl',
  })

  // Render content with tenant context automatically applied
  const heroContent = misterdJService.render('hero.cobranding')
  console.log('MisterDJ Hero:', heroContent)

  const loginContent = misterdJService.render('journey.login')
  console.log('MisterDJ Login:', loginContent)
}

// ============================================================================
// EXAMPLE 5: Cache Management
// ============================================================================

export function example5_cacheManagement() {
  console.log('\nExample 5: Cache Management')
  console.log('===========================\n')

  // Create service with custom cache settings
  const service = new ContentService({
    defaultLanguage: 'nl',
    cacheEnabled: true,
    cacheTTL: 10 * 60 * 1000, // 10 minutes
  })

  // Render content (will be cached)
  const content1 = service.render('hero.cobranding')
  console.log('First render:', content1)

  // Get cache stats
  console.log('Cache stats:', service.getCacheStats())

  // Render again (will use cache)
  const content2 = service.render('hero.cobranding')
  console.log('Second render (cached):', content2)

  // Clear cache
  service.clearCache()
  console.log('Cache cleared, stats:', service.getCacheStats())
}

// ============================================================================
// EXAMPLE 6: Getting Template Metadata
// ============================================================================

export function example6_metadata() {
  console.log('\nExample 6: Template Metadata')
  console.log('=============================\n')

  // Get metadata for a template
  const metadata = defaultContentService.getTemplateMetadata('hero.cobranding')

  if (metadata) {
    console.log('Template: hero.cobranding')
    console.log('Original score:', metadata.score.original)
    console.log('Improved score:', metadata.score.improved)
    console.log('Issues:', metadata.issues)
    console.log('Improvements:', metadata.improvements)
  }
}

// ============================================================================
// EXAMPLE 7: React Component Integration
// ============================================================================

/**
 * Example React component using the content service
 */
export function ExampleReactComponent() {
  // In a real component, you'd import React
  // import { useState, useEffect } from 'react'

  const heroText = renderContent('hero.cobranding', { language: 'nl' })
  const auditText = renderContent('hero.audit', { language: 'nl' })

  return `
    <div>
      <h1>${heroText}</h1>
      <p>${auditText}</p>
    </div>
  `
}

// ============================================================================
// EXAMPLE 8: Multi-Language Support
// ============================================================================

export function example8_multiLanguage() {
  console.log('\nExample 8: Multi-Language Support')
  console.log('==================================\n')

  const templates = ['hero.cobranding', 'hero.audit', 'journey.login'] as const

  templates.forEach((templateId) => {
    console.log(`\nTemplate: ${templateId}`)
    console.log('NL:', renderContent(templateId, { language: 'nl' }))
    console.log('EN:', renderContent(templateId, { language: 'en' }))
  })
}

// ============================================================================
// EXAMPLE 9: Disabling Cache for Dynamic Content
// ============================================================================

export function example9_disableCache() {
  console.log('\nExample 9: Disable Cache')
  console.log('========================\n')

  // Render without caching (useful for content that changes frequently)
  const content = renderContent('hero.cobranding', {
    language: 'nl',
    useCache: false,
  })

  console.log('Content (no cache):', content)
}

// ============================================================================
// EXAMPLE 10: All Available Templates
// ============================================================================

export function example10_listAllTemplates() {
  console.log('\nExample 10: All Available Templates')
  console.log('====================================\n')

  const templates = defaultContentService.getAvailableTemplates()

  templates.forEach((templateId) => {
    const content = renderContent(templateId)
    const metadata = defaultContentService.getTemplateMetadata(templateId)
    console.log(`\n${templateId}`)
    console.log(`Content: ${content}`)
    console.log(`Score: ${metadata?.score.original} → ${metadata?.score.improved}`)
  })
}

// ============================================================================
// Run All Examples (for testing)
// ============================================================================

export function runAllExamples() {
  example1_basicUsage()
  example2_withVariables()
  example3_batchRendering()
  example4_tenantService()
  example5_cacheManagement()
  example6_metadata()
  example8_multiLanguage()
  example9_disableCache()
  example10_listAllTemplates()
}

// Uncomment to run examples:
// runAllExamples()
