import React, { useEffect, useRef, useState } from 'react'
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

const isDevelopment = import.meta.env?.DEV ?? false

class PerformanceMetrics {
  constructor() {
    this.metrics = new Map()
    this.observers = []
    this.startTime = performance.now()
  }

  // Core Web Vitals tracking
  initWebVitals() {
    const sendToAnalytics = (metric) => {
      // Send to your analytics service
      console.log('Web Vital:', metric)
      this.metrics.set(metric.name, metric.value)

      // Send to backend analytics service
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          non_interaction: true,
        })
      }
    }

    getCLS(sendToAnalytics)
    getFID(sendToAnalytics)
    getFCP(sendToAnalytics)
    getLCP(sendToAnalytics)
    getTTFB(sendToAnalytics)
  }

  // Component render time tracking
  trackComponentRender(componentName, renderTime) {
    const key = `component_${componentName}`
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    this.metrics.get(key).push(renderTime)
  }

  // Navigation timing
  trackNavigation() {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0]
      if (navigation) {
        this.metrics.set('navigation', {
          domContentLoaded:
            navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.navigationStart,
          firstPaint: navigation.responseEnd - navigation.requestStart,
        })
      }
    }
  }

  // Memory usage tracking
  trackMemoryUsage() {
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      const memory = window.performance.memory
      this.metrics.set('memory', {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      })
    }
  }

  // Resource loading tracking
  trackResourceLoading() {
    if (typeof window !== 'undefined') {
      const resources = performance.getEntriesByType('resource')
      const resourceMetrics = resources.map((resource) => ({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
        type: resource.initiatorType,
      }))
      this.metrics.set('resources', resourceMetrics)
    }
  }

  // Get all metrics
  getAllMetrics() {
    return Object.fromEntries(this.metrics)
  }

  // Export metrics for reporting
  exportMetrics() {
    const metrics = this.getAllMetrics()
    const report = {
      timestamp: new Date().toISOString(),
      sessionId: this.generateSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metrics: metrics,
    }
    return report
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9)
  }
}

// Performance Monitor Component
const PerformanceMonitor = ({ children, componentName = 'Unknown' }) => {
  const [metrics, setMetrics] = useState({})
  const performanceRef = useRef(new PerformanceMetrics())
  const renderStartTime = useRef(performance.now())

  useEffect(() => {
    const perf = performanceRef.current

    perf.initWebVitals()
    perf.trackNavigation()
    perf.trackMemoryUsage()
    perf.trackResourceLoading()
    setMetrics(perf.getAllMetrics())

    const refreshInterval = setInterval(() => {
      perf.trackMemoryUsage()
      perf.trackResourceLoading()
      setMetrics(perf.getAllMetrics())
    }, 15000)

    return () => {
      clearInterval(refreshInterval)
    }
  }, [])

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current
    performanceRef.current.trackComponentRender(componentName, renderTime)
  }, [componentName, renderStartTime.current])

  // Performance warning system
  useEffect(() => {
    const checkPerformance = () => {
      const currentMetrics = performanceRef.current.getAllMetrics()

      // Check for performance issues
      if (currentMetrics.memory && currentMetrics.memory.usedJSHeapSize > 50 * 1024 * 1024) {
        console.warn('High memory usage detected:', currentMetrics.memory.usedJSHeapSize)
      }

      // Check for slow components
      Object.entries(currentMetrics).forEach(([key, value]) => {
        if (key.startsWith('component_') && Array.isArray(value)) {
          const avgRenderTime = value.reduce((a, b) => a + b, 0) / value.length
          if (avgRenderTime > 16) {
            // 60fps threshold
            console.warn(`Slow component detected: ${key}, avg render time: ${avgRenderTime}ms`)
          }
        }
      })
    }

    const performanceCheckInterval = setInterval(checkPerformance, 10000)
    return () => clearInterval(performanceCheckInterval)
  }, [])

  return (
    <>
      {children}
      {isDevelopment && <PerformanceDebugPanel metrics={metrics} metricsRef={performanceRef} />}
    </>
  )
}

// Debug panel for development
const PerformanceDebugPanel = ({ metrics, metricsRef }) => {
  const [isVisible, setIsVisible] = useState(false)

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm z-50"
      >
        📊 Perf
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Performance Metrics</h3>
        <button onClick={() => setIsVisible(false)} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="border-b border-gray-200 pb-1">
            <strong>{key}:</strong>
            <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            </pre>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          const report = metricsRef.current?.exportMetrics()
          console.log('Performance Report:', report)
          navigator.clipboard?.writeText(JSON.stringify(report, null, 2))
        }}
        className="mt-2 bg-green-600 text-white px-2 py-1 rounded text-xs w-full"
      >
        Export Metrics
      </button>
    </div>
  )
}

// Higher-order component for performance tracking
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  return React.memo((props) => {
    const renderStart = performance.now()

    useEffect(() => {
      const renderTime = performance.now() - renderStart
      console.log(`${componentName} render time: ${renderTime}ms`)
    }, [])

    return <WrappedComponent {...props} />
  })
}

// Hook for performance tracking
export const usePerformanceTracking = (componentName) => {
  const renderStart = useRef(performance.now())
  const renderCountRef = useRef(0)

  useEffect(() => {
    renderCountRef.current += 1
    const renderTime = performance.now() - renderStart.current

    if (renderTime > 16) {
      console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`)
    }

    renderStart.current = performance.now()
  }, [componentName])

  return { renderCount: renderCountRef.current }
}

export default PerformanceMonitor
