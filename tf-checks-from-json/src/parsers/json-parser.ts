/**
 * JSON parser for urlList.json
 * Based on spec section 7.3
 */

import * as fs from 'fs';
import { AppConfig } from '../types/urlList.types';
import { validateRequiredFields } from '../utils/validation';

/**
 * Parse and validate urlList.json file
 *
 * @param filePath - Path to urlList.json file
 * @returns Array of validated AppConfig objects
 * @throws Error if file doesn't exist, JSON is invalid, or schema validation fails
 *
 * @example
 * const apps = await parseUrlListJson('src/urlList/urlList.json')
 * console.log(`Parsed ${apps.length} apps`)
 */
export async function parseUrlListJson(filePath: string): Promise<AppConfig[]> {
  // 1. Read file
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `urlList.json not found at path: ${filePath}\n` +
      `Tip: Ensure urlList.json exists in the src/urlList/ directory`
    );
  }

  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to read urlList.json: ${(error as Error).message}\n` +
      `Path: ${filePath}`
    );
  }

  // Check if file is empty
  if (content.trim().length === 0) {
    throw new Error(
      `urlList.json is empty: ${filePath}\n` +
      `Tip: Add at least one application configuration to the file`
    );
  }

  // 2. Parse JSON
  let data: any;
  try {
    data = JSON.parse(content);
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `Invalid JSON syntax in urlList.json: ${err.message}\n` +
      `Path: ${filePath}\n` +
      `Tip: Check for missing commas, brackets, or quotes`
    );
  }

  // 3. Validate schema
  try {
    validateSchema(data);
  } catch (error) {
    throw new Error(
      `Schema validation failed:\n${(error as Error).message}\n` +
      `Path: ${filePath}`
    );
  }

  // 4. Return typed data
  return data as AppConfig[];
}

/**
 * Validate urlList.json schema
 *
 * @param data - Parsed JSON data
 * @throws Error if schema validation fails
 */
export function validateSchema(data: any): void {
  // Validate root is array
  if (!Array.isArray(data)) {
    throw new Error(
      'Root must be an array of application configurations\n' +
      `Found: ${typeof data}\n` +
      `Expected: [ { appName: "...", app1: [...], ... }, ... ]`
    );
  }

  if (data.length === 0) {
    throw new Error(
      'Root array is empty\n' +
      `Tip: Add at least one application configuration`
    );
  }

  // Validate each app
  for (let i = 0; i < data.length; i++) {
    const app = data[i];
    const appContext = `Application #${i + 1}`;

    if (typeof app.appName !== 'string') {
      throw new Error(
        `${appContext}: appName must be a string\n` +
        `Found: ${typeof app.appName}`
      );
    }

    if (app.appName.trim().length === 0) {
      throw new Error(
        `${appContext}: appName cannot be empty\n` +
        `Tip: Provide a meaningful application name`
      );
    }

    // Validate tiers exist
    for (const tier of ['app1', 'app2', 'app3', 'app4']) {
      if (!Array.isArray(app[tier])) {
        throw new Error(
          `${appContext} ("${app.appName}"): ${tier} must be an array\n` +
          `Found: ${typeof app[tier]}\n` +
          `Tip: Use an empty array [] if this tier has no checks`
        );
      }
    }

    // Validate checks in each tier
    for (const tier of ['app1', 'app2', 'app3', 'app4']) {
      for (let j = 0; j < app[tier].length; j++) {
        const checkCategory = app[tier][j];
        const checkContext = `${appContext} ("${app.appName}") → ${tier} → check category #${j + 1}`;

        try {
          validateCheckCategory(checkCategory);
        } catch (error) {
          throw new Error(
            `${checkContext}:\n${(error as Error).message}`
          );
        }
      }
    }
  }
}

/**
 * Validate a check category object
 *
 * @param category - Check category object
 * @throws Error if validation fails
 */
export function validateCheckCategory(category: any): void {
  // Validate API checks
  if (category.api_check) {
    for (const check of category.api_check) {
      validateRequiredFields(check, [
        'url',
        'method',
        'frequency',
        'activated',
        'urlShort',
        'assertions'
      ]);
    }
  }

  // Validate Browser checks
  if (category.browser_check) {
    for (const check of category.browser_check) {
      validateRequiredFields(check, [
        'filePath',
        'frequency',
        'activated',
        'urlShort'
      ]);
    }
  }

  // Validate Multi-step checks
  if (category.multi_check) {
    for (const check of category.multi_check) {
      validateRequiredFields(check, [
        'filePath',
        'frequency',
        'activated',
        'urlShort'
      ]);
    }
  }
}
