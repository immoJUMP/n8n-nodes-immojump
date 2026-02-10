import { describe, expect, it } from 'vitest';
import { sanitizeEmail } from '../nodes/Immojump/resources/contact/index';

describe('sanitizeEmail', () => {
	it('returns undefined for empty values', () => {
		expect(sanitizeEmail(undefined)).toBeUndefined();
		expect(sanitizeEmail(null)).toBeUndefined();
		expect(sanitizeEmail('')).toBeUndefined();
		expect(sanitizeEmail('   ')).toBeUndefined();
	});

	it('trims whitespace', () => {
		expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
	});

	it('strips a leading equals sign', () => {
		expect(sanitizeEmail('=test@example.com')).toBe('test@example.com');
	});

	it('keeps inner equals signs intact', () => {
		expect(sanitizeEmail('a=b@example.com')).toBe('a=b@example.com');
	});
});
