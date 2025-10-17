import axios from 'axios';

type CheckStatus = 'healthy' | 'degraded' | 'down';

interface CheckResult {
  name: string;
  status: CheckStatus;
  latency: number;
  error?: unknown;
}

interface SystemStatus {
  status: CheckStatus;
  checks: CheckResult[];
  timestamp: Date;
}

const checkBackendHealth = async (): Promise<CheckResult> => {
  const startTime = Date.now();
  try {
    const response = await axios.get('/api/health');
    const latency = Date.now() - startTime;
    return {
      name: 'backend',
      status: response.status >= 200 && response.status < 300 ? 'healthy' : 'down',
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      name: 'backend',
      status: 'down',
      latency,
      error,
    };
  }
};

const checkDatabaseHealth = async (): Promise<CheckResult> => {
  const startTime = Date.now();
  try {
    const response = await axios.get('/api/health/database');
    const latency = Date.now() - startTime;
    return {
      name: 'database',
      status: response.status >= 200 && response.status < 300 ? 'healthy' : 'down',
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      name: 'database',
      status: 'down',
      latency,
      error,
    };
  }
};

const checkAPIEndpoints = async (): Promise<CheckResult> => {
  const endpoints = ['/api/users', '/api/products', '/api/orders'];
  const startTime = Date.now();
  
  try {
    const results = await Promise.allSettled(
      endpoints.map(endpoint => axios.get(`/api${endpoint}`))
    );

    const successful = results.filter(result => 
      result.status === 'fulfilled' && 
      result.value.status >= 200 && 
      result.value.status < 300
    ).length;

    const latency = Date.now() - startTime;
    let status: CheckStatus = 'healthy';

    if (successful === 0) {
      status = 'down';
    } else if (successful < endpoints.length) {
      status = 'degraded';
    }

    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    return {
      name: 'api_endpoints',
      status,
      latency,
      error: errors.length > 0 ? errors[0] : undefined
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      name: 'api_endpoints',
      status: 'down',
      latency,
      error,
    };
  }
};

const getSystemStatus = async (): Promise<SystemStatus> => {
  const checks = await Promise.all([
    checkBackendHealth(),
    checkDatabaseHealth(),
    checkAPIEndpoints(),
  ]);

  let status: CheckStatus = 'healthy';
  if (checks.some(check => check.status === 'down')) {
    status = 'down';
  } else if (checks.some(check => check.status === 'degraded')) {
    status = 'degraded';
  }

  return {
    status,
    checks,
    timestamp: new Date(),
  };
};

export { checkBackendHealth, checkDatabaseHealth, checkAPIEndpoints, getSystemStatus };
