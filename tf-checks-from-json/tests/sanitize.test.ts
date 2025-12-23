/**
 * Tests for sanitize utility
 * Based on spec section 7.16
 */

import { sanitize } from '../src/utils/sanitize';

describe('sanitize', () => {
  test('converts to lowercase', () => {
    expect(sanitize('Env-Observability')).toBe('env_observability');
    expect(sanitize('UPPER')).toBe('upper');
  });

  test('replaces special characters with underscores', () => {
    expect(sanitize('app@name!')).toBe('app_name');
    expect(sanitize('test#api$value')).toBe('test_api_value');
  });

  test('replaces spaces with underscores', () => {
    expect(sanitize('Env Observability')).toBe('env_observability');
    expect(sanitize('hello world')).toBe('hello_world');
  });

  test('collapses multiple underscores', () => {
    expect(sanitize('test___value')).toBe('test_value');
    expect(sanitize('a__b__c')).toBe('a_b_c');
  });

  test('removes leading and trailing underscores', () => {
    expect(sanitize('_test_')).toBe('test');
    expect(sanitize('__value__')).toBe('value');
  });

  test('handles empty string', () => {
    expect(sanitize('')).toBe('');
  });

  test('handles already sanitized strings', () => {
    expect(sanitize('already_sanitized')).toBe('already_sanitized');
    expect(sanitize('test123')).toBe('test123');
  });

  test('handles hyphens (common in app names)', () => {
    expect(sanitize('books-api')).toBe('books_api');
    expect(sanitize('multi-step-check')).toBe('multi_step_check');
  });
});
