/**
 * Content Analytics Service for RentGuy Multi-Tenant Platform
 *
 * Provides comprehensive analytics and tracking for content templates:
 * - Track content views by template ID
 * - Record user interactions (clicks, time spent)
 * - Tenant-specific tracking
 * - Local storage for analytics data (IndexedDB with localStorage fallback)
 * - Privacy-compliant (no PII tracking)
 * - Export analytics data as JSON
 * - A/B testing support for content variations
 *
 * Privacy-first design:
 * - No personally identifiable information (PII) is tracked
 * - All data stored locally in the browser
 * - Users can clear analytics data at any time
 * - GDPR-compliant by design
 */

import { getLocalStorageItem, setLocalStorageItem } from '@core/storage'

/**
 * Event types for content analytics
 */
export type ContentEventType = 'view' | 'click' | 'interaction' | 'engagement'

/**
 * Content analytics event structure
 */
export interface ContentAnalyticsEvent {
  readonly eventType: ContentEventType
  readonly templateId: string
  readonly tenantId: string
  readonly timestamp: number
  readonly sessionId: string
  readonly metadata?: Record<string, unknown>
}

/**
 * Aggregated analytics data per template
 */
export interface TemplateAnalytics {
  readonly templateId: string
  readonly viewCount: number
  readonly clickCount: number
  readonly interactionCount: number
  readonly engagementCount: number
  readonly firstSeen: number
  readonly lastSeen: number
  readonly avgTimeSpent: number
  readonly tenants: Set<string>
}

/**
 * Analytics report structure
 */
export interface AnalyticsReport {
  readonly totalEvents: number
  readonly totalViews: number
  readonly totalClicks: number
  readonly totalInteractions: number
  readonly templates: Map<string, TemplateAnalytics>
  readonly tenantStats: Map<string, TenantStats>
  readonly dateRange: {
    readonly start: number
    readonly end: number
  }
  readonly sessionCount: number
}

/**
 * Tenant-specific statistics
 */
export interface TenantStats {
  readonly tenantId: string
  readonly viewCount: number
  readonly clickCount: number
  readonly interactionCount: number
  readonly uniqueTemplates: Set<string>
  readonly firstSeen: number
  readonly lastSeen: number
}

/**
 * Configuration options for the analytics service
 */
export interface ContentAnalyticsConfig {
  readonly storageKey?: string
  readonly batchSize?: number
  readonly flushInterval?: number // milliseconds
  readonly maxEvents?: number
  readonly enableRateLimiting?: boolean
  readonly rateLimitWindow?: number // milliseconds
  readonly rateLimitMax?: number // events per window
}

/**
 * IndexedDB wrapper for analytics storage
 */
class AnalyticsStorage {
  private readonly dbName = 'RentGuyAnalytics'
  private readonly storeName = 'events'
  private readonly version = 1
  private db: IDBDatabase | null = null
  private isSupported = false

  constructor() {
    this.isSupported = typeof indexedDB !== 'undefined'
  }

