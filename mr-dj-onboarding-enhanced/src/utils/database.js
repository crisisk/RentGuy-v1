/**
 * RentGuy Enterprise - Database Optimization & Caching Layer
 * Advanced database connection pooling, query optimization, and multi-level caching
 * 
 * @author Manus AI
 * @version 1.0.0
 * @date October 2025
 */

const env = import.meta.env ?? {};

// Database connection configuration
const DB_CONFIG = {
  host: env.VITE_DB_HOST || 'localhost',
  port: env.VITE_DB_PORT || 5432,
  database: env.VITE_DB_NAME || 'rentguy_enterprise',
  user: env.VITE_DB_USER || 'rentguy_user',
  password: env.VITE_DB_PASSWORD || '',
  
  // Connection pool settings
  pool: {
    min: 2,
    max: 20,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
  
  // Performance optimizations
  options: {
    enableArithAbort: true,
    trustServerCertificate: true,
    requestTimeout: 30000,
    connectionTimeout: 30000,
  }
};

/**
 * Multi-level caching system
 */
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.sessionCache = sessionStorage;
    this.localCache = localStorage;
    this.maxMemorySize = 100; // Maximum items in memory cache
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
  }

  /**
   * Generate cache key from query and parameters
   */
  generateKey(query, params = {}) {
    const normalizedQuery = query.replace(/\s+/g, ' ').trim().toLowerCase();
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    return `${normalizedQuery}:${paramString}`;
  }

  /**
   * Get cached data with TTL check
   */
  get(key, level = 'memory') {
    try {
      let cached;
      
      switch (level) {
        case 'memory':
          cached = this.memoryCache.get(key);
          break;
        case 'session':
          cached = JSON.parse(this.sessionCache.getItem(key) || 'null');
          break;
        case 'local':
          cached = JSON.parse(this.localCache.getItem(key) || 'null');
          break;
        default:
          return null;
      }

      if (!cached) return null;

      // Check TTL
      if (cached.expires && Date.now() > cached.expires) {
        this.delete(key, level);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.warn(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  set(key, data, ttl = this.defaultTTL, level = 'memory') {
    try {
      const cached = {
        data,
        expires: Date.now() + ttl,
        created: Date.now(),
      };

      switch (level) {
        case 'memory':
          // Implement LRU eviction if cache is full
          if (this.memoryCache.size >= this.maxMemorySize) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
          }
          this.memoryCache.set(key, cached);
          break;
        case 'session':
          this.sessionCache.setItem(key, JSON.stringify(cached));
          break;
        case 'local':
          this.localCache.setItem(key, JSON.stringify(cached));
          break;
      }
    } catch (error) {
      console.warn(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete cached data
   */
  delete(key, level = 'memory') {
    try {
      switch (level) {
        case 'memory':
          this.memoryCache.delete(key);
          break;
        case 'session':
          this.sessionCache.removeItem(key);
          break;
        case 'local':
          this.localCache.removeItem(key);
          break;
      }
    } catch (error) {
      console.warn(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Clear all caches
   */
  clear(level = 'all') {
    try {
      if (level === 'all' || level === 'memory') {
        this.memoryCache.clear();
      }
      if (level === 'all' || level === 'session') {
        Object.keys(this.sessionCache).forEach(key => {
          if (key.startsWith('rentguy_')) {
            this.sessionCache.removeItem(key);
          }
        });
      }
      if (level === 'all' || level === 'local') {
        Object.keys(this.localCache).forEach(key => {
          if (key.startsWith('rentguy_')) {
            this.localCache.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memory: {
        size: this.memoryCache.size,
        maxSize: this.maxMemorySize,
        keys: Array.from(this.memoryCache.keys()),
      },
      session: {
        size: Object.keys(this.sessionCache).filter(k => k.startsWith('rentguy_')).length,
      },
      local: {
        size: Object.keys(this.localCache).filter(k => k.startsWith('rentguy_')).length,
      },
    };
  }
}

/**
 * Database query optimizer
 */
class QueryOptimizer {
  constructor() {
    this.queryStats = new Map();
    this.slowQueryThreshold = 1000; // 1 second
  }

  /**
   * Analyze and optimize query
   */
  optimizeQuery(query, params = {}) {
    // Add query hints and optimizations
    let optimizedQuery = query;

    // Add indexes hints for common patterns
    if (query.includes('WHERE') && query.includes('equipment')) {
      optimizedQuery = optimizedQuery.replace(
        'FROM equipment',
        'FROM equipment USE INDEX (idx_equipment_status, idx_equipment_category)'
      );
    }

    // Add LIMIT if not present for large result sets
    if (!query.includes('LIMIT') && query.includes('SELECT')) {
      optimizedQuery += ' LIMIT 1000';
    }

    return {
      query: optimizedQuery,
      params,
      hints: this.generateQueryHints(query),
    };
  }

  /**
   * Generate performance hints for query
   */
  generateQueryHints(query) {
    const hints = [];

    if (query.includes('SELECT *')) {
      hints.push('Consider selecting only required columns instead of SELECT *');
    }

    if (query.includes('ORDER BY') && !query.includes('LIMIT')) {
      hints.push('Consider adding LIMIT when using ORDER BY for better performance');
    }

    if (query.includes('JOIN') && !query.includes('WHERE')) {
      hints.push('Consider adding WHERE clause to filter JOIN results');
    }

    return hints;
  }

  /**
   * Record query performance
   */
  recordQueryPerformance(query, duration, resultCount) {
    const key = query.replace(/\s+/g, ' ').trim();
    
    if (!this.queryStats.has(key)) {
      this.queryStats.set(key, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        resultCounts: [],
      });
    }

    const stats = this.queryStats.get(key);
    stats.count++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.count;
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.resultCounts.push(resultCount);

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn('Slow query detected:', {
        query: key.substring(0, 100) + '...',
        duration,
        resultCount,
        suggestions: this.generateQueryHints(query),
      });
    }
  }

  /**
   * Get query performance statistics
   */
  getQueryStats() {
    const stats = {};
    this.queryStats.forEach((value, key) => {
      stats[key.substring(0, 50) + '...'] = {
        ...value,
        avgResultCount: value.resultCounts.reduce((a, b) => a + b, 0) / value.resultCounts.length,
      };
    });
    return stats;
  }
}

/**
 * Main database service with caching and optimization
 */
class DatabaseService {
  constructor() {
    this.cache = new CacheManager();
    this.optimizer = new QueryOptimizer();
    this.connectionPool = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      // In a real implementation, this would establish actual database connections
      console.log('Database service initialized with config:', {
        host: DB_CONFIG.host,
        database: DB_CONFIG.database,
        poolSize: `${DB_CONFIG.pool.min}-${DB_CONFIG.pool.max}`,
      });
      
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Execute query with caching and optimization
   */
  async query(sql, params = {}, options = {}) {
    const startTime = performance.now();
    
    try {
      // Generate cache key
      const cacheKey = this.cache.generateKey(sql, params);
      
      // Check cache first (unless disabled)
      if (!options.skipCache) {
        const cached = this.cache.get(cacheKey, options.cacheLevel || 'memory');
        if (cached) {
          console.log('Cache hit for query:', sql.substring(0, 50) + '...');
          return cached;
        }
      }

      // Optimize query
      const optimized = this.optimizer.optimizeQuery(sql, params);
      
      // Execute query (simulated for frontend)
      const result = await this.executeQuery(optimized.query, optimized.params);
      
      // Cache result
      if (!options.skipCache && result) {
        this.cache.set(
          cacheKey, 
          result, 
          options.cacheTTL || this.cache.defaultTTL,
          options.cacheLevel || 'memory'
        );
      }

      // Record performance
      const duration = performance.now() - startTime;
      this.optimizer.recordQueryPerformance(sql, duration, result?.length || 0);

      return result;
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Simulated query execution (replace with actual database calls)
   */
  async executeQuery(sql) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    // Return mock data based on query type
    if (sql.includes('equipment')) {
      return this.getMockEquipmentData();
    } else if (sql.includes('users')) {
      return this.getMockUserData();
    } else if (sql.includes('bookings')) {
      return this.getMockBookingData();
    }
    
    return [];
  }

  /**
   * Mock data generators
   */
  getMockEquipmentData() {
    return [
      { id: 1, name: 'Professional DJ Mixer', category: 'Audio', status: 'available', price: 150 },
      { id: 2, name: 'LED Light System', category: 'Lighting', status: 'rented', price: 200 },
      { id: 3, name: 'Wireless Microphone Set', category: 'Audio', status: 'available', price: 75 },
    ];
  }

  getMockUserData() {
    return [
      { id: 1, name: 'Bart van de Weijer', email: 'bart@mr-dj.nl', role: 'admin' },
      { id: 2, name: 'Test User', email: 'test@example.com', role: 'user' },
    ];
  }

  getMockBookingData() {
    return [
      { id: 1, equipment_id: 1, user_id: 1, start_date: '2025-10-05', end_date: '2025-10-06', status: 'confirmed' },
      { id: 2, equipment_id: 2, user_id: 2, start_date: '2025-10-07', end_date: '2025-10-08', status: 'pending' },
    ];
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      isConnected: this.isConnected,
      cache: this.cache.getStats(),
      queries: this.optimizer.getQueryStats(),
      config: {
        host: DB_CONFIG.host,
        database: DB_CONFIG.database,
        poolSize: `${DB_CONFIG.pool.min}-${DB_CONFIG.pool.max}`,
      },
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Close database connections
   */
  async close() {
    try {
      this.isConnected = false;
      console.log('Database connections closed');
    } catch (error) {
      console.error('Error closing database connections:', error);
    }
  }
}

// Export singleton instance
export const dbService = new DatabaseService();

// Export classes for testing
export { CacheManager, QueryOptimizer, DatabaseService };

// Initialize on module load
if (typeof window !== 'undefined') {
  dbService.initialize();
}

export default dbService;
