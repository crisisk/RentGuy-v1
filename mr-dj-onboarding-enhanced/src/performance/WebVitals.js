// Web Vitals tracking and reporting
import { getCLS, getFID, getFCP, getLCP, getTTFB, onINP } from 'web-vitals';

const isDevelopment = import.meta.env?.DEV ?? false;

class WebVitalsReporter {
  constructor(options = {}) {
    this.options = {
      reportAllChanges: false,
      debug: isDevelopment,
      endpoint: '/api/analytics/web-vitals',
      ...options
    };
    
    this.vitals = new Map();
    this.sessionId = this.generateSessionId();
    this.init();
  }

  init() {
    // Track all Core Web Vitals
    this.trackCLS();
    this.trackFID();
    this.trackFCP();
    this.trackLCP();
    this.trackTTFB();
    this.trackINP();
    
    // Set up reporting
    this.setupReporting();
    
    // Track page visibility changes
    this.trackVisibilityChanges();
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  trackCLS() {
    getCLS((metric) => {
      this.recordMetric('CLS', metric);
      
      // CLS specific thresholds
      if (metric.value > 0.25) {
        this.reportPerformanceIssue('CLS', 'Poor', metric.value);
      } else if (metric.value > 0.1) {
        this.reportPerformanceIssue('CLS', 'Needs Improvement', metric.value);
      }
    }, { reportAllChanges: this.options.reportAllChanges });
  }

  trackFID() {
    getFID((metric) => {
      this.recordMetric('FID', metric);
      
      // FID specific thresholds (in milliseconds)
      if (metric.value > 300) {
        this.reportPerformanceIssue('FID', 'Poor', metric.value);
      } else if (metric.value > 100) {
        this.reportPerformanceIssue('FID', 'Needs Improvement', metric.value);
      }
    }, { reportAllChanges: this.options.reportAllChanges });
  }

  trackFCP() {
    getFCP((metric) => {
      this.recordMetric('FCP', metric);
      
      // FCP specific thresholds (in milliseconds)
      if (metric.value > 3000) {
        this.reportPerformanceIssue('FCP', 'Poor', metric.value);
      } else if (metric.value > 1800) {
        this.reportPerformanceIssue('FCP', 'Needs Improvement', metric.value);
      }
    }, { reportAllChanges: this.options.reportAllChanges });
  }

  trackLCP() {
    getLCP((metric) => {
      this.recordMetric('LCP', metric);
      
      // LCP specific thresholds (in milliseconds)
      if (metric.value > 4000) {
        this.reportPerformanceIssue('LCP', 'Poor', metric.value);
      } else if (metric.value > 2500) {
        this.reportPerformanceIssue('LCP', 'Needs Improvement', metric.value);
      }
    }, { reportAllChanges: this.options.reportAllChanges });
  }

  trackTTFB() {
    getTTFB((metric) => {
      this.recordMetric('TTFB', metric);
      
      // TTFB specific thresholds (in milliseconds)
      if (metric.value > 1500) {
        this.reportPerformanceIssue('TTFB', 'Poor', metric.value);
      } else if (metric.value > 800) {
        this.reportPerformanceIssue('TTFB', 'Needs Improvement', metric.value);
      }
    }, { reportAllChanges: this.options.reportAllChanges });
  }

  trackINP() {
    // Interaction to Next Paint (newer metric)
    if (onINP) {
      onINP((metric) => {
        this.recordMetric('INP', metric);
        
        // INP specific thresholds (in milliseconds)
        if (metric.value > 500) {
          this.reportPerformanceIssue('INP', 'Poor', metric.value);
        } else if (metric.value > 200) {
          this.reportPerformanceIssue('INP', 'Needs Improvement', metric.value);
        }
      }, { reportAllChanges: this.options.reportAllChanges });
    }
  }

  recordMetric(name, metric) {
    const vitalsData = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      timestamp: Date.now(),
      url: window.location.href,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceMemory: this.getDeviceMemory(),
    };

    this.vitals.set(name, vitalsData);

    if (this.options.debug) {
      console.log(`Web Vital - ${name}:`, vitalsData);
    }

    // Send to analytics immediately for critical metrics
    if (['CLS', 'FID', 'LCP'].includes(name)) {
      this.sendToAnalytics(vitalsData);
    }
  }

  reportPerformanceIssue(metric, severity, value) {
    const issue = {
      type: 'performance_issue',
      metric,
      severity,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      sessionId: this.sessionId,
    };

    if (this.options.debug) {
      console.warn(`Performance Issue - ${metric} (${severity}):`, value);
    }

    // Send performance issue to monitoring service
    this.sendToMonitoring(issue);
  }

