/**
 * Check group transformer - creates Terraform check group resources
 * Based on spec section 7.9 and CLI code at createGroup.ts
 */

import { AppConfig, TierConfig } from '../types/urlList.types';
import { TerraformCheckGroup, TerraformAlertChannel } from '../types/terraform.types';
import { generateResourceId } from '../generators/resource-id-generator';
import { sanitize } from '../utils/sanitize';
import { resolveLocations } from '../utils/location-resolver';

/**
 * Transform an app + tier to a Terraform check group resource
 *
 * Check groups organize checks and subscribe to alert channels.
 * All 12 alert channels are subscribed to every check group.
 *
 * @param app - Application configuration
 * @param tier - Tier name (app1, app2, app3, app4)
 * @param alertChannels - All alert channel resources (for subscriptions)
 * @returns Terraform check group resource
 *
 * @example
 * const group = transformCheckGroup(app, 'app1', alertChannels)
 * // => { resourceType: 'checkly_check_group', resourceId: 'group_env_observability_app1', ... }
 */
export function transformCheckGroup(
  app: AppConfig,
  tier: string,
  alertChannels: TerraformAlertChannel[],
  tierConfig: TierConfig
): TerraformCheckGroup {
  const appName = app.appName;
  const sanitizedAppName = sanitize(appName);

  // Generate resource ID
  const resourceId = generateResourceId('group', appName, tier);

  // Create alert channel subscriptions (all channels assigned to all groups)
  const alertChannelSubscriptions = alertChannels.map(channel => ({
    channel_id: `checkly_alert_channel.${channel.resourceId}.id`,
    activated: true
  }));

  // Build Terraform resource
  return {
    resourceType: 'checkly_check_group',
    resourceId,
    fileName: 'check_groups.tf',
    attributes: {
      name: `${appName} ${tier} Group`,
      activated: true,
      muted: false,
      concurrency: 100,
      locations: resolveLocations(null, tierConfig, app, 'browser'),
      tags: [sanitizedAppName, tier],
      runtime_id: '2023.09',
      alert_channel_subscription: alertChannelSubscriptions
    }
  };
}
