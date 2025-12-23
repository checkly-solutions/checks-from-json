/**
 * Multi-step check transformer - creates Terraform multi-step check resources
 * Based on spec section 7.8 and CLI code at createMultiStep.ts
 */

import { AppConfig, MultiStepCheckConfig } from '../types/urlList.types';
import { TerraformCheck, TerraformCheckGroup } from '../types/terraform.types';
import { generateResourceId } from '../generators/resource-id-generator';
import { loadScript } from '../parsers/script-loader';
import { sanitize } from '../utils/sanitize';

/**
 * Transform a multi-step check from JSON to Terraform resource
 *
 * Integrates:
 * - Script loading (loads Playwright script from filePath)
 * - Group reference (links to check group)
 *
 * @param app - Application configuration
 * @param tier - Tier name (app1, app2, app3, app4)
 * @param check - Multi-step check configuration from JSON
 * @param checkGroup - Check group resource (for group_id reference)
 * @returns Terraform multi-step check resource
 *
 * @example
 * const multiCheck = transformMultiStepCheck(app, 'app1', checkConfig, group)
 * // => { resourceType: 'checkly_check', type: 'MULTI_STEP', ... }
 */
export function transformMultiStepCheck(
  app: AppConfig,
  tier: string,
  check: MultiStepCheckConfig,
  checkGroup: TerraformCheckGroup
): TerraformCheck {
  const appName = app.appName;
  const sanitizedAppName = sanitize(appName);

  // Generate resource ID
  const resourceId = generateResourceId('multistep', appName, tier, check.urlShort);

  // Load Playwright script
  const script = loadScript(check.filePath);

  // Build Terraform resource
  const resource: TerraformCheck = {
    resourceType: 'checkly_check',
    resourceId,
    fileName: 'checks_multistep.tf',
    attributes: {
      name: `${check.urlShort} ${sanitizedAppName} ${tier}`,
      type: 'MULTI_STEP',
      activated: check.activated,
      frequency: check.frequency,
      group_id: `checkly_check_group.${checkGroup.resourceId}.id`,
      tags: ['MULTI_STEP', sanitizedAppName, tier, 'cli'],
      locations: ['us-east-1', 'us-west-2'],
      runtime_id: '2023.09',
      script
    }
  };

  return resource;
}
