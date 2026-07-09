import { preferences } from '@vben/preferences';

const legacyHomePaths = new Set(['/analytics', '/dashboard', '/workspace']);
const invalidHomePaths = new Set(['null', 'undefined']);

function normalizeHomePath(homePath?: string) {
  if (
    !homePath ||
    invalidHomePaths.has(homePath) ||
    legacyHomePaths.has(homePath)
  ) {
    return preferences.app.defaultHomePath;
  }

  if (homePath.startsWith('/dashboard/')) {
    return preferences.app.defaultHomePath;
  }

  return homePath;
}

function decodeRedirectPath(redirect?: (null | string)[] | null | string) {
  const redirectPath = Array.isArray(redirect)
    ? redirect.find((item): item is string => typeof item === 'string')
    : redirect;

  if (!redirectPath) {
    return undefined;
  }

  try {
    return decodeURIComponent(redirectPath);
  } catch {
    return redirectPath;
  }
}

export { decodeRedirectPath, normalizeHomePath };
