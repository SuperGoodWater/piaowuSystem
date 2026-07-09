import { preferences } from '@vben/preferences';

const legacyHomePaths = new Set(['/analytics', '/dashboard', '/workspace']);

function normalizeHomePath(homePath?: string) {
  if (!homePath || legacyHomePaths.has(homePath)) {
    return preferences.app.defaultHomePath;
  }

  if (homePath.startsWith('/dashboard/')) {
    return preferences.app.defaultHomePath;
  }

  return homePath;
}

export { normalizeHomePath };
