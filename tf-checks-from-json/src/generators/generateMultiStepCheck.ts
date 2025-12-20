/**
 * Generator for Checkly multi-step check resources
 * Creates checkly_check resources with type="MULTI_STEP"
 */

import { MultiStepCheckConfig, UrlListConfig } from '../types/json-types';
import { sanitizeResourceId } from '../utils/sanitizeResourceId';
import { formatHCLList, formatHCLBool, wrapHeredoc } from '../utils/formatHCL';
import { readScript } from '../utils/fileUtils';
import { DEFAULT_RUNTIME_ID } from '../config/constants';

/**
 * Generate HCL for a multi-step check resource
 *
 * @param app - The application configuration object
 * @param tier - The tier name (app1, app2, app3, or app4)
 * @param check - The multi-step check configuration
 * @param groupResourceId - The Terraform resource ID of the parent group
 * @returns HCL resource block as a string
 *
 * @example
 * generateMultiStepCheck(app, "app1", {
 *   filePath: "/multi-scripts/multi-CRUD.spec.ts",
 *   frequency: 5,
 *   activated: true,
 *   urlShort: "service-2"
 * }, "env_observability_app1_group")
 */
export function generateMultiStepCheck(
  app: UrlListConfig,
  tier: string,
  check: MultiStepCheckConfig,
  groupResourceId: string
): string {
  // Create Terraform resource ID
  const resourceId = sanitizeResourceId(
    `${check.urlShort}_${app.appName}_${tier}_multi`
  );

  // Create display name
  const sanitizedAppName = sanitizeResourceId(app.appName);
  const name = `${check.urlShort} ${sanitizedAppName} ${tier}`;

  // Format tags
  const tags = [tier, sanitizedAppName, 'cli'];
  const tagsHCL = formatHCLList(tags);

  // Read and inline the script file
  let scriptContent: string;
  try {
    scriptContent = readScript(check.filePath);
  } catch (error) {
    throw new Error(
      `Failed to read multi-step script file: ${check.filePath}. Error: ${error}`
    );
  }

  // Wrap script in heredoc
  const scriptHCL = wrapHeredoc(scriptContent, 'EOT');

  return `resource "checkly_check" "${resourceId}" {
  name       = "${name}"
  type       = "MULTI_STEP"
  activated  = ${formatHCLBool(check.activated)}
  frequency  = ${check.frequency}
  group_id   = checkly_check_group.${groupResourceId}.id
  tags       = ${tagsHCL}
  runtime_id = "${DEFAULT_RUNTIME_ID}"

  script = ${scriptHCL}
}`;
}
