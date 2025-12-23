/**
 * Browser check transformer - creates Terraform browser check resources
 * Based on spec section 7.7 and CLI code at createBrowserCheck.ts
 */

import { AppConfig, BrowserCheckConfig } from '../types/urlList.types';
import { TerraformCheck, TerraformCheckGroup } from '../types/terraform.types';
import { generateResourceId } from '../generators/resource-id-generator';
import { loadScript } from '../parsers/script-loader';
import { sanitize } from '../utils/sanitize';

/**
 * Transform a browser check from JSON to Terraform resource
 *
 * Integrates:
 * - Script loading (loads Playwright script from filePath)
 * - Group reference (links to check group)
 *
 * @param app - Application configuration
 * @param tier - Tier name (app1, app2, app3, app4)
 * @param check - Browser check configuration from JSON
 * @param checkGroup - Check group resource (for group_id reference)
 * @returns Terraform browser check resource
 *
 * @example
 * const browserCheck = transformBrowserCheck(app, 'app1', checkConfig, group)
 * // => { resourceType: 'checkly_check', type: 'BROWSER', ... }
 */
export function transformBrowserCheck(
  app: AppConfig,
  tier: string,
  check: BrowserCheckConfig,
  checkGroup: TerraformCheckGroup
): TerraformCheck {
  const appName = app.appName;
  const sanitizedAppName = sanitize(appName);

  // Generate resource ID
  const resourceId = generateResourceId('browser', appName, tier, check.urlShort);

  // Load Playwright script
  const script = loadScript(check.filePath);

  // Build Terraform resource
  const resource: TerraformCheck = {
    resourceType: 'checkly_check',
    resourceId,
    fileName: 'checks_browser.tf',
    attributes: {
      name: `${check.urlShort} ${sanitizedAppName} ${tier}`,
      type: 'BROWSER',
      activated: check.activated,
      frequency: check.frequency,
      group_id: `checkly_check_group.${checkGroup.resourceId}.id`,
      tags: ['BROWSER', sanitizedAppName, tier, 'cli'],
      locations: ['us-east-1', 'us-west-2'],
      runtime_id: '2023.09',
      script
    }
  };

  return resource;
}
