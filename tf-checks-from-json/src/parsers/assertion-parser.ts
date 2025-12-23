/**
 * Assertion parser for API check assertions
 * Based on spec section 6.1 and CLI code at createAPIcheck.ts:20-38
 *
 * Parses assertion strings like:
 * - "statusCode().equals(200)" → { source: "STATUS_CODE", comparison: "EQUALS", target: "200" }
 * - "jsonBody(\"$.code\").equals(\"success\")" → { source: "JSON_BODY", property: "$.code", comparison: "EQUALS", target: "success" }
 */

import { TerraformAssertion } from '../types/terraform.types';

/**
 * Mapping of assertion method names to Terraform sources
 */
const SOURCE_MAPPING: { [key: string]: TerraformAssertion['source'] } = {
  statusCode: 'STATUS_CODE',
  jsonBody: 'JSON_BODY',
  headers: 'HEADERS',
  textBody: 'TEXT_BODY',
  responseTime: 'RESPONSE_TIME'
};

/**
 * Mapping of comparison method names to Terraform comparisons
 */
const COMPARISON_MAPPING: { [key: string]: string } = {
  equals: 'EQUALS',
  notEquals: 'NOT_EQUALS',
  contains: 'CONTAINS',
  notContains: 'NOT_CONTAINS',
  greaterThan: 'GREATER_THAN',
  lessThan: 'LESS_THAN',
  hasKey: 'HAS_KEY',
  hasValue: 'HAS_VALUE',
  isEmpty: 'IS_EMPTY',
  notEmpty: 'NOT_EMPTY',
  isNull: 'IS_NULL',
  notNull: 'NOT_NULL'
};

/**
 * Interface for parsed method call
 */
interface MethodCall {
  name: string;
  args: string;
}

/**
 * Parse an assertion string into a Terraform assertion object
 *
 * Uses regex to extract method chain:
 * 1. First method → source type (statusCode, jsonBody, etc.)
 * 2. First method args → property (for jsonBody, headers)
 * 3. Last method → comparison type (equals, contains, etc.)
 * 4. Last method args → target value
 *
 * @param assertionString - Assertion string from urlList.json
 * @returns Terraform assertion object
 * @throws Error if assertion format is invalid
 *
 * @example
 * parseAssertion("statusCode().equals(200)")
 * // => { source: "STATUS_CODE", comparison: "EQUALS", target: "200" }
 *
 * parseAssertion('jsonBody("$.code").equals("success")')
 * // => { source: "JSON_BODY", property: "$.code", comparison: "EQUALS", target: "success" }
 */
export function parseAssertion(assertionString: string): TerraformAssertion {
  // Regex to extract method calls: methodName(args)
  // Matches: method(args) - captures method name and arguments
  const methodRegex = /([a-zA-Z0-9_$]+)\(([^)]*)\)/g;
  const methods: MethodCall[] = [];

  let match: RegExpExecArray | null;
  while ((match = methodRegex.exec(assertionString)) !== null) {
    const methodName = match[1];
    // Strip quotes from arguments
    const args = match[2] ? match[2].replace(/['"]/g, '') : '';
    methods.push({ name: methodName, args });
  }

  if (methods.length === 0) {
    throw new Error(`Invalid assertion format: ${assertionString}`);
  }

  // First method determines source and property
  const sourceMethod = methods[0];
  const source = SOURCE_MAPPING[sourceMethod.name];

  if (!source) {
    throw new Error(`Unknown assertion source method: ${sourceMethod.name}`);
  }

  const property = sourceMethod.args || undefined;

  // Find comparison method (last method with known comparison name)
  let comparisonMethod: MethodCall | undefined;
  for (let i = methods.length - 1; i >= 0; i--) {
    if (methods[i].name in COMPARISON_MAPPING) {
      comparisonMethod = methods[i];
      break;
    }
  }

  if (!comparisonMethod) {
    throw new Error(`Unknown assertion comparison method in: ${assertionString}`);
  }

  const comparison = COMPARISON_MAPPING[comparisonMethod.name];
  const target = comparisonMethod.args || '';

  // Build assertion object
  const assertion: TerraformAssertion = {
    source,
    comparison,
    target
  };

  // Only include property if it exists (for jsonBody and headers)
  if (property) {
    assertion.property = property;
  }

  return assertion;
}
