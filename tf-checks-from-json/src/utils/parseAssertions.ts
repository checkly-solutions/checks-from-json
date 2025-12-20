/**
 * Utilities for parsing assertion strings from CLI format
 * Reuses the parsing logic from the CLI implementation to extract assertion components
 */

import { ParsedAssertion } from '../types/terraform-types';

/**
 * Parse an assertion string from CLI format into its component parts
 *
 * The CLI uses a fluent API format like: statusCode().equals(200)
 * This function parses it into: { sourceMethod: 'statusCode', comparisonMethod: 'equals', comparisonArgs: '200' }
 *
 * @param assertionString - The assertion string in CLI format
 * @returns Parsed assertion components
 *
 * @example
 * parseAssertion("statusCode().equals(200)")
 * // Returns: { sourceMethod: 'statusCode', sourceArgs: '', comparisonMethod: 'equals', comparisonArgs: '200' }
 *
 * parseAssertion("jsonBody().contains('data')")
 * // Returns: { sourceMethod: 'jsonBody', sourceArgs: '', comparisonMethod: 'contains', comparisonArgs: "'data'" }
 *
 * parseAssertion("jsonBody('$.user.name').equals('John')")
 * // Returns: { sourceMethod: 'jsonBody', sourceArgs: "'$.user.name'", comparisonMethod: 'equals', comparisonArgs: "'John'" }
 */
export function parseAssertion(assertionString: string): ParsedAssertion {
  // Use regex to match method calls with arguments
  // Format: methodName(arguments)
  const regex = /([a-zA-Z0-9_$]+)\(([^)]*)\)/g;
  const matches = Array.from(assertionString.matchAll(regex));

  if (matches.length < 1) {
    throw new Error(`Invalid assertion format: ${assertionString}`);
  }

  // First match is the source (e.g., statusCode(), jsonBody('$.path'))
  const sourceMatch = matches[0];
  const sourceMethod = sourceMatch[1];
  const sourceArgs = sourceMatch[2] || '';

  // Second match is the comparison (e.g., equals(200), contains('data'))
  let comparisonMethod = '';
  let comparisonArgs = '';

  if (matches.length >= 2) {
    const comparisonMatch = matches[1];
    comparisonMethod = comparisonMatch[1];
    comparisonArgs = comparisonMatch[2] || '';
  } else {
    // If there's only one match, it might be a single-method assertion
    // For now, we'll require two methods (source and comparison)
    throw new Error(`Assertion missing comparison method: ${assertionString}`);
  }

  return {
    sourceMethod,
    sourceArgs,
    comparisonMethod,
    comparisonArgs,
  };
}

/**
 * Clean assertion arguments by removing surrounding quotes
 * Assertion arguments often come with quotes that need to be removed
 *
 * @param args - The argument string (may include quotes)
 * @returns Cleaned argument string
 *
 * @example
 * cleanAssertionArgs("'200'") // "200"
 * cleanAssertionArgs('"data"') // "data"
 * cleanAssertionArgs("200") // "200"
 */
export function cleanAssertionArgs(args: string): string {
  return args.replace(/^['"]|['"]$/g, '');
}
