import { describe, expect, it } from 'vitest';

import { decodeRedirectPath, normalizeHomePath } from '../home-path';

describe('home-path helpers', () => {
  it('falls back to the default home path for empty values', () => {
    expect(normalizeHomePath()).toBe('/home/workspace');
    expect(normalizeHomePath('undefined')).toBe('/home/workspace');
    expect(normalizeHomePath('null')).toBe('/home/workspace');
  });

  it('normalizes legacy dashboard paths', () => {
    expect(normalizeHomePath('/dashboard/workspace')).toBe('/home/workspace');
    expect(normalizeHomePath('/workspace')).toBe('/home/workspace');
  });

  it('decodes redirect paths safely', () => {
    expect(decodeRedirectPath('%2Fhome%2Fworkspace')).toBe('/home/workspace');
    expect(decodeRedirectPath()).toBeUndefined();
    expect(decodeRedirectPath('%E0%A4%A')).toBe('%E0%A4%A');
  });
});
