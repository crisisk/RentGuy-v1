Here's a comprehensive TypeScript error tracking utility:


import { v4 as uuidv4 } from 'uuid';

export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface ErrorContext {
  [key: string]: any;
}

export interface User {
  id: string;
  email?: string;
  username?: string;
}

export interface Breadcrumb {
  message: string;
  category?: string;
  level?: ErrorLevel;
  timestamp?: number;
}

class ErrorTrackingService {
  private initialized: boolean = false;
  private user: User | null = null;
  private breadcrumbs: Breadcrumb[] = [];

  initErrorTracking(): void {
    try {
      // Mock initialization
      console.log('[ErrorTracking] Initializing error tracking');
      this.initialized = true;

      // Setup global error handler
      window.addEventListener('error', this.handleGlobalError);
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    } catch (error) {
      console.error('[ErrorTracking] Initialization failed', error);
    }
  }

  private handleGlobalError = (event: ErrorEvent): void => {
    this.captureError(
      new Error(event.message),
      { 
        filename: event.filename, 
        lineno: event.lineno, 
        colno: event.colno 
      }
    );
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    this.captureError(
      event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason))
    );
  }

  captureError(error: Error, context?: ErrorContext): void {
    if (!this.initialized) return;

    const errorId = uuidv4();
    const stackTrace = this.parseErrorStack(error);

    console.error(`[ErrorTracking] Error (${errorId}):`, error.message, {
      stack: stackTrace,
      context: context || {}
    });

    this.addBreadcrumb({
      message: `Error: ${error.message}`,
      category: 'error',
      level: ErrorLevel.ERROR
    });

    // Mock remote error logging
    this.persistErrorToLocalStorage(errorId, error, context);
  }

  captureMessage(message: string, level: ErrorLevel = ErrorLevel.INFO): void {
    if (!this.initialized) return;

    console.log(`[ErrorTracking] ${level.toUpperCase()}: ${message}`);

    this.addBreadcrumb({
      message,
      level
    });
  }

  addBreadcrumb(crumb: Breadcrumb): void {
    const enrichedCrumb: Breadcrumb = {
      ...crumb,
      timestamp: Date.now()
    };

    this.breadcrumbs.push(enrichedCrumb);

    // Limit breadcrumbs to last 100
    if (this.breadcrumbs.length > 100) {
      this.breadcrumbs.shift();
    }

    this.persistBreadcrumbsToLocalStorage();
  }

  setUser(user: User | null): void {
    this.user = user;
    console.log('[ErrorTracking] User context set:', user);
  }

  private parseErrorStack(error: Error): string[] {
    return (error.stack || '')
      .split('\n')
      .slice(1)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  private persistErrorToLocalStorage(
    errorId: string, 
    error: Error, 
    context?: ErrorContext
  ): void {
    try {
      const errors = JSON.parse(
        localStorage.getItem('error_tracking_errors') || '[]'
      );
      
      errors.push({
        id: errorId,
        message: error.message,
        stack: this.parseErrorStack(error),
        context,
        timestamp: Date.now()
      });

      localStorage.setItem(
        'error_tracking_errors', 
        JSON.stringify(errors.slice(-50))
      );
    } catch (storageError) {
      console.warn('[ErrorTracking] Local storage error', storageError);
    }
  }

  private persistBreadcrumbsToLocalStorage(): void {
    try {
      localStorage.setItem(
        'error_tracking_breadcrumbs', 
        JSON.stringify(this.breadcrumbs)
      );
    } catch (storageError) {
      console.warn('[ErrorTracking] Breadcrumb storage error', storageError);
    }
  }
}

export const ErrorTracking = new ErrorTrackingService();


This implementation provides a robust mock error tracking service with:
- Initialization with global error handlers
- Error and message capturing
- Breadcrumb tracking
- User context management
- Local storage persistence
- UUIDs for error tracking
- TypeScript typing
- Console logging
- Error stack parsing

Usage example:

import { ErrorTracking, ErrorLevel } from './errorTracking';

ErrorTracking.initErrorTracking();
ErrorTracking.setUser({ id: '123', email: 'user@example.com' });

try {
  throw new Error('Test error');
} catch (error) {
  ErrorTracking.captureError(error, { component: 'LoginForm' });
}

ErrorTracking.captureMessage('User logged in', ErrorLevel.INFO);
