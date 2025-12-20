/**
 * Utilities for mapping CLI assertion format to Terraform assertion blocks
 * Converts from fluent API style to Terraform HCL block structure
 */

import { ParsedAssertion, TerraformAssertion } from '../types/terraform-types';
import { cleanAssertionArgs } from './parseAssertions';
import {
  ASSERTION_SOURCE_MAP,
  ASSERTION_COMPARISON_MAP,
} from '../config/constants';

/**
 * Map a parsed CLI assertion to Terraform assertion format
 *
 * @param parsed - The parsed assertion from parseAssertion()
 * @returns Terraform assertion configuration
 *
 * @example
 * mapAssertionToTerraform({
 *   sourceMethod: 'statusCode',
 *   sourceArgs: '',
 *   comparisonMethod: 'equals',
 *   comparisonArgs: '200'
 * })
 * // Returns: { source: 'STATUS_CODE', comparison: 'EQUALS', target: '200' }
 *
 * mapAssertionToTerraform({
 *   sourceMethod: 'jsonBody',
 *   sourceArgs: "'$.user.name'",
 *   comparisonMethod: 'equals',
 *   comparisonArgs: "'John'"
 * })
 * // Returns: { source: 'JSON_BODY', property: '$.user.name', comparison: 'EQUALS', target: 'John' }
 */
export function mapAssertionToTerraform(
  parsed: ParsedAssertion
): TerraformAssertion {
  // Map source method to Terraform source constant
  const source =
    ASSERTION_SOURCE_MAP[parsed.sourceMethod as keyof typeof ASSERTION_SOURCE_MAP];

  if (!source) {
    throw new Error(`Unknown assertion source method: ${parsed.sourceMethod}`);
  }

  // Map comparison method to Terraform comparison constant
  const comparison =
    ASSERTION_COMPARISON_MAP[parsed.comparisonMethod as keyof typeof ASSERTION_COMPARISON_MAP];

  if (!comparison) {
    throw new Error(`Unknown assertion comparison method: ${parsed.comparisonMethod}`);
  }

  // Clean the target value (remove quotes)
  const target = cleanAssertionArgs(parsed.comparisonArgs);

  // Build the base assertion
  const assertion: TerraformAssertion = {
    source,
    comparison,
    target,
  };

  // If the source method had arguments, it's likely a property path (for JSON or headers)
  if (parsed.sourceArgs) {
    assertion.property = cleanAssertionArgs(parsed.sourceArgs);
  }

  return assertion;
}

/**
 * Generate HCL assertion block from Terraform assertion config
 *
 * @param assertion - The Terraform assertion configuration
 * @param indent - Number of spaces to indent (default: 4)
 * @returns HCL assertion block as a string
 *
 * @example
 * generateAssertionBlock({ source: 'STATUS_CODE', comparison: 'EQUALS', target: '200' })
 * // Returns:
 * //     assertion {
 * //       source     = "STATUS_CODE"
 * //       comparison = "EQUALS"
 * //       target     = "200"
 * //     }
 */
export function generateAssertionBlock(
  assertion: TerraformAssertion,
  indent: number = 4
): string {
  const spaces = ' '.repeat(indent);
  const innerSpaces = ' '.repeat(indent + 2);

  let block = `${spaces}assertion {\n`;
  block += `${innerSpaces}source     = "${assertion.source}"\n`;

  if (assertion.property) {
    block += `${innerSpaces}property   = "${assertion.property}"\n`;
  }

  block += `${innerSpaces}comparison = "${assertion.comparison}"\n`;
  block += `${innerSpaces}target     = "${assertion.target}"\n`;
  block += `${spaces}}`;

  return block;
}
