/**
 * Generator for Checkly global environment variable resources
 * Creates checkly_environment_variable resources (account-level variables)
 */

import { EnvironmentVariable } from '../types/json-types';
import { sanitizeResourceId } from '../utils/sanitizeResourceId';
import { formatHCLBool } from '../utils/formatHCL';
import { formatHCLValue } from '../utils/variableResolver';

/**
 * Generate HCL for a single global environment variable resource
 *
 * @param envVar - The environment variable configuration
 * @returns HCL resource block as a string
 *
 * @example
 * generateGlobalEnvVar({
 *   key: "API_BASE_URL",
 *   value: "https://api.example.com",
 *   locked: true
 * })
 */
export function generateGlobalEnvVar(envVar: EnvironmentVariable): string {
  // Create Terraform resource ID from variable key
  const resourceId = sanitizeResourceId(`global_env_${envVar.key}`);

  // Format the value (handles "var:variable_name" pattern)
  const valueHCL = formatHCLValue(envVar.value);

  // Build optional fields
  let lockedHCL = '';
  if (envVar.locked !== undefined) {
    lockedHCL = `\n  locked = ${formatHCLBool(envVar.locked)}`;
  }

  let secretHCL = '';
  if (envVar.secret !== undefined) {
    secretHCL = `\n  secret = ${formatHCLBool(envVar.secret)}`;
  }

  return `resource "checkly_environment_variable" "${resourceId}" {
  key   = "${envVar.key}"
  value = ${valueHCL}${lockedHCL}${secretHCL}
}`;
}

/**
 * Generate HCL for all global environment variables
 *
 * @param envVars - Array of environment variable configurations
 * @returns Combined HCL for all global environment variables
 */
export function generateGlobalEnvVars(envVars: EnvironmentVariable[]): string {
  return envVars.map(envVar => generateGlobalEnvVar(envVar)).join('\n\n');
}
