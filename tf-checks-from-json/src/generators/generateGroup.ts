/**
 * Generator for Checkly check group resources
 * Creates checkly_check_group resources with consistent configuration
 */

import { sanitizeResourceId } from '../utils/sanitizeResourceId';
import { formatHCLList, formatHCLBool } from '../utils/formatHCL';
import {
  DEFAULT_LOCATIONS,
  DEFAULT_CONCURRENCY,
  ALL_ALERT_CHANNEL_IDS,
} from '../config/constants';

/**
 * Generate HCL for a check group resource
 *
 * @param appName - The application/environment name
 * @param tier - The tier name (app1, app2, app3, or app4)
 * @returns HCL resource block as a string
 *
 * @example
 * generateGroup("Env-Observability", "app1")
 * // Returns:
 * // resource "checkly_check_group" "env_observability_app1_group" {
 * //   name        = "Env-Observability app1 Group"
 * //   activated   = true
 * //   muted       = false
 * //   concurrency = 100
 * //   locations   = ["us-east-1", "us-west-2"]
 * //   tags        = ["env-observability", "app1"]
 * //
 * //   alert_channel_subscription {
 * //     channel_id = checkly_alert_channel.email_tier_1.id
 * //     activated  = true
 * //   }
 * //   ... (subscriptions for all tiers)
 * // }
 */
export function generateGroup(appName: string, tier: string): string {
  // Create Terraform resource ID
  const resourceId = sanitizeResourceId(`${appName}_${tier}_group`);

  // Create display name (preserve original casing)
  const name = `${appName} ${tier} Group`;

  // Create sanitized app name for tags
  const sanitizedAppName = sanitizeResourceId(appName);

  // Format locations list
  const locationsHCL = formatHCLList(DEFAULT_LOCATIONS);

  // Format tags list
  const tagsHCL = formatHCLList([sanitizedAppName, tier]);

  // Generate alert channel subscriptions
  const subscriptionsHCL = ALL_ALERT_CHANNEL_IDS.map((channelId) =>
    generateAlertChannelSubscription(channelId)
  ).join('\n\n');

  return `resource "checkly_check_group" "${resourceId}" {
  name        = "${name}"
  activated   = ${formatHCLBool(true)}
  muted       = ${formatHCLBool(false)}
  concurrency = ${DEFAULT_CONCURRENCY}
  locations   = ${locationsHCL}
  tags        = ${tagsHCL}

${subscriptionsHCL}
}`;
}

/**
 * Generate an alert channel subscription block for a group
 *
 * @param channelId - The alert channel resource ID
 * @returns HCL alert_channel_subscription block
 *
 * @example
 * generateAlertChannelSubscription("email_tier_1")
 * // Returns:
 * //   alert_channel_subscription {
 * //     channel_id = checkly_alert_channel.email_tier_1.id
 * //     activated  = true
 * //   }
 */
function generateAlertChannelSubscription(channelId: string): string {
  return `  alert_channel_subscription {
    channel_id = checkly_alert_channel.${channelId}.id
    activated  = ${formatHCLBool(true)}
  }`;
}
