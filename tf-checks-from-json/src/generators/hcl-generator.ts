/**
 * HCL generator - converts Terraform resource objects to HCL strings
 * Based on spec section 6.3
 */

import { TerraformResource } from '../types/terraform.types';

/**
 * Check if a string is a Terraform reference
 * References start with resource types like "checkly_" and should not be quoted
 *
 * @param value - String to check
 * @returns true if value is a Terraform reference
 */
function isTerraformReference(value: string): boolean {
  return /^checkly_[a-z_]+\./.test(value);
}

/**
 * Escape special characters in a string for HCL
 *
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')   // Escape backslashes first
    .replace(/"/g, '\\"')      // Escape quotes
    .replace(/\n/g, '\\n')     // Escape newlines
    .replace(/\r/g, '\\r')     // Escape carriage returns
    .replace(/\t/g, '\\t');    // Escape tabs
}

/**
 * Check if a string should use heredoc syntax
 * Heredoc is needed for strings that contain Terraform interpolation syntax ${...}
 * which conflicts with JavaScript/TypeScript template literals in scripts
 *
 * @param str - String to check
 * @returns true if heredoc syntax should be used
 */
function shouldUseHeredoc(str: string): boolean {
  // Use heredoc for strings containing ${...} syntax (template literals)
  // This prevents Terraform from trying to interpolate them
  return str.includes('${');
}

/**
 * Check if an object is a map (plain object for headers, etc.)
 * Maps should be rendered as { key = value } syntax
 * Blocks should be rendered as block_name { }
 *
 * We only treat specific known map fields as maps, everything else is a block
 *
 * @param key - The key name for this object
 * @param obj - Object to check
 * @returns true if object is a map
 */
function isMap(key: string, obj: any): boolean {
  // Only specific fields should be treated as maps
  const mapFields = ['headers'];

  if (!mapFields.includes(key)) {
    return false;
  }

  // Verify it's a plain object with primitive values
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }

  return Object.values(obj).every(
    v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
  );
}

/**
 * Convert an object to HCL format (recursive)
 *
 * @param obj - Object to convert
 * @param indentLevel - Current indentation level
 * @returns HCL string
 */
function objectToHcl(obj: any, indentLevel: number = 0): string {
  const indent = '  '.repeat(indentLevel);
  let hcl = '';

  for (const [key, value] of Object.entries(obj)) {
    // Skip undefined/null values
    if (value === undefined || value === null) {
      continue;
    }

    // Handle different value types
    if (Array.isArray(value)) {
      // Skip empty arrays - don't generate anything
      // Empty arrays for blocks mean "no blocks to generate"
      if (value.length === 0) {
        continue;
      }

      // Check if array of objects (repeated blocks) or array of primitives
      if (typeof value[0] === 'object' && !Array.isArray(value[0])) {
        // Array of objects → repeated blocks
        value.forEach(item => {
          hcl += `${indent}${key} {\n`;
          hcl += objectToHcl(item, indentLevel + 1);
          hcl += `${indent}}\n`;
        });
      } else {
        // Array of primitives → array syntax
        const items = value.map(item => {
          if (typeof item === 'string') {
            return `"${escapeString(item)}"`;
          }
          return String(item);
        });
        hcl += `${indent}${key} = [${items.join(', ')}]\n`;
      }
    } else if (isMap(key, value)) {
      // Plain object with only primitive values → map syntax (for headers, etc.)
      hcl += `${indent}${key} = {\n`;
      for (const [mapKey, mapValue] of Object.entries(value)) {
        // Always quote map keys for consistency
        const quotedKey = `"${mapKey}"`;
        if (typeof mapValue === 'string') {
          hcl += `${indent}  ${quotedKey} = "${escapeString(mapValue as string)}"\n`;
        } else {
          hcl += `${indent}  ${quotedKey} = ${mapValue}\n`;
        }
      }
      hcl += `${indent}}\n`;
    } else if (typeof value === 'object') {
      // Nested block
      hcl += `${indent}${key} {\n`;
      hcl += objectToHcl(value, indentLevel + 1);
      hcl += `${indent}}\n`;
    } else if (typeof value === 'string') {
      // Check if it's a Terraform reference
      if (isTerraformReference(value)) {
        // Don't quote references
        hcl += `${indent}${key} = ${value}\n`;
      } else if (shouldUseHeredoc(value)) {
        // Use heredoc syntax for multi-line strings with interpolation syntax
        // Escape ${...} to $${...} to prevent Terraform interpolation
        const escapedValue = value.replace(/\$\{/g, '$$${');
        hcl += `${indent}${key} = <<-EOT\n`;
        hcl += escapedValue;
        hcl += `\n${indent}EOT\n`;
      } else {
        // Quote string literals, escape special characters
        hcl += `${indent}${key} = "${escapeString(value)}"\n`;
      }
    } else if (typeof value === 'boolean') {
      hcl += `${indent}${key} = ${value}\n`;
    } else if (typeof value === 'number') {
      hcl += `${indent}${key} = ${value}\n`;
    }
  }

  return hcl;
}

/**
 * Generate HCL for a Terraform resource
 *
 * @param resource - Terraform resource object
 * @returns HCL string representation
 *
 * @example
 * const hcl = generateHcl({
 *   resourceType: 'checkly_check',
 *   resourceId: 'api_test',
 *   fileName: 'checks_api.tf',
 *   attributes: {
 *     name: 'Test Check',
 *     type: 'API',
 *     activated: true
 *   }
 * })
 * // Returns:
 * // resource "checkly_check" "api_test" {
 * //   name = "Test Check"
 * //   type = "API"
 * //   activated = true
 * // }
 */
export function generateHcl(resource: TerraformResource): string {
  // Generate resource declaration
  let hcl = `resource "${resource.resourceType}" "${resource.resourceId}" {\n`;
  hcl += objectToHcl(resource.attributes, 1);
  hcl += '}\n';

  return hcl;
}
