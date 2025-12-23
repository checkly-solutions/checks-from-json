/**
 * Tests for script loader
 * Based on spec section 7.5
 */

import { loadScript } from '../src/parsers/script-loader';
import * as fs from 'fs';
import * as path from 'path';

describe('loadScript', () => {
  test('loads actual browser script correctly', () => {
    const scriptPath = '/browser-scripts/visit.spec.ts';
    const content = loadScript(scriptPath);

    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('test(');  // Playwright test function
  });

  test('loads actual multi-step script correctly', () => {
    const scriptPath = '/multi-scripts/multi-CRUD.spec.ts';
    const content = loadScript(scriptPath);

    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('test(');  // Playwright test function
  });

  test('throws error when script file does not exist', () => {
    expect(() => {
      loadScript('/browser-scripts/nonexistent.spec.ts');
    }).toThrow('Script file not found');
  });

  test('handles special characters in script content', () => {
    // Create a temporary script with special characters
    const testScriptPath = '/browser-scripts/test-special.spec.ts';
    const testContent = 'const str = "test \\"quoted\\" string"; // comment\n`backticks`';
    const fullPath = path.join(process.cwd(), `src${testScriptPath}`);

    fs.writeFileSync(fullPath, testContent);

    const content = loadScript(testScriptPath);
    expect(content).toBe(testContent);

    // Cleanup
    fs.unlinkSync(fullPath);
  });

  test('preserves exact file content', () => {
    const scriptPath = '/browser-scripts/visit.spec.ts';
    const fullPath = path.join(process.cwd(), `src${scriptPath}`);
    const expectedContent = fs.readFileSync(fullPath, 'utf-8');

    const actualContent = loadScript(scriptPath);
    expect(actualContent).toBe(expectedContent);
  });
});
