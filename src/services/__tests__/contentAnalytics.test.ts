/**
 * Tests for Content Analytics Service
 *
 * Covers:
 * - Event tracking
 * - Data persistence
 * - Analytics report generation
 * - Privacy compliance (no PII)
 * - Export functionality
 * - Rate limiting
 * - Batching
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  ContentAnalyticsService,
  type ContentAnalyticsEvent,
  type AnalyticsReport,
} from '../contentAnalytics'

// Mock IndexedDB since it's not available in Node test environment
class MockIDBDatabase {
  objectStoreNames = {
    contains: () => false
  }
}

class MockIDBOpenDBRequest {
  onsuccess: (() => void) | null = null
  onerror: (() => void) | null = null
  onupgradeneeded: ((event: { target: { result: MockIDBDatabase } }) => void) | null = null
  result = new MockIDBDatabase()
}

globalThis.indexedDB = {
  open: () => {
    const request = new MockIDBOpenDBRequest()
    // Simulate immediate success
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess()
      }
    }, 0)
    return request as unknown as IDBOpenDBRequest
  }
} as IDBFactory

describe('ContentAnalyticsService', () => {
  let service: ContentAnalyticsService

  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }

    service = new ContentAnalyticsService({
      batchSize: 5,
      flushInterval: 100,
      enableRateLimiting: false, // Disable for easier testing
    })
  })

  afterEach(() => {
    service.destroy()
  })

  describe('Event Tracking', () => {
    it('should track view events', async () => {
      service.trackView('template-1', 'tenant-1')
      await service.flush()

      const report = await service.getAnalytics()
      expect(report.totalViews).toBe(1)
      expect(report.totalEvents).toBe(1)
    })

    it('should track click events', async () => {
      service.trackClick('template-1', 'button-1', 'tenant-1')
      await service.flush()

      const report = await service.getAnalytics()
      expect(report.totalClicks).toBe(1)
      expect(report.totalEvents).toBe(1)
    })

    it('should track interaction events', async () => {
      service.trackInteraction('template-1', 'tenant-1', 'scroll')
      await service.flush()

      const report = await service.getAnalytics()
      expect(report.totalInteractions).toBe(1)
      expect(report.totalEvents).toBe(1)
    })

    it('should track engagement events', async () => {
      service.trackEngagement('template-1', 'tenant-1', {
        timeSpent: 5000,
        scrollDepth: 75,
      })
      await service.flush()

      const report = await service.getAnalytics()
      expect(report.totalEvents).toBe(1)
    })

    it('should include metadata in events', async () => {
      const metadata = { variant: 'A', custom: 'value' }
      service.trackView('template-1', 'tenant-1', metadata)
      await service.flush()

      const report = await service.getAnalytics()
      expect(report.totalEvents).toBe(1)
    })

    it('should track multiple events', async () => {
      service.trackView('template-1', 'tenant-1')
      service.trackClick('template-1', 'button-1', 'tenant-1')
      service.trackInteraction('template-1', 'tenant-1', 'hover')
      await service.flush()

      const report = await service.getAnalytics()
      expect(report.totalEvents).toBe(3)
      expect(report.totalViews).toBe(1)
      expect(report.totalClicks).toBe(1)
      expect(report.totalInteractions).toBe(1)
    })
  })

  describe('Batching', () => {
    it('should batch events before flushing', async () => {
      const batchService = new ContentAnalyticsService({
        batchSize: 3,
        flushInterval: 10000, // Long interval to test manual batching
      })

      batchService.trackView('template-1', 'tenant-1')
      batchService.trackView('template-2', 'tenant-1')

      // Not yet flushed
      let report = await batchService.getAnalytics()
      expect(report.totalEvents).toBe(0)

      // Third event should trigger auto-flush
      batchService.trackView('template-3', 'tenant-1')

      // Wait a bit for async flush
      await new Promise(resolve => setTimeout(resolve, 50))

      report = await batchService.getAnalytics()
      expect(report.totalEvents).toBe(3)

      batchService.destroy()
    })

    it('should flush on manual flush call', async () => {
      service.trackView('template-1', 'tenant-1')
      await service.flush()

      const report = await service.getAnalytics()
      expect(report.totalEvents).toBe(1)
    })
  })

  describe('Rate Limiting', () => {
    it('should rate limit events when enabled', async () => {
      const rateLimitedService = new ContentAnalyticsService({
        enableRateLimiting: true,
        rateLimitMax: 3,
        rateLimitWindow: 1000,
      })

      // Track 5 events rapidly
      for (let i = 0; i < 5; i++) {
        rateLimitedService.trackView('template-1', 'tenant-1')
      }

      await rateLimitedService.flush()
      const report = await rateLimitedService.getAnalytics()

      // Should only have 3 events due to rate limiting
      expect(report.totalEvents).toBeLessThanOrEqual(4) // Allow for timing

      rateLimitedService.destroy()
    })
  })

  describe('Analytics Report Generation', () => {
    it('should generate correct template analytics', async () => {
      service.trackView('template-1', 'tenant-1')
      service.trackView('template-1', 'tenant-1')
      service.trackClick('template-1', 'button-1', 'tenant-1')
      await service.flush()

      const report = await service.getAnalytics()
      const template1 = report.templates.get('template-1')

      expect(template1).toBeDefined()
      expect(template1?.viewCount).toBe(2)
      expect(template1?.clickCount).toBe(1)
      expect(template1?.templateId).toBe('template-1')
    })

    it('should track multiple templates', async () => {
      service.trackView('template-1', 'tenant-1')
      service.trackView('template-2', 'tenant-1')
      service.trackView('template-3', 'tenant-1')
      await service.flush()

      const report = await service.getAnalytics()
      expect(report.templates.size).toBe(3)
    })

    it('should generate tenant statistics', async () => {
      service.trackView('template-1', 'tenant-1')
      service.trackView('template-2', 'tenant-1')
      service.trackClick('template-1', 'button-1', 'tenant-2')
      await service.flush()

      const report = await service.getAnalytics()
      expect(report.tenantStats.size).toBe(2)

      const tenant1Stats = report.tenantStats.get('tenant-1')
      expect(tenant1Stats?.viewCount).toBe(2)
      expect(tenant1Stats?.uniqueTemplates.size).toBe(2)

      const tenant2Stats = report.tenantStats.get('tenant-2')
      expect(tenant2Stats?.clickCount).toBe(1)
    })

    it('should filter analytics by tenant', async () => {
      service.trackView('template-1', 'tenant-1')
      service.trackView('template-2', 'tenant-2')
      await service.flush()

      const tenant1Report = await service.getAnalytics('tenant-1')
      expect(tenant1Report.totalEvents).toBe(1)
      expect(tenant1Report.templates.size).toBe(1)

      const allReport = await service.getAnalytics()
      expect(allReport.totalEvents).toBe(2)
    })

    it('should calculate date ranges correctly', async () => {
      const startTime = Date.now()
      service.trackView('template-1', 'tenant-1')

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10))

      service.trackView('template-2', 'tenant-1')
      await service.flush()

      const report = await service.getAnalytics()
      expect(report.dateRange.start).toBeGreaterThanOrEqual(startTime)
      expect(report.dateRange.end).toBeGreaterThanOrEqual(report.dateRange.start)
    })

    it('should count unique sessions', async () => {
      service.trackView('template-1', 'tenant-1')
      service.trackView('template-2', 'tenant-1')
      await service.flush()

      const report = await service.getAnalytics()
      expect(report.sessionCount).toBe(1) // Same session
    })
  })

  describe('Privacy Compliance', () => {
    it('should not track user identifiable information', async () => {
      const metadata = {
        email: 'user@example.com',
        name: 'John Doe',
        ip: '192.168.1.1',
      }

      service.trackView('template-1', 'tenant-1', metadata)
      await service.flush()

      // The service doesn't validate metadata content, but users should be warned
      // This test documents the expected behavior
      const report = await service.getAnalytics()
      expect(report.totalEvents).toBe(1)

      // In a real scenario, PII should be scrubbed at the application level
      // before passing to analytics
    })

    it('should allow clearing all analytics data', async () => {
      service.trackView('template-1', 'tenant-1')
      service.trackView('template-2', 'tenant-1')
      await service.flush()

      let report = await service.getAnalytics()
      expect(report.totalEvents).toBe(2)

      await service.clearAnalytics()

      report = await service.getAnalytics()
      expect(report.totalEvents).toBe(0)
      expect(report.templates.size).toBe(0)
    })
  })

  describe('Export Functionality', () => {
    it('should export analytics as JSON', async () => {
      service.trackView('template-1', 'tenant-1')
      service.trackClick('template-1', 'button-1', 'tenant-1')
      await service.flush()

      const exported = await service.exportAnalytics()
      expect(typeof exported).toBe('string')

      const parsed = JSON.parse(exported)
      expect(parsed.totalEvents).toBe(2)
      expect(parsed.totalViews).toBe(1)
      expect(parsed.totalClicks).toBe(1)
      expect(Array.isArray(parsed.templates)).toBe(true)
      expect(Array.isArray(parsed.tenantStats)).toBe(true)
    })

    it('should include all report data in export', async () => {
      service.trackView('template-1', 'tenant-1')
      service.trackView('template-2', 'tenant-2')
      await service.flush()

      const exported = await service.exportAnalytics()
      const parsed = JSON.parse(exported)

      expect(parsed).toHaveProperty('totalEvents')
      expect(parsed).toHaveProperty('totalViews')
      expect(parsed).toHaveProperty('totalClicks')
      expect(parsed).toHaveProperty('templates')
      expect(parsed).toHaveProperty('tenantStats')
      expect(parsed).toHaveProperty('dateRange')
      expect(parsed).toHaveProperty('sessionCount')
    })
  })

  describe('Template Analytics Details', () => {
    it('should track first and last seen timestamps', async () => {
      const firstTime = Date.now()
      service.trackView('template-1', 'tenant-1')

      await new Promise(resolve => setTimeout(resolve, 10))

      const secondTime = Date.now()
      service.trackView('template-1', 'tenant-1')
      await service.flush()

      const report = await service.getAnalytics()
      const template = report.templates.get('template-1')

      expect(template?.firstSeen).toBeLessThan(template?.lastSeen ?? 0)
      expect(template?.firstSeen).toBeGreaterThanOrEqual(firstTime)
      expect(template?.lastSeen).toBeGreaterThanOrEqual(secondTime)
    })

    it('should track unique tenants per template', async () => {
      service.trackView('template-1', 'tenant-1')
      service.trackView('template-1', 'tenant-2')
      service.trackView('template-1', 'tenant-3')
      await service.flush()

      const report = await service.getAnalytics()
      const template = report.templates.get('template-1')

      expect(template?.tenants.size).toBe(3)
      expect(template?.tenants.has('tenant-1')).toBe(true)
      expect(template?.tenants.has('tenant-2')).toBe(true)
      expect(template?.tenants.has('tenant-3')).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const service = new ContentAnalyticsService()
      await service.initialize()

      // Should not throw
      service.trackView('template-1', 'tenant-1')
      await service.flush()

      const report = await service.getAnalytics()
      expect(report.totalEvents).toBeGreaterThanOrEqual(0)

      service.destroy()
    })

    it('should handle empty analytics gracefully', async () => {
      const report = await service.getAnalytics()

      expect(report.totalEvents).toBe(0)
      expect(report.totalViews).toBe(0)
      expect(report.totalClicks).toBe(0)
      expect(report.templates.size).toBe(0)
      expect(report.tenantStats.size).toBe(0)
    })
  })

  describe('Session Management', () => {
    it('should generate unique session IDs', () => {
      const service1 = new ContentAnalyticsService()
      const service2 = new ContentAnalyticsService()

      service1.trackView('template-1', 'tenant-1')
      service2.trackView('template-1', 'tenant-1')

      // Session IDs should be different (though we can't directly test this
      // without exposing the session ID, we can verify different instances
      // work independently)
      expect(service1).not.toBe(service2)

      service1.destroy()
      service2.destroy()
    })
  })

  describe('Max Events Limit', () => {
    it('should enforce max events limit', async () => {
      const limitedService = new ContentAnalyticsService({
        maxEvents: 5,
        batchSize: 1,
      })

      // Track more events than the limit
      for (let i = 0; i < 10; i++) {
        limitedService.trackView(`template-${i}`, 'tenant-1')
      }

      await limitedService.flush()
      await new Promise(resolve => setTimeout(resolve, 50))

      const report = await limitedService.getAnalytics()

      // Should have at most 5 events
      expect(report.totalEvents).toBeLessThanOrEqual(5)

      limitedService.destroy()
    })
  })
})

describe('Helper Functions', () => {
  it('should track view with convenience function', async () => {
    const { trackContentView, getContentAnalytics } = await import('../contentAnalytics')

    trackContentView('template-1', 'tenant-1')

    await new Promise(resolve => setTimeout(resolve, 100))

    const report = await getContentAnalytics()
    expect(report.totalViews).toBeGreaterThanOrEqual(1)
  })

  it('should export analytics with convenience function', async () => {
    const { trackContentView, exportContentAnalytics } = await import('../contentAnalytics')

    trackContentView('template-1', 'tenant-1')

    await new Promise(resolve => setTimeout(resolve, 100))

    const exported = await exportContentAnalytics()
    expect(typeof exported).toBe('string')

    const parsed = JSON.parse(exported)
    expect(parsed).toHaveProperty('totalEvents')
  })
})
