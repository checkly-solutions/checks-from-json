/**
 * Generator for Checkly DNS monitor resources
 * Creates checkly_dns_monitor resources for DNS resolution monitoring
 */

import { DnsMonitorConfig, UrlListConfig } from '../types/json-types';
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

// Default response time thresholds for DNS monitors
const DEFAULT_DNS_DEGRADED_RESPONSE_TIME = 1000; // 1 second
const DEFAULT_DNS_MAX_RESPONSE_TIME = 3000; // 3 seconds

/**
 * Generate HCL for a DNS monitor resource
 *
 * DNS monitors check DNS resolution and validate record values.
 * Supports all record types: A, AAAA, CNAME, MX, NS, TXT, SOA, PTR, CAA.
 *
 * Validates all configurations against Checkly Terraform provider constraints including:
 * - Frequency values (0, 1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440 minutes)
 * - Response times (0-5000ms for DNS monitors - LOWER than HTTP-based checks)
 * - Alert settings (escalation types, thresholds, reminders)
 * - Retry strategies (types, max retries, backoff durations)
 *
 * @param app - The application configuration object
 * @param tier - The tier name (e.g., "production", "staging")
 * @param monitor - The DNS monitor configuration
 * @param groupResourceId - The Terraform resource ID of the parent group
 * @returns HCL resource block as a string
 *
 * @example
 * generateDnsMonitor(app, "production", {
 *   name: "DNS A Record",
 *   query: "example.com",
 *   record_type: "A",
 *   frequency: 5,
 *   activated: true,
 *   degraded_response_time: 500,
 *   max_response_time: 2000,
 *   protocol: "UDP"
 * }, "app_production_group")
 */
export function generateDnsMonitor(
  app: UrlListConfig,
  tier: string,
  monitor: DnsMonitorConfig,
  groupResourceId: string
): string {
  // Create Terraform resource ID
  const sanitizedMonitorName = sanitizeResourceId(monitor.name);
  const sanitizedAppName = sanitizeResourceId(app.appName);
  const resourceId = sanitizeResourceId(
    `${sanitizedMonitorName}_${sanitizedAppName}_${tier}_dns_monitor`
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
      `DNS Monitor "${monitor.name}": Invalid frequency ${monitor.frequency}. Must be one of: ${VALID_FREQUENCY_VALUES.join(', ')}`
    );
  }

  // Response time validation (TCP/DNS have 5000ms limit)
  const degradedTime = monitor.degraded_response_time ?? DEFAULT_DNS_DEGRADED_RESPONSE_TIME;
  const maxTime = monitor.max_response_time ?? DEFAULT_DNS_MAX_RESPONSE_TIME;

  if (degradedTime < 0 || degradedTime > MAX_RESPONSE_TIME_TCP_DNS) {
    throw new Error(
      `DNS Monitor "${monitor.name}": degraded_response_time must be 0-${MAX_RESPONSE_TIME_TCP_DNS}ms, got ${degradedTime}`
    );
  }
  if (maxTime < 0 || maxTime > MAX_RESPONSE_TIME_TCP_DNS) {
    throw new Error(
      `DNS Monitor "${monitor.name}": max_response_time must be 0-${MAX_RESPONSE_TIME_TCP_DNS}ms, got ${maxTime}`
    );
  }
  if (degradedTime > maxTime) {
    throw new Error(
      `DNS Monitor "${monitor.name}": degraded_response_time (${degradedTime}) cannot exceed max_response_time (${maxTime})`
    );
  }

  // Validate optional configurations
  if (monitor.alert_settings) {
    validateAlertSettings(monitor.alert_settings, `DNS Monitor "${monitor.name}"`);
  }
  if (monitor.retry_strategy) {
    validateRetryStrategy(monitor.retry_strategy, `DNS Monitor "${monitor.name}"`);
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
  let requestProtocolHCL = '';
  if (monitor.protocol) {
    requestProtocolHCL = `\n    protocol = "${monitor.protocol}"`;
  }

  // Parse name_server string (format: "host:port") into nested block
  let requestNameServerHCL = '';
  if (monitor.name_server) {
    const parts = monitor.name_server.split(':');
    const host = parts[0] || '8.8.8.8';
    const port = parts[1] ? parseInt(parts[1], 10) : 53;
    requestNameServerHCL = `\n\n    name_server {
      host = "${host}"
      port = ${port}
    }`;
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

  return `resource "checkly_dns_monitor" "${resourceId}" {
  name                      = "${name}"
  activated                 = ${formatHCLBool(monitor.activated)}
  frequency                 = ${monitor.frequency}
  group_id                  = checkly_check_group.${groupResourceId}.id
  tags                      = ${tagsHCL}
  degraded_response_time    = ${degradedTime}
  max_response_time         = ${maxTime}
  use_global_alert_settings = ${formatHCLBool(useGlobalAlertSettings)}${locationsHCL}${privateLocationsHCL}${mutedHCL}${shouldFailHCL}

  request {
    query       = "${monitor.query}"
    record_type = "${monitor.record_type}"${requestProtocolHCL}${requestNameServerHCL}
  }${alertSettingsHCL}${retryStrategyHCL}
}`;
}
