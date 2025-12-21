/**
 * Generator for Checkly URL monitor resources
 * Creates checkly_url_monitor resources for simple HTTP uptime monitoring
 */

import { UrlMonitorConfig, UrlListConfig } from '../types/json-types';
import { sanitizeResourceId } from '../utils/sanitizeResourceId';
import { formatHCLList, formatHCLBool } from '../utils/formatHCL';
import {
  generateAlertSettingsBlock,
  generateRetryStrategyBlock,
} from '../utils/hclBlockGenerators';
import {
  DEFAULT_DEGRADED_RESPONSE_TIME,
  DEFAULT_MAX_RESPONSE_TIME,
  MAX_RESPONSE_TIME_HTTP,
  VALID_FREQUENCY_VALUES,
} from '../config/constants';
import {
  validateAlertSettings,
  validateRetryStrategy,
} from '../utils/validation';

/**
 * Generate HCL for a URL monitor resource
 *
 * URL monitors provide simple HTTP uptime monitoring without the complexity of full API checks.
 *
 * Validates all configurations against Checkly Terraform provider constraints including:
 * - Frequency values (0, 1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440 minutes)
 * - Response times (0-30000ms for HTTP-based monitors)
 * - Alert settings (escalation types, thresholds, reminders)
 * - Retry strategies (types, max retries, backoff durations)
 *
 * @param app - The application configuration object
 * @param tier - The tier name (e.g., "production", "staging")
 * @param monitor - The URL monitor configuration
 * @param groupResourceId - The Terraform resource ID of the parent group
 * @returns HCL resource block as a string
 *
 * @example
 * generateUrlMonitor(app, "production", {
 *   name: "Homepage Uptime",
 *   url: "https://example.com",
 *   frequency: 1,
 *   activated: true,
 *   degraded_response_time: 2000,
 *   max_response_time: 5000
 * }, "app_production_group")
 */
export function generateUrlMonitor(
  app: UrlListConfig,
  tier: string,
  monitor: UrlMonitorConfig,
  groupResourceId: string
): string {
  // Create Terraform resource ID
  const sanitizedMonitorName = sanitizeResourceId(monitor.name);
  const sanitizedAppName = sanitizeResourceId(app.appName);
  const resourceId = sanitizeResourceId(
    `${sanitizedMonitorName}_${sanitizedAppName}_${tier}_url_monitor`
  );

  // Create display name
  const name = `${monitor.name} ${sanitizedAppName} ${tier}`;

  // Format tags - merge user-provided tags with auto-generated
  const autoTags = [tier, sanitizedAppName, 'cli'];
  const userTags = monitor.tags ?? [];
  const allTags = [...new Set([...autoTags, ...userTags])]; // Deduplicate
  const tagsHCL = formatHCLList(allTags);

  // Validate configuration
  // Frequency validation
  if (!VALID_FREQUENCY_VALUES.includes(monitor.frequency)) {
    throw new Error(
      `URL Monitor "${monitor.name}": Invalid frequency ${monitor.frequency}. Must be one of: ${VALID_FREQUENCY_VALUES.join(', ')}`
    );
  }

  // Response time validation
  const degradedTime = monitor.degraded_response_time ?? DEFAULT_DEGRADED_RESPONSE_TIME;
  const maxTime = monitor.max_response_time ?? DEFAULT_MAX_RESPONSE_TIME;

  if (degradedTime < 0 || degradedTime > MAX_RESPONSE_TIME_HTTP) {
    throw new Error(
      `URL Monitor "${monitor.name}": degraded_response_time must be 0-${MAX_RESPONSE_TIME_HTTP}ms, got ${degradedTime}`
    );
  }
  if (maxTime < 0 || maxTime > MAX_RESPONSE_TIME_HTTP) {
    throw new Error(
      `URL Monitor "${monitor.name}": max_response_time must be 0-${MAX_RESPONSE_TIME_HTTP}ms, got ${maxTime}`
    );
  }
  if (degradedTime > maxTime) {
    throw new Error(
      `URL Monitor "${monitor.name}": degraded_response_time (${degradedTime}) cannot exceed max_response_time (${maxTime})`
    );
  }

  // Validate optional configurations
  if (monitor.alert_settings) {
    validateAlertSettings(monitor.alert_settings, `URL Monitor "${monitor.name}"`);
  }
  if (monitor.retry_strategy) {
    validateRetryStrategy(monitor.retry_strategy, `URL Monitor "${monitor.name}"`);
  }

  // use_global_alert_settings field
  const useGlobalAlertSettings = monitor.use_global_alert_settings !== undefined
    ? monitor.use_global_alert_settings
    : false;

  // Generate optional blocks
  let alertSettingsHCL = '';
  if (monitor.alert_settings) {
    alertSettingsHCL = '\n\n' + generateAlertSettingsBlock(monitor.alert_settings, 2);
  }

  let retryStrategyHCL = '';
  if (monitor.retry_strategy) {
    retryStrategyHCL = '\n\n' + generateRetryStrategyBlock(monitor.retry_strategy, 2);
  }

  // Build request block fields (nested, use 4-space indentation)
  let requestFollowRedirectsHCL = '';
  if (monitor.follow_redirects !== undefined) {
    requestFollowRedirectsHCL = `\n    follow_redirects = ${formatHCLBool(monitor.follow_redirects)}`;
  }

  let requestIpFamilyHCL = '';
  if (monitor.ip_family) {
    requestIpFamilyHCL = `\n    ip_family = "${monitor.ip_family}"`;
  }

  let requestSkipSslHCL = '';
  if (monitor.skip_ssl !== undefined) {
    requestSkipSslHCL = `\n    skip_ssl = ${formatHCLBool(monitor.skip_ssl)}`;
  }

  let locationsHCL = '';
  if (monitor.locations && monitor.locations.length > 0) {
    locationsHCL = `\n  locations = ${formatHCLList(monitor.locations)}`;
  }

  let privateLocationsHCL = '';
  if (monitor.private_locations && monitor.private_locations.length > 0) {
    privateLocationsHCL = `\n  private_locations = ${formatHCLList(monitor.private_locations)}`;
  }

  let mutedHCL = '';
  if (monitor.muted !== undefined) {
    mutedHCL = `\n  muted = ${formatHCLBool(monitor.muted)}`;
  }

  let shouldFailHCL = '';
  if (monitor.should_fail !== undefined) {
    shouldFailHCL = `\n  should_fail = ${formatHCLBool(monitor.should_fail)}`;
  }

  return `resource "checkly_url_monitor" "${resourceId}" {
  name                      = "${name}"
  activated                 = ${formatHCLBool(monitor.activated)}
  frequency                 = ${monitor.frequency}
  group_id                  = checkly_check_group.${groupResourceId}.id
  tags                      = ${tagsHCL}
  degraded_response_time    = ${degradedTime}
  max_response_time         = ${maxTime}
  use_global_alert_settings = ${formatHCLBool(useGlobalAlertSettings)}${locationsHCL}${privateLocationsHCL}${mutedHCL}${shouldFailHCL}

  request {
    url = "${monitor.url}"${requestFollowRedirectsHCL}${requestIpFamilyHCL}${requestSkipSslHCL}
  }${alertSettingsHCL}${retryStrategyHCL}
}`;
}
