/**
 * Tests for validation utility
 */

import { validateRequiredFields } from '../src/utils/validation';

describe('validateRequiredFields', () => {
  test('passes when all required fields are present', () => {
    const obj = { name: 'test', url: 'http://example.com', method: 'GET' };
    expect(() => {
      validateRequiredFields(obj, ['name', 'url', 'method']);
    }).not.toThrow();
  });

  test('throws when a field is missing', () => {
    const obj = { name: 'test' };
    expect(() => {
      validateRequiredFields(obj, ['name', 'url']);
    }).toThrow('Missing required field: url');
  });

  test('throws when a field is undefined', () => {
    const obj = { name: 'test', url: undefined };
    expect(() => {
      validateRequiredFields(obj, ['name', 'url']);
    }).toThrow('Missing required field: url');
  });

  test('throws when a field is null', () => {
    const obj = { name: 'test', url: null };
    expect(() => {
      validateRequiredFields(obj, ['name', 'url']);
    }).toThrow('Missing required field: url');
  });

  test('passes with empty fields array', () => {
    const obj = { name: 'test' };
    expect(() => {
      validateRequiredFields(obj, []);
    }).not.toThrow();
  });

  test('accepts fields with falsy but valid values', () => {
    const obj = { name: 'test', count: 0, active: false, value: '' };
    expect(() => {
      validateRequiredFields(obj, ['name', 'count', 'active', 'value']);
    }).not.toThrow();
  });
});
