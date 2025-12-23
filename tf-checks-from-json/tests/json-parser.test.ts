/**
 * Tests for JSON parser
 * Based on spec section 7.3
 */

import { parseUrlListJson, validateSchema, validateCheckCategory } from '../src/parsers/json-parser';
import * as fs from 'fs';
import * as path from 'path';

describe('parseUrlListJson', () => {
  const testDataDir = path.join(__dirname, '../src/urlList');

  test('parses valid urlList.json correctly', async () => {
    const filePath = path.join(testDataDir, 'urlList.json');
    const apps = await parseUrlListJson(filePath);

    expect(Array.isArray(apps)).toBe(true);
    expect(apps.length).toBeGreaterThan(0);
    expect(apps[0]).toHaveProperty('appName');
    expect(apps[0]).toHaveProperty('app1');
    expect(apps[0]).toHaveProperty('app2');
    expect(apps[0]).toHaveProperty('app3');
    expect(apps[0]).toHaveProperty('app4');
  });

  test('throws error when file does not exist', async () => {
    await expect(parseUrlListJson('nonexistent.json')).rejects.toThrow();
  });

  test('throws error for invalid JSON syntax', async () => {
    const invalidJson = path.join(__dirname, 'fixtures/invalid.json');
    const dir = path.dirname(invalidJson);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(invalidJson, '{ invalid json }');

    await expect(parseUrlListJson(invalidJson)).rejects.toThrow();

    // Cleanup
    fs.unlinkSync(invalidJson);
  });
});

describe('validateSchema', () => {
  test('validates correct schema', () => {
    const data = [{
      appName: 'TestApp',
      app1: [],
      app2: [],
      app3: [],
      app4: []
    }];

    expect(() => validateSchema(data)).not.toThrow();
  });

  test('throws error when root is not an array', () => {
    const data = { appName: 'test' };
    expect(() => validateSchema(data)).toThrow('Root must be an array');
  });

  test('throws error when appName is missing', () => {
    const data = [{
      app1: [],
      app2: [],
      app3: [],
      app4: []
    }];

    expect(() => validateSchema(data)).toThrow('appName must be a string');
  });

  test('throws error when tier is missing', () => {
    const data = [{
      appName: 'TestApp',
      app1: [],
      app2: []
      // app3 and app4 missing
    }];

    expect(() => validateSchema(data as any)).toThrow('must be an array');
  });

  test('throws error when tier is not an array', () => {
    const data = [{
      appName: 'TestApp',
      app1: 'not an array',
      app2: [],
      app3: [],
      app4: []
    }];

    expect(() => validateSchema(data as any)).toThrow('app1 must be an array');
  });

  test('validates empty tier arrays', () => {
    const data = [{
      appName: 'TestApp',
      app1: [],
      app2: [],
      app3: [],
      app4: []
    }];

    expect(() => validateSchema(data)).not.toThrow();
  });
});

describe('validateCheckCategory', () => {
  test('validates API check with all required fields', () => {
    const category = {
      api_check: [{
        url: 'https://api.test.com',
        method: 'GET',
        frequency: 5,
        activated: true,
        urlShort: 'test-api',
        assertions: [['statusCode().equals(200)']]
      }]
    };

    expect(() => validateCheckCategory(category)).not.toThrow();
  });

  test('validates browser check with all required fields', () => {
    const category = {
      browser_check: [{
        filePath: '/browser-scripts/test.spec.ts',
        frequency: 10,
        activated: true,
        urlShort: 'test-browser'
      }]
    };

    expect(() => validateCheckCategory(category)).not.toThrow();
  });

  test('validates multi-step check with all required fields', () => {
    const category = {
      multi_check: [{
        filePath: '/multi-scripts/test.spec.ts',
        frequency: 15,
        activated: false,
        urlShort: 'test-multi'
      }]
    };

    expect(() => validateCheckCategory(category)).not.toThrow();
  });

  test('throws error when API check is missing required field', () => {
    const category = {
      api_check: [{
        url: 'https://api.test.com',
        method: 'GET'
        // Missing frequency, activated, urlShort, assertions
      }]
    };

    expect(() => validateCheckCategory(category)).toThrow('Missing required field');
  });
});
