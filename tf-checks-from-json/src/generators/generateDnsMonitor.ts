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

// Default response time thresholds for DNS monitors
const DEFAULT_DNS_DEGRADED_RESPONSE_TIME = 1000; // 1 second
const DEFAULT_DNS_MAX_RESPONSE_TIME = 3000; // 3 seconds

/**
 * Generate HCL for a DNS monitor resource
 *
 * @param app - The application configuration object
 * @param tier - The tier name (app1, app2, app3, or app4)
 * @param monitor - The DNS monitor configuration
 * @param groupResourceId - The Terraform resource ID of the parent group
 * @returns HCL resource block as a string
 *
 * @example
 * generateDnsMonitor(app, "app1", {
 *   name: "DNS Resolution Check",
 *   query: "example.com",
 *   record_type: "A",
 *   frequency: 1,
 *   activated: true
 * }, "env_observability_app1_group")
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

  // Get response time thresholds (with defaults)
  const degradedTime = monitor.degraded_response_time ?? DEFAULT_DNS_DEGRADED_RESPONSE_TIME;
  const maxTime = monitor.max_response_time ?? DEFAULT_DNS_MAX_RESPONSE_TIME;

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

  // Build optional monitor-level fields
  let protocolHCL = '';
  if (monitor.protocol) {
    protocolHCL = `\n  protocol = "${monitor.protocol}"`;
  }

  let nameServerHCL = '';
  if (monitor.name_server) {
    nameServerHCL = `\n  name_server = "${monitor.name_server}"`;
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
  query                     = "${monitor.query}"
  record_type               = "${monitor.record_type}"
  activated                 = ${formatHCLBool(monitor.activated)}
  frequency                 = ${monitor.frequency}
  group_id                  = checkly_check_group.${groupResourceId}.id
  tags                      = ${tagsHCL}
  degraded_response_time    = ${degradedTime}
  max_response_time         = ${maxTime}
  use_global_alert_settings = ${formatHCLBool(useGlobalAlertSettings)}${protocolHCL}${nameServerHCL}${locationsHCL}${privateLocationsHCL}${mutedHCL}${shouldFailHCL}${alertSettingsHCL}${retryStrategyHCL}
}`;
}