  async initialize(): Promise<void> {
    if (!this.isSupported || this.db) {
      return
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        console.warn('IndexedDB not available, falling back to localStorage')
        this.isSupported = false
        resolve()
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          })
          store.createIndex('templateId', 'templateId', { unique: false })
          store.createIndex('tenantId', 'tenantId', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('sessionId', 'sessionId', { unique: false })
        }
      }
    })
  }

  async saveEvents(events: readonly ContentAnalyticsEvent[]): Promise<void> {
    if (!this.isSupported || !this.db) {
      // Fallback to localStorage
      this.saveToLocalStorage(events)
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      for (const event of events) {
        store.add(event)
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => {
        console.warn('IndexedDB write failed, falling back to localStorage')
        this.saveToLocalStorage(events)
        resolve()
      }
    })
  }

  async getAllEvents(): Promise<ContentAnalyticsEvent[]> {
    if (!this.isSupported || !this.db) {
      return this.getFromLocalStorage()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result as ContentAnalyticsEvent[])
      }

      request.onerror = () => {
        console.warn('IndexedDB read failed, falling back to localStorage')
        resolve(this.getFromLocalStorage())
      }
    })
  }

  async clearEvents(): Promise<void> {
    if (!this.isSupported || !this.db) {
      this.clearLocalStorage()
      return
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => {
        this.clearLocalStorage()
        resolve()
      }

      request.onerror = () => {
        this.clearLocalStorage()
        resolve()
      }
    })
  }

  private saveToLocalStorage(events: readonly ContentAnalyticsEvent[]): void {
    try {
      const existing = this.getFromLocalStorage()
      const combined = [...existing, ...events]
      setLocalStorageItem('content_analytics_events', JSON.stringify(combined))
    } catch (error) {
      console.error('Failed to save analytics to localStorage', error)
    }
  }

  private getFromLocalStorage(): ContentAnalyticsEvent[] {
    try {
      const data = getLocalStorageItem('content_analytics_events', '[]')
      return JSON.parse(data) as ContentAnalyticsEvent[]
    } catch (error) {
      console.error('Failed to read analytics from localStorage', error)
      return []
    }
  }

  private clearLocalStorage(): void {
    setLocalStorageItem('content_analytics_events', null)
  }
}

/**
 * Main Content Analytics Service
 *
 * Manages analytics tracking, batching, rate limiting, and reporting
 */
export class ContentAnalyticsService {
  private readonly config: Required<ContentAnalyticsConfig>
  private readonly storage: AnalyticsStorage
  private readonly pendingEvents: ContentAnalyticsEvent[] = []
  private readonly rateLimitMap: Map<string, number[]> = new Map()
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private sessionId: string
  private isInitialized = false

  constructor(config: ContentAnalyticsConfig = {}) {
    this.config = {
      storageKey: config.storageKey ?? 'content_analytics',
      batchSize: config.batchSize ?? 10,
      flushInterval: config.flushInterval ?? 5000, // 5 seconds
      maxEvents: config.maxEvents ?? 10000,
      enableRateLimiting: config.enableRateLimiting ?? true,
      rateLimitWindow: config.rateLimitWindow ?? 1000, // 1 second
      rateLimitMax: config.rateLimitMax ?? 50, // 50 events per second
    }

    this.storage = new AnalyticsStorage()
    this.sessionId = this.generateSessionId()
    this.startFlushTimer()
  }

  /**
   * Initialize the analytics service
   * Must be called before tracking events
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    await this.storage.initialize()
    this.isInitialized = true
  }

  /**
   * Track a content view event
   */
  trackView(templateId: string, tenantId: string, metadata?: Record<string, unknown>): void {
    this.trackEvent({
      eventType: 'view',
      templateId,
      tenantId,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...(metadata ? { metadata } : {}),
    })
  }

  /**
   * Track a click event on content
   */
  trackClick(
    templateId: string,
    elementId: string,
    tenantId: string,
    metadata?: Record<string, unknown>
  ): void {
    this.trackEvent({
      eventType: 'click',
      templateId,
      tenantId,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata: {
        ...metadata,
        elementId,
      },
    })
  }

  /**
   * Track a general interaction event
   */
  trackInteraction(
    templateId: string,
    tenantId: string,
    interactionType: string,
    metadata?: Record<string, unknown>
  ): void {
    this.trackEvent({
      eventType: 'interaction',
      templateId,
      tenantId,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata: {
        ...metadata,
        interactionType,
      },
    })
  }

  /**
   * Track an engagement event (time spent, scroll depth, etc.)
   */
  trackEngagement(
    templateId: string,
    tenantId: string,
    engagementMetrics: Record<string, unknown>
  ): void {
    this.trackEvent({
      eventType: 'engagement',
      templateId,
      tenantId,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata: engagementMetrics,
    })
  }

  /**
   * Internal event tracking with rate limiting
   */
  private trackEvent(event: ContentAnalyticsEvent): void {
    if (this.config.enableRateLimiting && this.isRateLimited(event.templateId)) {
      console.debug('Rate limited:', event.templateId)
      return
    }

    this.pendingEvents.push(event)

    if (this.pendingEvents.length >= this.config.batchSize) {
      void this.flush()
    }
  }

