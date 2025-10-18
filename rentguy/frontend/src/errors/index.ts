// FILE: rentguy/frontend/src/errors/index.ts
interface ApiErrorData {
  statusCode: number;
  errorCode: string;
  message: string;
  request?: {
    method?: string;
    url?: string;
  };
  timestamp?: string;
}

export class APIError extends Error {
  statusCode: number;
  errorCode: string;
  request?: {
    method?: string;
    url?: string;
  };
  timestamp: string;

  constructor(data: ApiErrorData) {
    super(data.message);
    this.name = 'APIError';
    this.statusCode = data.statusCode;
    this.errorCode = data.errorCode;
    this.request = data.request;
    this.timestamp = data.timestamp || new Date().toISOString();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }

  toJSON(): ApiErrorData {
    return {
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      message: this.message,
      request: this.request,
      timestamp: this.timestamp
    };
  }
}