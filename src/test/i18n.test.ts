import { describe, it, expect } from 'vitest';
import { en } from '../i18n/en';
import { es } from '../i18n/es';

describe('i18n dictionaries', () => {
    it('es has every key that en has (same shape)', () => {
        const walk = (a: Record<string, unknown>, b: Record<string, unknown>, path = '') => {
            for (const key of Object.keys(a)) {
                const fullPath = path ? `${path}.${key}` : key;
                expect(b, `missing key: ${fullPath}`).toHaveProperty(key);
                const aVal = a[key];
                if (aVal && typeof aVal === 'object') {
                    walk(aVal as Record<string, unknown>, b[key] as Record<string, unknown>, fullPath);
                }
            }
        };
        walk(en, es);
    });

    it('no dictionary value is an empty string', () => {
        const walk = (dict: Record<string, unknown>) => {
            for (const value of Object.values(dict)) {
                if (typeof value === 'string') {
                    expect(value.trim().length).toBeGreaterThan(0);
                } else if (value && typeof value === 'object') {
                    walk(value as Record<string, unknown>);
                }
            }
        };
        walk(en);
        walk(es);
    });
});