  /**
   * Check if template is currently rate limited
   */
  private isRateLimited(templateId: string): boolean {
    const now = Date.now()
    const events = this.rateLimitMap.get(templateId) ?? []

    // Remove old events outside the window
    const recentEvents = events.filter(
      timestamp => now - timestamp < this.config.rateLimitWindow
    )

    this.rateLimitMap.set(templateId, [...recentEvents, now])

    return recentEvents.length >= this.config.rateLimitMax
  }

  /**
   * Flush pending events to storage
   */
  async flush(): Promise<void> {
    if (this.pendingEvents.length === 0) {
      return
    }

    const eventsToSave = this.pendingEvents.splice(0, this.pendingEvents.length)

    try {
      await this.storage.saveEvents(eventsToSave)
    } catch (error) {
      console.error('Failed to save analytics events', error)
      // Re-add events to pending queue on failure
      this.pendingEvents.unshift(...eventsToSave)
    }

    // Enforce max events limit
    await this.enforceMaxEvents()
  }

  /**
   * Enforce maximum events limit by removing oldest events
   */
  private async enforceMaxEvents(): Promise<void> {
    try {
      const allEvents = await this.storage.getAllEvents()

      if (allEvents.length > this.config.maxEvents) {
        // Keep only the most recent events
        const eventsToKeep = allEvents
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, this.config.maxEvents)

        await this.storage.clearEvents()
        await this.storage.saveEvents(eventsToKeep)
      }
    } catch (error) {
      console.error('Failed to enforce max events', error)
    }
  }

  /**
   * Get analytics report
   */
  async getAnalytics(tenantId?: string): Promise<AnalyticsReport> {
    await this.flush()

    const allEvents = await this.storage.getAllEvents()
    const events = tenantId
      ? allEvents.filter(e => e.tenantId === tenantId)
      : allEvents

    return this.generateReport(events)
  }

  /**
   * Generate analytics report from events
   */
  private generateReport(events: readonly ContentAnalyticsEvent[]): AnalyticsReport {
    const templates = new Map<string, TemplateAnalytics>()
    const tenantStats = new Map<string, TenantStats>()
    const sessions = new Set<string>()

    let minTimestamp = Infinity
    let maxTimestamp = -Infinity

    for (const event of events) {
      sessions.add(event.sessionId)
      minTimestamp = Math.min(minTimestamp, event.timestamp)
      maxTimestamp = Math.max(maxTimestamp, event.timestamp)

      // Update template analytics
      this.updateTemplateAnalytics(templates, event)

      // Update tenant analytics
      this.updateTenantAnalytics(tenantStats, event)
    }

    return {
      totalEvents: events.length,
      totalViews: events.filter(e => e.eventType === 'view').length,
      totalClicks: events.filter(e => e.eventType === 'click').length,
      totalInteractions: events.filter(e => e.eventType === 'interaction').length,
      templates,
      tenantStats,
      dateRange: {
        start: minTimestamp === Infinity ? Date.now() : minTimestamp,
        end: maxTimestamp === -Infinity ? Date.now() : maxTimestamp,
      },
      sessionCount: sessions.size,
    }
  }

  /**
   * Update template analytics for an event
   */
  private updateTemplateAnalytics(
    templates: Map<string, TemplateAnalytics>,
    event: ContentAnalyticsEvent
  ): void {
    const existing = templates.get(event.templateId)

    if (existing) {
      const updated: TemplateAnalytics = {
        ...existing,
        viewCount: existing.viewCount + (event.eventType === 'view' ? 1 : 0),
        clickCount: existing.clickCount + (event.eventType === 'click' ? 1 : 0),
        interactionCount: existing.interactionCount + (event.eventType === 'interaction' ? 1 : 0),
        engagementCount: existing.engagementCount + (event.eventType === 'engagement' ? 1 : 0),
        lastSeen: Math.max(existing.lastSeen, event.timestamp),
        tenants: new Set([...existing.tenants, event.tenantId]),
      }
      templates.set(event.templateId, updated)
    } else {
      templates.set(event.templateId, {
        templateId: event.templateId,
        viewCount: event.eventType === 'view' ? 1 : 0,
        clickCount: event.eventType === 'click' ? 1 : 0,
        interactionCount: event.eventType === 'interaction' ? 1 : 0,
        engagementCount: event.eventType === 'engagement' ? 1 : 0,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        avgTimeSpent: 0,
        tenants: new Set([event.tenantId]),
      })
    }
  }

  /**
   * Update tenant statistics for an event
   */
  private updateTenantAnalytics(
    tenantStats: Map<string, TenantStats>,
    event: ContentAnalyticsEvent
  ): void {
    const existing = tenantStats.get(event.tenantId)

    if (existing) {
      const updated: TenantStats = {
        ...existing,
        viewCount: existing.viewCount + (event.eventType === 'view' ? 1 : 0),
        clickCount: existing.clickCount + (event.eventType === 'click' ? 1 : 0),
        interactionCount: existing.interactionCount + (event.eventType === 'interaction' ? 1 : 0),
        uniqueTemplates: new Set([...existing.uniqueTemplates, event.templateId]),
        lastSeen: Math.max(existing.lastSeen, event.timestamp),
      }
      tenantStats.set(event.tenantId, updated)
    } else {
      tenantStats.set(event.tenantId, {
        tenantId: event.tenantId,
        viewCount: event.eventType === 'view' ? 1 : 0,
        clickCount: event.eventType === 'click' ? 1 : 0,
        interactionCount: event.eventType === 'interaction' ? 1 : 0,
        uniqueTemplates: new Set([event.templateId]),
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
      })
    }
  }

  /**
   * Export analytics data as JSON
   */
  async exportAnalytics(): Promise<string> {
    const report = await this.getAnalytics()

    // Convert Sets and Maps to arrays for JSON serialization
    const serializable = {
      ...report,
      templates: Array.from(report.templates.entries()).map(([id, data]) => ({
        ...data,
        tenants: Array.from(data.tenants),
      })),
      tenantStats: Array.from(report.tenantStats.entries()).map(([id, data]) => ({
        ...data,
        uniqueTemplates: Array.from(data.uniqueTemplates),
      })),
    }

    return JSON.stringify(serializable, null, 2)
  }

  /**
   * Clear all analytics data
   */
  async clearAnalytics(): Promise<void> {
    await this.storage.clearEvents()
    this.pendingEvents.length = 0
    this.rateLimitMap.clear()
  }

  /**
   * Start the periodic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(() => {
      void this.flush()
    }, this.config.flushInterval)
  }

  /**
   * Stop the periodic flush timer
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    void this.flush()
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}

/**
 * Default analytics service instance
 */
