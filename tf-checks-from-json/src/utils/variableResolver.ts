/**
 * Utilities for parsing and resolving Terraform variable references
 * Supports both literal values and variable references using the "var:variable_name" pattern
 */

import {
  AlertChannelDefinition,
  UrlListConfig,
  EnvironmentVariable,
} from '../types/json-types';

/**
 * Check if a value is a Terraform variable reference
 * Variable references use the pattern "var:variable_name"
 *
 * @param value - The value to check
 * @returns true if the value is a variable reference
 *
 * @example
 * isVariableReference("var:email_address") // true
 * isVariableReference("user@example.com")  // false
 */
export function isVariableReference(value: string): boolean {
  return typeof value === 'string' && value.startsWith('var:');
}

/**
 * Extract variable name from a reference
 * "var:variable_name" => "variable_name"
 *
 * @param varRef - The variable reference string
 * @returns The variable name without the "var:" prefix
 * @throws Error if the value is not a variable reference
 *
 * @example
 * extractVariableName("var:email_address") // "email_address"
 */
export function extractVariableName(varRef: string): string {
  if (!isVariableReference(varRef)) {
    throw new Error(`Not a variable reference: ${varRef}`);
  }
  const varName = varRef.substring(4); // Remove "var:" prefix
  if (!varName) {
    throw new Error(`Malformed variable reference: "${varRef}" - missing variable name after "var:"`);
  }
  return varName;
}

/**
 * Convert variable reference to HCL syntax
 * "var:variable_name" => "var.variable_name"
 *
 * @param varRef - The variable reference string
 * @returns HCL variable reference syntax
 *
 * @example
 * toHCLVariableReference("var:email_address") // "var.email_address"
 */
export function toHCLVariableReference(varRef: string): string {
  const varName = extractVariableName(varRef);
  return `var.${varName}`;
}

/**
 * Escape special characters in HCL strings
 * Handles quotes, newlines, and backslashes
 *
 * @param value - The string to escape
 * @returns Escaped string safe for HCL
 *
 * @example
 * escapeHCLString('Hello "World"') // 'Hello \\"World\\"'
 */
export function escapeHCLString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/"/g, '\\"')    // Escape double quotes
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '\\r')   // Escape carriage returns
    .replace(/\t/g, '\\t');  // Escape tabs
}

/**
 * Format a value for HCL (either literal string or variable reference)
 * Variable references are returned as-is (no quotes)
 * Literal strings are quoted and escaped
 *
 * @param value - The value to format
 * @returns HCL-formatted value
 *
 * @example
 * formatHCLValue("var:email_address")      // "var.email_address"
 * formatHCLValue("user@example.com")       // '"user@example.com"'
 * formatHCLValue('Hello "World"')          // '"Hello \\"World\\""'
 */
export function formatHCLValue(value: string): string {
  if (isVariableReference(value)) {
    return toHCLVariableReference(value);
  }
  return `"${escapeHCLString(value)}"`;
}

/**
 * Collect all variable references from configuration
 * Recursively scans alert channels, global env vars, apps, tiers, and checks for "var:*" references
 *
 * @param alertChannels - Array of alert channel definitions
 * @param apps - Array of application configurations
 * @param globalEnvVars - Optional array of global environment variables
 * @returns Set of unique variable names (without "var:" prefix)
 *
 * @example
 * collectVariableReferences(
 *   [{ id: "email", type: "email", config: { address: "var:email_addr" } }],
 *   [{ appName: "My App", tiers: { production: { ... } } }],
 *   [{ key: "API_KEY", value: "var:api_key" }]
 * )
 * // Returns Set { "email_addr", "api_key", ... }
 */
export function collectVariableReferences(
  alertChannels: AlertChannelDefinition[],
  apps: UrlListConfig[],
  globalEnvVars?: EnvironmentVariable[]
): Set<string> {
  const vars = new Set<string>();

  // Scan alert channels
  alertChannels.forEach((channel) => {
    scanObjectForVariables(channel.config, vars);
  });

  // Scan global environment variables
  if (globalEnvVars) {
    globalEnvVars.forEach((envVar) => {
      if (isVariableReference(envVar.value)) {
        try {
          vars.add(extractVariableName(envVar.value));
        } catch (error) {
          // Skip malformed references
        }
      }
    });
  }

  // Scan apps and their tiers
  apps.forEach((app) => {
    if (app.tiers) {
      Object.values(app.tiers).forEach((tierDef) => {
        // Scan tier-level environment variables
        if (tierDef.environment_variables) {
          tierDef.environment_variables.forEach((envVar) => {
            if (isVariableReference(envVar.value)) {
              try {
                vars.add(extractVariableName(envVar.value));
              } catch (error) {
                // Skip malformed references
              }
            }
          });
        }

        // Scan tier-level API check defaults
        if (tierDef.api_check_defaults) {
          scanObjectForVariables(tierDef.api_check_defaults, vars);
        }

        // Scan all checks in the tier
        if (tierDef.checks) {
          tierDef.checks.forEach((checkCategory) => {
            // Scan each check type (api_check, browser_check, etc.)
            Object.values(checkCategory).forEach((checksArray: any) => {
              if (Array.isArray(checksArray)) {
                checksArray.forEach((check) => {
                  // Scan check-level headers
                  if (check.headers) {
                    scanObjectForVariables(check.headers, vars);
                  }

                  // Scan check-level query parameters
                  if (check.query_parameters) {
                    scanObjectForVariables(check.query_parameters, vars);
                  }

                  // Scan check-level basic auth
                  if (check.basic_auth) {
                    scanObjectForVariables(check.basic_auth, vars);
                  }

                  // Scan check-level environment variables
                  if (check.environment_variables) {
                    check.environment_variables.forEach((envVar: EnvironmentVariable) => {
                      if (isVariableReference(envVar.value)) {
                        try {
                          vars.add(extractVariableName(envVar.value));
                        } catch (error) {
                          // Skip malformed references
                        }
                      }
                    });
                  }
                });
              }
            });
          });
        }
      });
    }
  });

  return vars;
}

/**
 * Recursively scan an object for variable references
 * Internal helper function used by collectVariableReferences
 *
 * @param obj - The object to scan
 * @param vars - Set to accumulate variable names
 */
function scanObjectForVariables(obj: any, vars: Set<string>): void {
  if (typeof obj === 'string' && isVariableReference(obj)) {
    // Found a variable reference - extract the name and add to set
    try {
      vars.add(extractVariableName(obj));
    } catch (error) {
      // Skip malformed references - validation will catch them
    }
  } else if (typeof obj === 'object' && obj !== null) {
    // Recursively scan object properties
    Object.values(obj).forEach((value) => scanObjectForVariables(value, vars));
  }
}
