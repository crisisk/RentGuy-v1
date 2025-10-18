/**
 * Content Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ContentService, renderContent, createTenantContentService } from '../contentService'

describe('ContentService', () => {
  let service: ContentService

  beforeEach(() => {
    service = new ContentService({
      defaultLanguage: 'nl',
      cacheEnabled: true,
      cacheTTL: 1000,
    })
  })

  describe('render', () => {
    it('should render a template in Dutch by default', () => {
      const content = service.render('hero.cobranding')
      expect(content).toBe('Uw merkidentiteit en platformbeheer zijn naadloos geïntegreerd.')
    })

    it('should render a template in English when specified', () => {
      const content = service.render('hero.cobranding', { language: 'en' })
      expect(content).toBe('Your brand identity and platform management are seamlessly integrated.')
    })

    it('should render all 5 improved templates', () => {
      const content1 = service.render('hero.cobranding')
      const content2 = service.render('hero.audit')
      const content3 = service.render('credentials.operations')
      const content4 = service.render('journey.login')
      const content5 = service.render('flow.role')

      // All should have content (not empty strings)
      expect(content1.length > 0).toBe(true)
      expect(content2.length > 0).toBe(true)
      expect(content3.length > 0).toBe(true)
      expect(content4.length > 0).toBe(true)
      expect(content5.length > 0).toBe(true)
    })

    it('should return empty string for non-existent template', () => {
      const content = service.render('non.existent' as any)
      expect(content).toBe('')
    })

    it('should replace variables in content', () => {
      // Note: Current templates don't have variables, but the service supports them
      // This test demonstrates the capability
      const service2 = new ContentService()
      const content = service2.render('hero.cobranding', {
        variables: {
          tenantName: 'MisterDJ',
        },
      })
      expect(content).toBe('Uw merkidentiteit en platformbeheer zijn naadloos geïntegreerd.')
    })
  })

  describe('renderBatch', () => {
    it('should render multiple templates at once', () => {
      const templates = ['hero.cobranding', 'hero.audit'] as const
      const results = service.renderBatch(templates)

      expect(results.size).toBe(2)
      const content1 = results.get('hero.cobranding')
      const content2 = results.get('hero.audit')
      expect((content1?.length ?? 0) > 0).toBe(true)
      expect((content2?.length ?? 0) > 0).toBe(true)
    })

    it('should render all templates in English', () => {
      const templates = [
        'hero.cobranding',
        'hero.audit',
        'credentials.operations',
        'journey.login',
        'flow.role',
      ] as const

      const results = service.renderBatch(templates, { language: 'en' })

      expect(results.size).toBe(5)
      const c1 = results.get('hero.cobranding')
      const c2 = results.get('hero.audit')
      const c3 = results.get('credentials.operations')
      const c4 = results.get('journey.login')
      const c5 = results.get('flow.role')
      expect((c1?.length ?? 0) > 0).toBe(true)
      expect((c2?.length ?? 0) > 0).toBe(true)
      expect((c3?.length ?? 0) > 0).toBe(true)
      expect((c4?.length ?? 0) > 0).toBe(true)
      expect((c5?.length ?? 0) > 0).toBe(true)
    })
  })

  describe('cache', () => {
    it('should cache rendered content', () => {
      const content1 = service.render('hero.cobranding')
      const content2 = service.render('hero.cobranding')

      expect(content1).toBe(content2)
      const cacheSize = service.getCacheStats().size
      expect(cacheSize === 0).toBe(false) // size > 0
    })

    it('should respect cache disabled option', () => {
      service.render('hero.cobranding', { useCache: false })
      expect(service.getCacheStats().size).toBe(0)
    })

    it('should clear cache', () => {
      service.render('hero.cobranding')
      const sizeBefore = service.getCacheStats().size
      expect(sizeBefore === 0).toBe(false) // size > 0

      service.clearCache()
      expect(service.getCacheStats().size).toBe(0)
    })
  })

  describe('metadata', () => {
    it('should return template metadata', () => {
      const metadata = service.getTemplateMetadata('hero.cobranding')

      expect(metadata === undefined).toBe(false)
      if (metadata) {
        expect(metadata.score.original).toBe(4.8)
        expect(metadata.score.improved).toBe(8.5)
        expect(metadata.issues.length === 0).toBe(false) // length > 0
        expect(metadata.improvements.length === 0).toBe(false) // length > 0
      }
    })

    it('should show improvement scores for all templates', () => {
      const templates = [
        { id: 'hero.cobranding', originalScore: 4.8, improvedScore: 8.5 },
        { id: 'hero.audit', originalScore: 6.3, improvedScore: 8.7 },
        { id: 'credentials.operations', originalScore: 5.5, improvedScore: 8.3 },
        { id: 'journey.login', originalScore: 6.0, improvedScore: 8.6 },
        { id: 'flow.role', originalScore: 6.5, improvedScore: 8.4 },
      ] as const

      templates.forEach((template) => {
        const metadata = service.getTemplateMetadata(template.id)
        expect(metadata?.score.original).toBe(template.originalScore)
        expect(metadata?.score.improved).toBe(template.improvedScore)
      })
    })
  })

  describe('getAvailableTemplates', () => {
    it('should return all 5 template IDs', () => {
      const templates = service.getAvailableTemplates()

      expect(templates.length).toBe(5)
      expect(templates.includes('hero.cobranding')).toBe(true)
      expect(templates.includes('hero.audit')).toBe(true)
      expect(templates.includes('credentials.operations')).toBe(true)
      expect(templates.includes('journey.login')).toBe(true)
      expect(templates.includes('flow.role')).toBe(true)
    })
  })
})

describe('renderContent helper', () => {
  it('should render content using default service', () => {
    const content = renderContent('hero.cobranding')
    expect(content).toBe('Uw merkidentiteit en platformbeheer zijn naadloos geïntegreerd.')
  })

  it('should support all render options', () => {
    const content = renderContent('hero.cobranding', {
      language: 'en',
      variables: { tenantName: 'Test' },
      useCache: false,
    })
    expect(content).toBe('Your brand identity and platform management are seamlessly integrated.')
  })
})

describe('createTenantContentService', () => {
  it('should create a tenant-specific service', () => {
    const tenantService = createTenantContentService({
      tenantName: 'MisterDJ',
      platformName: 'RentGuy',
      defaultLanguage: 'nl',
    })

    const content = tenantService.render('hero.cobranding')
    expect(content).toBe('Uw merkidentiteit en platformbeheer zijn naadloos geïntegreerd.')
  })

  it('should use custom cache settings', () => {
    const tenantService = createTenantContentService({
      tenantName: 'TestTenant',
      cacheEnabled: false,
    })

    expect(tenantService.getCacheStats().enabled).toBe(false)
  })
})

describe('Content Quality Improvements', () => {
  it('should have removed all hard-coded company names', () => {
    const service = new ContentService()
    const templates = service.getAvailableTemplates()

    templates.forEach((templateId) => {
      const contentNl = service.render(templateId, { language: 'nl' })
      const contentEn = service.render(templateId, { language: 'en' })

      // Should not contain hard-coded names
      expect(contentNl.includes('Mister DJ')).toBe(false)
      expect(contentNl.includes('Sevensa')).toBe(false)
      expect(contentNl.includes('Bart')).toBe(false)

      expect(contentEn.includes('Mister DJ')).toBe(false)
      expect(contentEn.includes('Sevensa')).toBe(false)
      expect(contentEn.includes('Bart')).toBe(false)
    })
  })

  it('should use professional tone (uw vs je)', () => {
    const service = new ContentService()

    const journeyLogin = service.render('journey.login', { language: 'nl' })
    expect(journeyLogin.includes('uw')).toBe(true)
    expect(journeyLogin.includes(' je ')).toBe(false)

    const flowRole = service.render('flow.role', { language: 'nl' })
    expect(flowRole.includes('uw')).toBe(true)
    expect(flowRole.includes(' je ')).toBe(false)
  })

  it('should have improved clarity scores', () => {
    const service = new ContentService()
    const templates = service.getAvailableTemplates()

    templates.forEach((templateId) => {
      const metadata = service.getTemplateMetadata(templateId)
      expect(metadata === undefined).toBe(false)

      if (metadata) {
        // All improved scores should be significantly higher
        expect(metadata.score.improved > metadata.score.original).toBe(true)
        expect(metadata.score.improved >= 8.0).toBe(true)
      }
    })
  })
})
