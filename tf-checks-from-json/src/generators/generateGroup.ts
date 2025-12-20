/**
 * Generator for Checkly check group resources
 * Creates checkly_check_group resources with consistent configuration
 */

import { TierDefinition } from '../types/json-types';
import { sanitizeResourceId } from '../utils/sanitizeResourceId';
import { formatHCLList, formatHCLBool, formatHCLMap } from '../utils/formatHCL';
import { formatHCLValue } from '../utils/variableResolver';
import {
  generateAlertSettingsBlock,
  generateRetryStrategyBlock,
  generateEnvironmentVariablesBlock,
} from '../utils/hclBlockGenerators';
import {
  DEFAULT_LOCATIONS,
  DEFAULT_CONCURRENCY,
  DEFAULT_RUNTIME_ID,
} from '../config/constants';

/**
 * Generate HCL for a check group resource
 *
 * @param appName - The application/environment name
 * @param tier - The tier name (can be any string)
 * @param tierDef - The tier definition with configuration
 * @returns HCL resource block as a string
 *
 * @example
 * generateGroup("Env-Observability", "critical", {
 *   alertChannel: "email_critical",
 *   checks: [...],
 *   locations: ["us-east-1", "eu-west-1"],
 *   alert_settings: { escalation_type: "RUN_BASED", ... }
 * })
 */
export function generateGroup(appName: string, tier: string, tierDef: TierDefinition): string {
  // Create Terraform resource ID
  const resourceId = sanitizeResourceId(`${appName}_${tier}_group`);

  // Create display name (preserve original casing)
  const name = `${appName} ${tier} Group`;

  // Create sanitized app name for tags
  const sanitizedAppName = sanitizeResourceId(appName);

  // Get tier-level configurations (with defaults)
  const locations = tierDef.locations ?? DEFAULT_LOCATIONS;
  const concurrency = tierDef.concurrency ?? DEFAULT_CONCURRENCY;
  const muted = tierDef.muted ?? false;
  const runParallel = tierDef.run_parallel;
  const runtimeId = tierDef.runtime_id ?? DEFAULT_RUNTIME_ID;
  const useGlobalAlertSettings = tierDef.use_global_alert_settings ?? false;

  // Format locations list
  const locationsHCL = formatHCLList(locations);

  // Build tags list (combine tier-level tags with default tags)
  const defaultTags = [sanitizedAppName, tier];
  const allTags = tierDef.tags ? [...defaultTags, ...tierDef.tags] : defaultTags;
  const tagsHCL = formatHCLList(allTags);

  // Generate single alert channel subscription for this tier
  const subscriptionHCL = `  alert_channel_subscription {
    channel_id = checkly_alert_channel.${tierDef.alertChannel}.id
    activated  = ${formatHCLBool(true)}
  }`;

  // Generate optional blocks
  let alertSettingsHCL = '';
  if (tierDef.alert_settings) {
    alertSettingsHCL = '\n\n' + generateAlertSettingsBlock(tierDef.alert_settings, 2);
  }

  let retryStrategyHCL = '';
  if (tierDef.retry_strategy) {
    retryStrategyHCL = '\n\n' + generateRetryStrategyBlock(tierDef.retry_strategy, 2);
  }

  let environmentVariablesHCL = '';
  if (tierDef.environment_variables && tierDef.environment_variables.length > 0) {
    environmentVariablesHCL = '\n\n' + generateEnvironmentVariablesBlock(tierDef.environment_variables, 2);
  }

  // Generate api_check_defaults block if present
  let apiCheckDefaultsHCL = '';
  if (tierDef.api_check_defaults) {
    apiCheckDefaultsHCL = '\n\n  api_check_defaults {\n';

    // Add headers if present
    if (tierDef.api_check_defaults.headers) {
      apiCheckDefaultsHCL += `    headers = ${formatHCLMap(tierDef.api_check_defaults.headers, 4)}\n`;
    }

    // Add query_parameters if present
    if (tierDef.api_check_defaults.query_parameters) {
      apiCheckDefaultsHCL += `    query_parameters = ${formatHCLMap(tierDef.api_check_defaults.query_parameters, 4)}\n`;
    }

    // Add basic_auth if present
    if (tierDef.api_check_defaults.basic_auth) {
      const username = formatHCLValue(tierDef.api_check_defaults.basic_auth.username);
      const password = formatHCLValue(tierDef.api_check_defaults.basic_auth.password);
      apiCheckDefaultsHCL += `\n    basic_auth {
      username = ${username}
      password = ${password}
    }\n`;
    }

    apiCheckDefaultsHCL += '  }';
  }

  // Build optional fields
  let privateLocationsHCL = '';
  if (tierDef.private_locations && tierDef.private_locations.length > 0) {
    privateLocationsHCL = `\n  private_locations = ${formatHCLList(tierDef.private_locations)}`;
  }

  let runParallelHCL = '';
  if (runParallel !== undefined) {
    runParallelHCL = `\n  run_parallel = ${formatHCLBool(runParallel)}`;
  }

  return `resource "checkly_check_group" "${resourceId}" {
  name                      = "${name}"
  activated                 = ${formatHCLBool(true)}
  muted                     = ${formatHCLBool(muted)}
  concurrency               = ${concurrency}
  locations                 = ${locationsHCL}
  tags                      = ${tagsHCL}
  runtime_id                = "${runtimeId}"
  use_global_alert_settings = ${formatHCLBool(useGlobalAlertSettings)}${runParallelHCL}${privateLocationsHCL}

${subscriptionHCL}${apiCheckDefaultsHCL}${alertSettingsHCL}${retryStrategyHCL}${environmentVariablesHCL}
}`;
}
