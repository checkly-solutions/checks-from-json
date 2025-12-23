/**
 * Tests for assertion parser
 * Based on spec sections 6.1 and 10.1
 *
 * This is a critical algorithm that parses assertion strings like:
 * "statusCode().equals(200)" → { source: "STATUS_CODE", comparison: "EQUALS", target: "200" }
 */

import { parseAssertion } from '../src/parsers/assertion-parser';

describe('parseAssertion', () => {
  describe('STATUS_CODE assertions', () => {
    test('statusCode().equals(200)', () => {
      expect(parseAssertion('statusCode().equals(200)')).toEqual({
        source: 'STATUS_CODE',
        comparison: 'EQUALS',
        target: '200'
      });
    });

    test('statusCode().notEquals(500)', () => {
      expect(parseAssertion('statusCode().notEquals(500)')).toEqual({
        source: 'STATUS_CODE',
        comparison: 'NOT_EQUALS',
        target: '500'
      });
    });

    test('statusCode().greaterThan(199)', () => {
      expect(parseAssertion('statusCode().greaterThan(199)')).toEqual({
        source: 'STATUS_CODE',
        comparison: 'GREATER_THAN',
        target: '199'
      });
    });

    test('statusCode().lessThan(300)', () => {
      expect(parseAssertion('statusCode().lessThan(300)')).toEqual({
        source: 'STATUS_CODE',
        comparison: 'LESS_THAN',
        target: '300'
      });
    });
  });

  describe('JSON_BODY assertions', () => {
    test('jsonBody("$.code").equals("success")', () => {
      expect(parseAssertion('jsonBody("$.code").equals("success")')).toEqual({
        source: 'JSON_BODY',
        property: '$.code',
        comparison: 'EQUALS',
        target: 'success'
      });
    });

    test('jsonBody("$.items[0].price").greaterThan("10")', () => {
      expect(parseAssertion('jsonBody("$.items[0].price").greaterThan("10")')).toEqual({
        source: 'JSON_BODY',
        property: '$.items[0].price',
        comparison: 'GREATER_THAN',
        target: '10'
      });
    });

    test('jsonBody("$.product.size").hasValue("large")', () => {
      expect(parseAssertion('jsonBody("$.product.size").hasValue("large")')).toEqual({
        source: 'JSON_BODY',
        property: '$.product.size',
        comparison: 'HAS_VALUE',
        target: 'large'
      });
    });

    test('jsonBody("$.data").hasKey("id")', () => {
      expect(parseAssertion('jsonBody("$.data").hasKey("id")')).toEqual({
        source: 'JSON_BODY',
        property: '$.data',
        comparison: 'HAS_KEY',
        target: 'id'
      });
    });

    test('jsonBody("$.result").notEmpty()', () => {
      expect(parseAssertion('jsonBody("$.result").notEmpty()')).toEqual({
        source: 'JSON_BODY',
        property: '$.result',
        comparison: 'NOT_EMPTY',
        target: ''
      });
    });

    test('jsonBody("$.value").isNull()', () => {
      expect(parseAssertion('jsonBody("$.value").isNull()')).toEqual({
        source: 'JSON_BODY',
        property: '$.value',
        comparison: 'IS_NULL',
        target: ''
      });
    });
  });

  describe('HEADERS assertions', () => {
    test('headers("X-Custom").contains("Bearer")', () => {
      expect(parseAssertion('headers("X-Custom").contains("Bearer")')).toEqual({
        source: 'HEADERS',
        property: 'X-Custom',
        comparison: 'CONTAINS',
        target: 'Bearer'
      });
    });

    test('headers("Content-Type").equals("application/json")', () => {
      expect(parseAssertion('headers("Content-Type").equals("application/json")')).toEqual({
        source: 'HEADERS',
        property: 'Content-Type',
        comparison: 'EQUALS',
        target: 'application/json'
      });
    });

    test('headers("X-Auth").notEmpty()', () => {
      expect(parseAssertion('headers("X-Auth").notEmpty()')).toEqual({
        source: 'HEADERS',
        property: 'X-Auth',
        comparison: 'NOT_EMPTY',
        target: ''
      });
    });
  });

  describe('TEXT_BODY assertions', () => {
    test('textBody().contains("success")', () => {
      expect(parseAssertion('textBody().contains("success")')).toEqual({
        source: 'TEXT_BODY',
        comparison: 'CONTAINS',
        target: 'success'
      });
    });

    test('textBody().notEmpty()', () => {
      expect(parseAssertion('textBody().notEmpty()')).toEqual({
        source: 'TEXT_BODY',
        comparison: 'NOT_EMPTY',
        target: ''
      });
    });

    test('textBody().notContains("error")', () => {
      expect(parseAssertion('textBody().notContains("error")')).toEqual({
        source: 'TEXT_BODY',
        comparison: 'NOT_CONTAINS',
        target: 'error'
      });
    });

    test('textBody().isEmpty()', () => {
      expect(parseAssertion('textBody().isEmpty()')).toEqual({
        source: 'TEXT_BODY',
        comparison: 'IS_EMPTY',
        target: ''
      });
    });
  });

  describe('RESPONSE_TIME assertions', () => {
    test('responseTime().lessThan("1000")', () => {
      expect(parseAssertion('responseTime().lessThan("1000")')).toEqual({
        source: 'RESPONSE_TIME',
        comparison: 'LESS_THAN',
        target: '1000'
      });
    });

    test('responseTime().greaterThan("100")', () => {
      expect(parseAssertion('responseTime().greaterThan("100")')).toEqual({
        source: 'RESPONSE_TIME',
        comparison: 'GREATER_THAN',
        target: '100'
      });
    });

    test('responseTime().lessThan(1000) - without quotes', () => {
      expect(parseAssertion('responseTime().lessThan(1000)')).toEqual({
        source: 'RESPONSE_TIME',
        comparison: 'LESS_THAN',
        target: '1000'
      });
    });
  });

  describe('All comparison methods', () => {
    test('equals', () => {
      const result = parseAssertion('statusCode().equals(200)');
      expect(result.comparison).toBe('EQUALS');
    });

    test('notEquals', () => {
      const result = parseAssertion('statusCode().notEquals(500)');
      expect(result.comparison).toBe('NOT_EQUALS');
    });

    test('contains', () => {
      const result = parseAssertion('textBody().contains("test")');
      expect(result.comparison).toBe('CONTAINS');
    });

    test('notContains', () => {
      const result = parseAssertion('textBody().notContains("error")');
      expect(result.comparison).toBe('NOT_CONTAINS');
    });

    test('greaterThan', () => {
      const result = parseAssertion('responseTime().greaterThan(100)');
      expect(result.comparison).toBe('GREATER_THAN');
    });

    test('lessThan', () => {
      const result = parseAssertion('responseTime().lessThan(1000)');
      expect(result.comparison).toBe('LESS_THAN');
    });

    test('hasKey', () => {
      const result = parseAssertion('jsonBody("$.data").hasKey("id")');
      expect(result.comparison).toBe('HAS_KEY');
    });

    test('hasValue', () => {
      const result = parseAssertion('jsonBody("$.status").hasValue("ok")');
      expect(result.comparison).toBe('HAS_VALUE');
    });

    test('isEmpty', () => {
      const result = parseAssertion('textBody().isEmpty()');
      expect(result.comparison).toBe('IS_EMPTY');
    });

    test('notEmpty', () => {
      const result = parseAssertion('textBody().notEmpty()');
      expect(result.comparison).toBe('NOT_EMPTY');
    });

    test('isNull', () => {
      const result = parseAssertion('jsonBody("$.value").isNull()');
      expect(result.comparison).toBe('IS_NULL');
    });

    test('notNull', () => {
      const result = parseAssertion('jsonBody("$.value").notNull()');
      expect(result.comparison).toBe('NOT_NULL');
    });
  });

  describe('Edge cases', () => {
    test('handles empty arguments (methods without params)', () => {
      const result = parseAssertion('textBody().notEmpty()');
      expect(result.target).toBe('');
    });

    test('handles nested quotes in arguments', () => {
      const result = parseAssertion('jsonBody("\\"$.code\\"").equals("success")');
      expect(result.property).toContain('$.code');
    });

    test('handles arguments with special characters', () => {
      const result = parseAssertion('jsonBody("$.items[0].name").equals("Test Item")');
      expect(result.property).toBe('$.items[0].name');
      expect(result.target).toBe('Test Item');
    });

    test('strips quotes from property arguments', () => {
      const result = parseAssertion('jsonBody("$.code").equals("success")');
      expect(result.property).toBe('$.code');
      expect(result.target).toBe('success');
    });

    test('handles numeric targets', () => {
      const result = parseAssertion('statusCode().equals(200)');
      expect(result.target).toBe('200');
    });
  });
});
