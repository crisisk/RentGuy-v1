const APP_PATHS = {
  app: '/app',
  portal: '/portal',
  crew: '/crew',
};

type FrontendKey = keyof typeof APP_PATHS;

export function frontendPath(key: FrontendKey, subPath = '') {
  const base = APP_PATHS[key];
  const suffix = subPath.startsWith('/') ? subPath : `/${subPath}`;
  return `${base}${subPath ? suffix : ''}`;
}

export function resolveBaseUrl() {
  return process.env.BASE_URL ?? process.env.APP_URL_STAGING ?? process.env.APP_URL_PROD ?? 'https://staging.rentguy.sevensa.nl';
}