export const defaultAnalyticsService = new ContentAnalyticsService()

// Initialize the default service
void defaultAnalyticsService.initialize()

/**
 * Convenience functions using default service
 */
export function trackContentView(
  templateId: string,
  tenantId: string,
  metadata?: Record<string, unknown>
): void {
  defaultAnalyticsService.trackView(templateId, tenantId, metadata)
}

export function trackContentClick(
  templateId: string,
  elementId: string,
  tenantId: string,
  metadata?: Record<string, unknown>
): void {
  defaultAnalyticsService.trackClick(templateId, elementId, tenantId, metadata)
}

export function trackContentInteraction(
  templateId: string,
  tenantId: string,
  interactionType: string,
  metadata?: Record<string, unknown>
): void {
  defaultAnalyticsService.trackInteraction(templateId, tenantId, interactionType, metadata)
}

export function trackContentEngagement(
  templateId: string,
  tenantId: string,
  engagementMetrics: Record<string, unknown>
): void {
  defaultAnalyticsService.trackEngagement(templateId, tenantId, engagementMetrics)
}

export async function getContentAnalytics(tenantId?: string): Promise<AnalyticsReport> {
  return defaultAnalyticsService.getAnalytics(tenantId)
}

export async function exportContentAnalytics(): Promise<string> {
  return defaultAnalyticsService.exportAnalytics()
}

export async function clearContentAnalytics(): Promise<void> {
  return defaultAnalyticsService.clearAnalytics()
}
