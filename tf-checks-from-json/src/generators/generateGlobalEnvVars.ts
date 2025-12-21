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
 * @param previousResourceId - Optional ID of previous env var to create dependency
 * @returns HCL resource block as a string
 *
 * @example
 * generateGlobalEnvVar({
 *   key: "API_BASE_URL",
 *   value: "https://api.example.com",
 *   locked: true
 * })
 *
 * Note: Import blocks are NOT generated as these are new resources.
 * If you need to import existing Checkly environment variables, manually add:
 *   terraform import checkly_environment_variable.<resource_id> <KEY>
 */
export function generateGlobalEnvVar(envVar: EnvironmentVariable, previousResourceId?: string): string {
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

  // Add dependency to previous env var to force sequential creation
  // This prevents 409 Conflict errors when creating multiple env vars in parallel
  let dependsOnHCL = '';
  if (previousResourceId) {
    dependsOnHCL = `\n  depends_on = [checkly_environment_variable.${previousResourceId}]`;
  }

  const resourceBlock = `resource "checkly_environment_variable" "${resourceId}" {
  key   = "${envVar.key}"
  value = ${valueHCL}${lockedHCL}${secretHCL}${dependsOnHCL}
}`;

  return resourceBlock;
}

/**
 * Generate HCL for all global environment variables
 * Creates them with dependencies to ensure sequential creation
 *
 * @param envVars - Array of environment variable configurations
 * @returns Combined HCL for all global environment variables
 */
export function generateGlobalEnvVars(envVars: EnvironmentVariable[]): string {
  return envVars.map((envVar, index) => {
    // For the first env var, no dependency needed
    // For subsequent env vars, depend on the previous one
    const previousResourceId = index > 0
      ? sanitizeResourceId(`global_env_${envVars[index - 1].key}`)
      : undefined;

    return generateGlobalEnvVar(envVar, previousResourceId);
  }).join('\n\n');
}