  getConnectionType() {
    if ('connection' in navigator) {
      return navigator.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  getDeviceMemory() {
    if ('deviceMemory' in navigator) {
      return navigator.deviceMemory;
    }
    return 'unknown';
  }

  setupReporting() {
    // Send metrics when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendAllMetrics();
      }
    });

    // Send metrics before page unload
    window.addEventListener('beforeunload', () => {
      this.sendAllMetrics();
    });

    // Periodic reporting (every 30 seconds)
    setInterval(() => {
      this.sendAllMetrics();
    }, 30000);
  }

  trackVisibilityChanges() {
    let visibilityStart = Date.now();
    
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        visibilityStart = Date.now();
      } else {
        const visibilityDuration = Date.now() - visibilityStart;
        this.recordCustomMetric('page_visibility_duration', visibilityDuration);
      }
    });
  }

  recordCustomMetric(name, value, metadata = {}) {
    const customMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      sessionId: this.sessionId,
      ...metadata
    };

    this.vitals.set(`custom_${name}`, customMetric);

    if (this.options.debug) {
      console.log(`Custom Metric - ${name}:`, customMetric);
    }
  }

  sendToAnalytics(metric) {
    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        custom_parameter_1: metric.rating,
        custom_parameter_2: this.sessionId,
      });
    }

    // Send to custom analytics endpoint
    this.sendToEndpoint('/api/analytics/web-vitals', metric);
  }

  sendToMonitoring(issue) {
    // Send to monitoring service (e.g., Sentry, DataDog)
    this.sendToEndpoint('/api/monitoring/performance-issues', issue);
  }

  sendAllMetrics() {
    const allMetrics = Array.from(this.vitals.values());
    
    if (allMetrics.length > 0) {
      this.sendToEndpoint('/api/analytics/web-vitals-batch', {
        metrics: allMetrics,
        sessionId: this.sessionId,
        timestamp: Date.now(),
      });
    }
  }

  sendToEndpoint(endpoint, data) {
    // Use sendBeacon for reliability during page unload
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      // Fallback to fetch
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(error => {
        if (this.options.debug) {
          console.error('Failed to send metrics:', error);
        }
      });
    }
  }

  // Public methods
  getMetrics() {
    return Object.fromEntries(this.vitals);
  }

  getMetricsSummary() {
    const metrics = this.getMetrics();
    const summary = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      coreWebVitals: {},
      customMetrics: {},
    };

    Object.entries(metrics).forEach(([key, metric]) => {
      if (['CLS', 'FID', 'FCP', 'LCP', 'TTFB', 'INP'].includes(metric.name)) {
        summary.coreWebVitals[metric.name] = {
          value: metric.value,
          rating: metric.rating,
        };
      } else if (key.startsWith('custom_')) {
        summary.customMetrics[metric.name] = metric.value;
      }
    });

    return summary;
  }

  // Performance budget checking
  checkPerformanceBudget(budget = {}) {
    const defaultBudget = {
      CLS: 0.1,
      FID: 100,
      FCP: 1800,
      LCP: 2500,
      TTFB: 800,
      INP: 200,
    };

    const activeBudget = { ...defaultBudget, ...budget };
    const metrics = this.getMetrics();
    const violations = [];

    Object.entries(activeBudget).forEach(([metric, threshold]) => {
      const metricData = metrics[metric];
      if (metricData && metricData.value > threshold) {
        violations.push({
          metric,
          value: metricData.value,
          threshold,
          severity: metricData.value > threshold * 2 ? 'critical' : 'warning',
        });
      }
    });

    return violations;
  }
}

// Initialize Web Vitals tracking
let webVitalsReporter;

export const initWebVitals = (options = {}) => {
  if (!webVitalsReporter) {
    webVitalsReporter = new WebVitalsReporter(options);
  }
  return webVitalsReporter;
};

export const getWebVitalsReporter = () => webVitalsReporter;

// Convenience functions
export const trackCustomMetric = (name, value, metadata) => {
  if (webVitalsReporter) {
    webVitalsReporter.recordCustomMetric(name, value, metadata);
  }
};

export const getPerformanceSummary = () => {
  return webVitalsReporter ? webVitalsReporter.getMetricsSummary() : null;
};

export const checkPerformanceBudget = (budget) => {
  return webVitalsReporter ? webVitalsReporter.checkPerformanceBudget(budget) : [];
};

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initWebVitals();
    });
  } else {
    initWebVitals();
  }
}

export default WebVitalsReporter;
