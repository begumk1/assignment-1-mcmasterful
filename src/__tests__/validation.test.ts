import { describe, it, expect } from 'vitest';

describe('Basic Validation', () => {
    it('should pass basic math test', () => {
        expect(1 + 2).toBe(3);
    });

    it('should pass string test', () => {
        expect('hello' + ' world').toBe('hello world');
    });
});
