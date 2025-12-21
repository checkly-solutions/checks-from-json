/**
 * Generator for Checkly browser check resources
 * Creates checkly_check resources with type="BROWSER"
 */

import { BrowserCheckConfig, UrlListConfig } from '../types/json-types';
import { sanitizeResourceId } from '../utils/sanitizeResourceId';
import { formatHCLList, formatHCLBool, wrapHeredoc } from '../utils/formatHCL';
import { readScript } from '../utils/fileUtils';
import {
  generateAlertSettingsBlock,
  generateRetryStrategyBlock,
  generateEnvironmentVariablesBlock,
} from '../utils/hclBlockGenerators';
import {
  DEFAULT_RUNTIME_ID,
  DEFAULT_DEGRADED_RESPONSE_TIME,
  DEFAULT_MAX_RESPONSE_TIME,
  MAX_RESPONSE_TIME_HTTP,
  VALID_FREQUENCY_VALUES,
} from '../config/constants';
import {
  validateAlertSettings,
  validateRetryStrategy,
  validateEnvironmentVariables,
} from '../utils/validation';

/**
 * Generate HCL for a browser check resource
 *
 * Browser checks execute Playwright scripts to test user flows and interactions.
 *
 * Validates all configurations against Checkly Terraform provider constraints including:
 * - Frequency values (0, 1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440 minutes)
 * - Response times (0-30000ms for browser checks)
 * - Alert settings (escalation types, thresholds, reminders)
 * - Retry strategies (types, max retries, backoff durations)
 *
 * @param app - The application configuration object
 * @param tier - The tier name (e.g., "production", "staging")
 * @param check - The browser check configuration with Playwright script
 * @param groupResourceId - The Terraform resource ID of the parent group
 * @returns HCL resource block as a string
 *
 * @example
 * generateBrowserCheck(app, "production", {
 *   filePath: "/browser-scripts/user-flow.spec.ts",
 *   frequency: 5,
 *   activated: true,
 *   urlShort: "user-registration-flow",
 *   degraded_response_time: 15000,
 *   max_response_time: 30000
 * }, "app_production_group")
 */
