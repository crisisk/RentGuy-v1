import { v4 as uuidv4 } from 'uuid';

export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface ErrorContext {
  [key: string]: unknown;
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

type StoredError = {
  id: string;
  message: string;
  stack: string[];
  context?: ErrorContext;
  timestamp: number;
};

const STORAGE_KEYS = {
  errors: 'error_tracking_errors',
  breadcrumbs: 'error_tracking_breadcrumbs',
} as const;

const isBrowserEnvironment = (): boolean =>
  typeof window !== 'undefined' && typeof window.addEventListener === 'function';

const ensureStorageAvailability = (): boolean => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return false;
  }

  try {
    const testKey = '__error_tracking__';
    window.localStorage.setItem(testKey, 'ok');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('[ErrorTracking] Local storage unavailable', error);
    return false;
  }
};

class ErrorTrackingService {
  private initialized = false;
  private user: User | null = null;
  private breadcrumbs: Breadcrumb[] = [];
  private storageAvailable = false;

  initErrorTracking(): void {
    if (this.initialized) {
      console.debug('[ErrorTracking] Initialization skipped – already initialized');
      return;
    }

    if (!isBrowserEnvironment()) {
      console.warn('[ErrorTracking] Initialization skipped – browser APIs unavailable');
      return;
    }

    try {
      console.log('[ErrorTracking] Initializing error tracking');
      this.storageAvailable = ensureStorageAvailability();
      window.addEventListener('error', this.handleGlobalError);
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
      this.initialized = true;
    } catch (error) {
      console.error('[ErrorTracking] Initialization failed', error);
    }
  }

  teardown(): void {
    if (!this.initialized || !isBrowserEnvironment()) {
      return;
    }

    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    this.initialized = false;
    this.storageAvailable = false;
  }

  captureError(error: unknown, context?: ErrorContext): void {
    if (!this.initialized) {
      return;
    }

    const normalizedError = this.normalizeError(error);
    const errorId = uuidv4();
    const stackTrace = this.parseErrorStack(normalizedError);
    const payloadContext: ErrorContext = {
      ...context,
      user: this.user ?? undefined,
    };

    console.error(`[ErrorTracking] Error (${errorId}):`, normalizedError.message, {
      stack: stackTrace,
      context: payloadContext,
    });

    this.addBreadcrumb({
      message: `Error: ${normalizedError.message}`,
      category: 'error',
      level: ErrorLevel.ERROR,
    });

    this.persistErrorToLocalStorage({
      id: errorId,
      message: normalizedError.message,
      stack: stackTrace,
      context: payloadContext,
      timestamp: Date.now(),
    });
  }

  captureMessage(message: string, level: ErrorLevel = ErrorLevel.INFO): void {
    if (!this.initialized) {
      return;
    }

    console.log(`[ErrorTracking] ${level.toUpperCase()}: ${message}`);

    this.addBreadcrumb({
      message,
      level,
    });
  }

  addBreadcrumb(crumb: Breadcrumb): void {
    const enrichedCrumb: Breadcrumb = {
      ...crumb,
      timestamp: Date.now(),
    };

    this.breadcrumbs.push(enrichedCrumb);

    if (this.breadcrumbs.length > 100) {
      this.breadcrumbs.shift();
    }

    this.persistBreadcrumbsToLocalStorage();
  }

  setUser(user: User | null): void {
    this.user = user;
    console.log('[ErrorTracking] User context set:', user);
  }

  private handleGlobalError = (event: ErrorEvent): void => {
    this.captureError(new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    this.captureError(event.reason);
  };

  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    try {
      return new Error(JSON.stringify(error));
    } catch {
      return new Error('Unknown error');
    }
  }

  private parseErrorStack(error: Error): string[] {
    return (error.stack || '')
      .split('\n')
      .slice(1)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  private readStoredErrors(): StoredError[] {
    if (!this.storageAvailable) {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.errors);
      return raw ? (JSON.parse(raw) as StoredError[]) : [];
    } catch (storageError) {
      console.warn('[ErrorTracking] Failed to read stored errors', storageError);
      return [];
    }
  }

  private persistErrorToLocalStorage(error: StoredError): void {
    if (!this.storageAvailable) {
      return;
    }

    try {
      const errors = [...this.readStoredErrors(), error];
      window.localStorage.setItem(
        STORAGE_KEYS.errors,
        JSON.stringify(errors.slice(-50))
      );
    } catch (storageError) {
      console.warn('[ErrorTracking] Local storage error', storageError);
    }
  }

  private persistBreadcrumbsToLocalStorage(): void {
    if (!this.storageAvailable) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEYS.breadcrumbs,
        JSON.stringify(this.breadcrumbs)
      );
    } catch (storageError) {
      console.warn('[ErrorTracking] Breadcrumb storage error', storageError);
    }
  }
}

export const ErrorTracking = new ErrorTrackingService();
