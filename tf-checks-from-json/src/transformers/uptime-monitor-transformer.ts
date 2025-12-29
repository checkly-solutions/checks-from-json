/**
 * Uptime monitor transformer - creates Terraform uptime monitor resources
 * Based on spec section 3.2 and 5.2
 */

import { AppConfig, UptimeCheckConfig, TierConfig } from '../types/urlList.types';
import { TerraformUrlMonitor } from '../types/terraform.types';
import { generateResourceId } from '../generators/resource-id-generator';
import { parseAssertion } from '../parsers/assertion-parser';
import { sanitize } from '../utils/sanitize';
import { resolveLocations } from '../utils/location-resolver';
import { TerraformCheckGroup } from '../types/terraform.types';

/**
 * Transform uptime check from JSON to Terraform URL monitor resource
 *
 * Validates uptime-specific constraints:
 * - URL must be valid HTTP/HTTPS
 * - Assertions limited to STATUS_CODE only
 * - No setup/teardown scripts
 *
 * @param app - Application configuration
 * @param tier - Tier name (app1, app2, app3, app4)
 * @param check - Uptime check configuration from JSON
 * @param checkGroup - Check group resource (for group_id reference)
 * @param tierConfig - Tier configuration (for location resolution)
 * @returns Terraform uptime monitor resource
 *
 * @example
 * const uptimeMonitor = transformUptimeMonitor(app, 'app1', check, checkGroup, tierConfig)
 * // => { resourceType: 'checkly_url_monitor', ... }
 */
export function transformUptimeMonitor(
  app: AppConfig,
  tier: string,
  check: UptimeCheckConfig,
  checkGroup: TerraformCheckGroup,
  tierConfig: TierConfig
): TerraformUrlMonitor {
  const appName = app.appName;
  const sanitizedAppName = sanitize(appName);

  // Validate URL
  validateUptimeCheck(check);

  // Generate resource ID
  const resourceId = generateResourceId('uptime', appName, tier, check.urlShort);

  // Resolve locations using 4-level precedence
  const locations = resolveLocations(check, tierConfig, app, 'uptime');

  // Parse assertions (STATUS_CODE only for uptime monitors)
  const assertions = check.assertions
    ? check.assertions.flat().map(assertionString => {
        const parsed = parseAssertion(assertionString);

        // Validate STATUS_CODE only
        if (parsed.source !== 'STATUS_CODE') {
          throw new Error(
            `Invalid assertion for uptime monitor "${check.urlShort}": ` +
            `Only STATUS_CODE assertions are supported. Got: ${parsed.source}`
          );
        }

        return parsed;
      })
    : [{ source: 'STATUS_CODE', comparison: 'EQUALS', target: '200' }];  // Default assertion

  // Build Terraform resource
  const resource: TerraformUrlMonitor = {
    resourceType: 'checkly_url_monitor',
    resourceId,
    fileName: 'monitors_uptime.tf',
    attributes: {
      name: `${check.urlShort} ${sanitizedAppName} ${tier}`,
      activated: check.activated,
      frequency: check.frequency,
      locations,
      group_id: `checkly_check_group.${checkGroup.resourceId}.id`,
      tags: ['UPTIME', sanitizedAppName, tier, 'cli'],
      degraded_response_time: check.degradedResponseTime || 3000,
      max_response_time: check.maxResponseTime || 5000,
      should_fail: check.shouldFail || false,
      use_global_alert_settings: false,
      request: {
        url: check.url,
        follow_redirects: check.followRedirects ?? true,
        skip_ssl: check.skipSsl ?? false,
        assertion: assertions
      }
    }
  };

  return resource;
}

/**
 * Validate uptime check configuration
 *
 * @param check - Uptime check to validate
 * @throws Error if validation fails
 */
function validateUptimeCheck(check: UptimeCheckConfig): void {
  // URL validation
  if (!check.url || check.url.trim() === '') {
    throw new Error(`Uptime monitor missing required 'url' field`);
  }

  if (!isValidHttpUrl(check.url)) {
    throw new Error(
      `Invalid URL for uptime monitor "${check.urlShort}": ${check.url}. ` +
      `Must be valid HTTP/HTTPS endpoint.`
    );
  }
}

/**
 * Validate HTTP/HTTPS URL
 *
 * @param url - URL to validate
 * @returns true if valid HTTP/HTTPS URL
 */
function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