export function generateBrowserCheck(
  app: UrlListConfig,
  tier: string,
  check: BrowserCheckConfig,
  groupResourceId: string
): string {
  // Create Terraform resource ID
  const resourceId = sanitizeResourceId(
    `${check.urlShort}_${app.appName}_${tier}_browser`
  );

  // Create display name
  const sanitizedAppName = sanitizeResourceId(app.appName);
  const name = `${check.urlShort} ${sanitizedAppName} ${tier}`;

  // Format tags
  const tags = [tier, sanitizedAppName, 'cli'];
  const tagsHCL = formatHCLList(tags);

  // Validate configuration
  // Frequency validation
  if (!VALID_FREQUENCY_VALUES.includes(check.frequency)) {
    throw new Error(
      `Browser Check "${check.urlShort}": Invalid frequency ${check.frequency}. Must be one of: ${VALID_FREQUENCY_VALUES.join(', ')}`
    );
  }

  // Response time validation
  const degradedTime = check.degraded_response_time ?? DEFAULT_DEGRADED_RESPONSE_TIME;
  const maxTime = check.max_response_time ?? DEFAULT_MAX_RESPONSE_TIME;

  if (degradedTime < 0 || degradedTime > MAX_RESPONSE_TIME_HTTP) {
    throw new Error(
      `Browser Check "${check.urlShort}": degraded_response_time must be 0-${MAX_RESPONSE_TIME_HTTP}ms, got ${degradedTime}`
    );
  }
  if (maxTime < 0 || maxTime > MAX_RESPONSE_TIME_HTTP) {
    throw new Error(
      `Browser Check "${check.urlShort}": max_response_time must be 0-${MAX_RESPONSE_TIME_HTTP}ms, got ${maxTime}`
    );
  }
  if (degradedTime > maxTime) {
    throw new Error(
      `Browser Check "${check.urlShort}": degraded_response_time (${degradedTime}) cannot exceed max_response_time (${maxTime})`
    );
  }

  // Validate optional configurations
  if (check.alert_settings) {
    validateAlertSettings(check.alert_settings, `Browser Check "${check.urlShort}"`);
  }
  if (check.retry_strategy) {
    validateRetryStrategy(check.retry_strategy, `Browser Check "${check.urlShort}"`);
  }
  if (check.environment_variables) {
    validateEnvironmentVariables(check.environment_variables, `Browser Check "${check.urlShort}"`);
  }

  // Read and inline the script file
  let scriptContent: string;
  try {
    scriptContent = readScript(check.filePath);
  } catch (error) {
    throw new Error(
      `Failed to read browser script file: ${check.filePath}. Error: ${error}`
    );
  }

  // Wrap script in heredoc
  const scriptHCL = wrapHeredoc(scriptContent, 'EOT');

  // Get runtime_id (with default)
  const runtimeId = check.runtime_id ?? DEFAULT_RUNTIME_ID;

  // Generate optional blocks
  let alertSettingsHCL = '';
  if (check.alert_settings) {
    alertSettingsHCL = '\n\n' + generateAlertSettingsBlock(check.alert_settings, 2);
  }

  let retryStrategyHCL = '';
  if (check.retry_strategy) {
    retryStrategyHCL = '\n\n' + generateRetryStrategyBlock(check.retry_strategy, 2);
  }

  let environmentVariablesHCL = '';
  if (check.environment_variables && check.environment_variables.length > 0) {
    environmentVariablesHCL = '\n\n' + generateEnvironmentVariablesBlock(check.environment_variables, 2);
  }

  // use_global_alert_settings field
  const useGlobalAlertSettings = check.use_global_alert_settings !== undefined
    ? check.use_global_alert_settings
    : false;

  // Handle local setup script if present
  let localSetupScriptHCL = '';
  if (check.local_setup_script) {
    try {
      const scriptContent = readScript(check.local_setup_script);
      localSetupScriptHCL = `\n  local_setup_script = ${wrapHeredoc(scriptContent, 'SETUP')}`;
    } catch (error) {
      console.warn(`Warning: Local setup script not found: ${check.local_setup_script}`);
    }
  }

  // Handle local teardown script if present
  let localTeardownScriptHCL = '';
  if (check.local_teardown_script) {
    try {
      const scriptContent = readScript(check.local_teardown_script);
      localTeardownScriptHCL = `\n  local_teardown_script = ${wrapHeredoc(scriptContent, 'TEARDOWN')}`;
    } catch (error) {
      console.warn(`Warning: Local teardown script not found: ${check.local_teardown_script}`);
    }
  }

  // Handle setup snippet reference if present
  let setupSnippetHCL = '';
  if (check.setup_snippet_id) {
    const snippetResourceId = sanitizeResourceId(`snippet_${check.setup_snippet_id}`);
    setupSnippetHCL = `\n  setup_snippet_id = checkly_snippet.${snippetResourceId}.id`;
  }

  // Handle teardown snippet reference if present
  let teardownSnippetHCL = '';
  if (check.teardown_snippet_id) {
    const snippetResourceId = sanitizeResourceId(`snippet_${check.teardown_snippet_id}`);
    teardownSnippetHCL = `\n  teardown_snippet_id = checkly_snippet.${snippetResourceId}.id`;
  }

  // Build optional check-level fields
  let groupOrderHCL = '';
  if (check.group_order !== undefined) {
    groupOrderHCL = `\n  group_order = ${check.group_order}`;
  }

  let frequencyOffsetHCL = '';
  if (check.frequency_offset !== undefined) {
    frequencyOffsetHCL = `\n  frequency_offset = ${check.frequency_offset}`;
  }

  let locationsHCL = '';
  if (check.locations && check.locations.length > 0) {
    locationsHCL = `\n  locations = ${formatHCLList(check.locations)}`;
  }

  let mutedHCL = '';
  if (check.muted !== undefined) {
    mutedHCL = `\n  muted = ${formatHCLBool(check.muted)}`;
  }

  return `resource "checkly_check" "${resourceId}" {
  name                      = "${name}"
  type                      = "BROWSER"
  activated                 = ${formatHCLBool(check.activated)}
  frequency                 = ${check.frequency}
  group_id                  = checkly_check_group.${groupResourceId}.id
  tags                      = ${tagsHCL}
  runtime_id                = "${runtimeId}"
  degraded_response_time    = ${degradedTime}
  max_response_time         = ${maxTime}
  use_global_alert_settings = ${formatHCLBool(useGlobalAlertSettings)}${groupOrderHCL}${frequencyOffsetHCL}${locationsHCL}${mutedHCL}${localSetupScriptHCL}${localTeardownScriptHCL}${setupSnippetHCL}${teardownSnippetHCL}

  script = ${scriptHCL}${alertSettingsHCL}${retryStrategyHCL}${environmentVariablesHCL}
}`;
}
