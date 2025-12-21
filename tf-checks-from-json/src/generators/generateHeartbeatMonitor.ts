/**
 * Generator for Checkly heartbeat monitor resources
 * Creates checkly_heartbeat_monitor resources for cron job and background service monitoring
 */

import { HeartbeatMonitorConfig, UrlListConfig } from '../types/json-types';
import { sanitizeResourceId } from '../utils/sanitizeResourceId';
import { formatHCLList, formatHCLBool } from '../utils/formatHCL';
import { generateAlertSettingsBlock } from '../utils/hclBlockGenerators';

/**
 * Generate HCL for a heartbeat monitor resource
 *
 * Note: Heartbeat monitors do NOT belong to groups - they are standalone resources
 *
 * @param app - The application configuration object
 * @param tier - The tier name (app1, app2, app3, or app4)
 * @param monitor - The heartbeat monitor configuration
 * @returns HCL resource block as a string
 *
 * @example
 * generateHeartbeatMonitor(app, "app1", {
 *   name: "Daily Backup Job",
 *   period: 1,
 *   period_unit: "day",
 *   grace: 15,
 *   grace_unit: "minute",
 *   activated: true
 * })
 */
export function generateHeartbeatMonitor(
  app: UrlListConfig,
  tier: string,
  monitor: HeartbeatMonitorConfig
): string {
  // Create Terraform resource ID
  const sanitizedMonitorName = sanitizeResourceId(monitor.name);
  const sanitizedAppName = sanitizeResourceId(app.appName);
  const resourceId = sanitizeResourceId(
    `${sanitizedMonitorName}_${sanitizedAppName}_${tier}_heartbeat_monitor`
  );

  // Create display name
  const name = `${monitor.name} ${sanitizedAppName} ${tier}`;

  // Format tags - merge user-provided tags with auto-generated
  const autoTags = [tier, sanitizedAppName, 'cli'];
  const userTags = monitor.tags ?? [];
  const allTags = [...new Set([...autoTags, ...userTags])]; // Deduplicate
  const tagsHCL = formatHCLList(allTags);

  // use_global_alert_settings field
  const useGlobalAlertSettings = monitor.use_global_alert_settings !== undefined
    ? monitor.use_global_alert_settings
    : false;

  // Generate optional blocks
  let alertSettingsHCL = '';
  if (monitor.alert_settings) {
    alertSettingsHCL = '\n\n' + generateAlertSettingsBlock(monitor.alert_settings, 2);
  }

  // Build optional monitor-level fields
  let mutedHCL = '';
  if (monitor.muted !== undefined) {
    mutedHCL = `\n  muted = ${formatHCLBool(monitor.muted)}`;
  }

  return `resource "checkly_heartbeat_monitor" "${resourceId}" {
  name                      = "${name}"
  activated                 = ${formatHCLBool(monitor.activated)}
  tags                      = ${tagsHCL}
  use_global_alert_settings = ${formatHCLBool(useGlobalAlertSettings)}${mutedHCL}

  heartbeat {
    period      = ${monitor.period}
    period_unit = "${monitor.period_unit}"
    grace       = ${monitor.grace}
    grace_unit  = "${monitor.grace_unit}"
  }${alertSettingsHCL}
}`;
}
