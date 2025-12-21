/**
 * Generator for Checkly TCP monitor resources
 * Creates checkly_tcp_monitor resources for TCP port monitoring
 */

import { TcpMonitorConfig, UrlListConfig } from '../types/json-types';
import { sanitizeResourceId } from '../utils/sanitizeResourceId';
import { formatHCLList, formatHCLBool } from '../utils/formatHCL';
import {
  generateAlertSettingsBlock,
  generateRetryStrategyBlock,
} from '../utils/hclBlockGenerators';
import {
  MAX_RESPONSE_TIME_TCP_DNS,
  VALID_FREQUENCY_VALUES,
} from '../config/constants';
import {
  validateAlertSettings,
  validateRetryStrategy,
} from '../utils/validation';

// Default response time thresholds for TCP monitors (lower than HTTP)
const DEFAULT_TCP_DEGRADED_RESPONSE_TIME = 1000; // 1 second
const DEFAULT_TCP_MAX_RESPONSE_TIME = 3000; // 3 seconds

/**
 * Generate HCL for a TCP monitor resource
 *
 * TCP monitors check connectivity to a specific hostname and port.
 * Useful for monitoring database connections, message queues, and other TCP services.
 *
 * Validates all configurations against Checkly Terraform provider constraints including:
 * - Frequency values (0, 1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440 minutes)
 * - Response times (0-5000ms for TCP monitors - LOWER than HTTP-based checks)
 * - Alert settings (escalation types, thresholds, reminders)
 * - Retry strategies (types, max retries, backoff durations)
 *
 * @param app - The application configuration object
 * @param tier - The tier name (e.g., "production", "staging")
 * @param monitor - The TCP monitor configuration
 * @param groupResourceId - The Terraform resource ID of the parent group
 * @returns HCL resource block as a string
 *
 * @example
 * generateTcpMonitor(app, "production", {
 *   name: "Database Connection",
 *   hostname: "db.example.com",
 *   port: 5432,
 *   frequency: 1,
 *   activated: true,
 *   degraded_response_time: 500,
 *   max_response_time: 2000
 * }, "app_production_group")
 */
export function generateTcpMonitor(
  app: UrlListConfig,
  tier: string,
  monitor: TcpMonitorConfig,
  groupResourceId: string
): string {
  // Create Terraform resource ID
  const sanitizedMonitorName = sanitizeResourceId(monitor.name);
  const sanitizedAppName = sanitizeResourceId(app.appName);
  const resourceId = sanitizeResourceId(
    `${sanitizedMonitorName}_${sanitizedAppName}_${tier}_tcp_monitor`
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
      `TCP Monitor "${monitor.name}": Invalid frequency ${monitor.frequency}. Must be one of: ${VALID_FREQUENCY_VALUES.join(', ')}`
    );
  }

  // Response time validation (TCP/DNS have 5000ms limit)
  const degradedTime = monitor.degraded_response_time ?? DEFAULT_TCP_DEGRADED_RESPONSE_TIME;
  const maxTime = monitor.max_response_time ?? DEFAULT_TCP_MAX_RESPONSE_TIME;

  if (degradedTime < 0 || degradedTime > MAX_RESPONSE_TIME_TCP_DNS) {
    throw new Error(
      `TCP Monitor "${monitor.name}": degraded_response_time must be 0-${MAX_RESPONSE_TIME_TCP_DNS}ms, got ${degradedTime}`
    );
  }
  if (maxTime < 0 || maxTime > MAX_RESPONSE_TIME_TCP_DNS) {
    throw new Error(
      `TCP Monitor "${monitor.name}": max_response_time must be 0-${MAX_RESPONSE_TIME_TCP_DNS}ms, got ${maxTime}`
    );
  }
  if (degradedTime > maxTime) {
    throw new Error(
      `TCP Monitor "${monitor.name}": degraded_response_time (${degradedTime}) cannot exceed max_response_time (${maxTime})`
    );
  }

  // Validate optional configurations
  if (monitor.alert_settings) {
    validateAlertSettings(monitor.alert_settings, `TCP Monitor "${monitor.name}"`);
  }
  if (monitor.retry_strategy) {
    validateRetryStrategy(monitor.retry_strategy, `TCP Monitor "${monitor.name}"`);
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
  let requestDataHCL = '';
  if (monitor.data) {
    // Escape the data string for HCL
    const escapedData = monitor.data.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    requestDataHCL = `\n    data = "${escapedData}"`;
  }

  let requestIpFamilyHCL = '';
  if (monitor.ip_family) {
    requestIpFamilyHCL = `\n    ip_family = "${monitor.ip_family}"`;
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

  return `resource "checkly_tcp_monitor" "${resourceId}" {
  name                      = "${name}"
  activated                 = ${formatHCLBool(monitor.activated)}
  frequency                 = ${monitor.frequency}
  group_id                  = checkly_check_group.${groupResourceId}.id
  tags                      = ${tagsHCL}
  degraded_response_time    = ${degradedTime}
  max_response_time         = ${maxTime}
  use_global_alert_settings = ${formatHCLBool(useGlobalAlertSettings)}${locationsHCL}${privateLocationsHCL}${mutedHCL}${shouldFailHCL}

  request {
    hostname = "${monitor.hostname}"
    port     = ${monitor.port}${requestDataHCL}${requestIpFamilyHCL}
  }${alertSettingsHCL}${retryStrategyHCL}
}`;
}
