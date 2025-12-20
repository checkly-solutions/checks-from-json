/**
 * Generator for Checkly browser check resources
 * Creates checkly_check resources with type="BROWSER"
 */

import { BrowserCheckConfig, UrlListConfig } from '../types/json-types';
import { sanitizeResourceId } from '../utils/sanitizeResourceId';
import { formatHCLList, formatHCLBool, wrapHeredoc } from '../utils/formatHCL';
import { readScript } from '../utils/fileUtils';
import { DEFAULT_RUNTIME_ID } from '../config/constants';

/**
 * Generate HCL for a browser check resource
 *
 * @param app - The application configuration object
 * @param tier - The tier name (app1, app2, app3, or app4)
 * @param check - The browser check configuration
 * @param groupResourceId - The Terraform resource ID of the parent group
 * @returns HCL resource block as a string
 *
 * @example
 * generateBrowserCheck(app, "app1", {
 *   filePath: "/browser-scripts/visit.spec.ts",
 *   frequency: 5,
 *   activated: true,
 *   urlShort: "app-userflow"
 * }, "env_observability_app1_group")
 */
export function generateBrowserCheck(
  app: UrlListConfig,
  tier: string,
  check: BrowserCheckConfig,
  groupResourceId: string
): string {
  // Create Terraform resource ID
  const resourceId = sanitizeResourceId(
    `${check.urlShort}_${app.appName}_${tier}_browser`
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
      `Failed to read browser script file: ${check.filePath}. Error: ${error}`
    );
  }

  // Wrap script in heredoc
  const scriptHCL = wrapHeredoc(scriptContent, 'EOT');

  return `resource "checkly_check" "${resourceId}" {
  name       = "${name}"
  type       = "BROWSER"
  activated  = ${formatHCLBool(check.activated)}
  frequency  = ${check.frequency}
  group_id   = checkly_check_group.${groupResourceId}.id
  tags       = ${tagsHCL}
  runtime_id = "${DEFAULT_RUNTIME_ID}"

  script = ${scriptHCL}
}`;
}
