/**
 * Utilities for parsing assertion objects from JSON format
 * Handles object-based assertions used in the new JSON configuration format
 */

import { TerraformAssertion } from '../types/terraform-types';
import {
  ASSERTION_SOURCE_MAP,
  ASSERTION_COMPARISON_MAP,
} from '../config/constants';

/**
 * Parse an assertion object from JSON format into Terraform assertion format
 *
 * The JSON uses an object-based format like:
 * { "statusCode": { "lessThan": 400 } }
 * or with property:
 * { "jsonBody": { "equals": "healthy", "property": "status" } }
 *
 * This function converts it to Terraform assertion format:
 * { source: "STATUS_CODE", comparison: "LESS_THAN", target: "400" }
 *
 * @param assertionObj - The assertion object from JSON
 * @returns Terraform assertion object ready for HCL generation
 *
 * @example
 * parseAssertionObject({ "statusCode": { "lessThan": 400 } })
 * // Returns: { source: "STATUS_CODE", comparison: "LESS_THAN", target: "400" }
 *
 * parseAssertionObject({ "jsonBody": { "equals": "healthy", "property": "status" } })
 * // Returns: { source: "JSON_BODY", property: "status", comparison: "EQUALS", target: "healthy" }
 *
 * parseAssertionObject({ "headers": { "hasKey": "Content-Type" } })
 * // Returns: { source: "HEADERS", comparison: "HAS_KEY", target: "Content-Type" }
 */
export function parseAssertionObject(assertionObj: any): TerraformAssertion {
  // Validate input is an object
  if (!assertionObj || typeof assertionObj !== 'object') {
    throw new Error(
      `Invalid assertion format: expected object, got ${typeof assertionObj}`
    );
  }

  // Get the source key (first key in the object: statusCode, jsonBody, etc.)
  const sourceKeys = Object.keys(assertionObj);
  if (sourceKeys.length === 0) {
    throw new Error('Invalid assertion: empty object');
  }

  const sourceKey = sourceKeys[0]; // e.g., "statusCode", "jsonBody"
  const comparisonObj = assertionObj[sourceKey];

  // Validate comparison object
  if (!comparisonObj || typeof comparisonObj !== 'object') {
    throw new Error(
      `Invalid assertion format for "${sourceKey}": expected comparison object, got ${typeof comparisonObj}`
    );
  }

  // Map source to Terraform format
  const terraformSource = ASSERTION_SOURCE_MAP[sourceKey];
  if (!terraformSource) {
    const validSources = Object.keys(ASSERTION_SOURCE_MAP).join(', ');
    throw new Error(
      `Invalid assertion source "${sourceKey}". Valid sources are: ${validSources}`
    );
  }

  // Get the comparison key and value
  // Filter out 'property' key as it's special
  const comparisonKeys = Object.keys(comparisonObj).filter(
    (key) => key !== 'property'
  );

  if (comparisonKeys.length === 0) {
    throw new Error(
      `Invalid assertion: no comparison method found in "${sourceKey}" object`
    );
  }

  const comparisonKey = comparisonKeys[0]; // e.g., "lessThan", "equals"
  const targetValue = comparisonObj[comparisonKey];

  // Map comparison to Terraform format
  const terraformComparison = ASSERTION_COMPARISON_MAP[comparisonKey];
  if (!terraformComparison) {
    const validComparisons = Object.keys(ASSERTION_COMPARISON_MAP).join(', ');
    throw new Error(
      `Invalid assertion comparison "${comparisonKey}". Valid comparisons are: ${validComparisons}`
    );
  }

  // Build the Terraform assertion object
  const assertion: TerraformAssertion = {
    source: terraformSource,
    comparison: terraformComparison,
    target: String(targetValue), // Convert to string for HCL
  };

  // Handle optional property field (used for jsonBody with path)
  if (comparisonObj.property) {
    assertion.property = String(comparisonObj.property);
  }

  return assertion;
}

/**
 * Get list of valid assertion sources for error messages
 * @returns Array of valid source keys
 */
export function getValidAssertionSources(): string[] {
  return Object.keys(ASSERTION_SOURCE_MAP);
}

/**
 * Get list of valid assertion comparisons for error messages
 * @returns Array of valid comparison keys
 */
export function getValidAssertionComparisons(): string[] {
  return Object.keys(ASSERTION_COMPARISON_MAP);
}

/**
 * Validate that an assertion object has the correct structure
 * Throws descriptive error if invalid
 *
 * @param assertionObj - The assertion object to validate
 */
export function validateAssertionObject(assertionObj: any): void {
  try {
    parseAssertionObject(assertionObj);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Invalid assertion object: ${String(error)}`);
  }
}
