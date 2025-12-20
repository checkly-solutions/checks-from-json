/**
 * Generator for Checkly API check resources
 * Creates checkly_check resources with type="API"
 */

import { ApiCheckConfig, UrlListConfig } from '../types/json-types';
import { sanitizeResourceId } from '../utils/sanitizeResourceId';
import { parseAssertion } from '../utils/parseAssertions';
import { mapAssertionToTerraform, generateAssertionBlock } from '../utils/assertionMapper';
import { formatHCLList, formatHCLBool, formatHCLMap, wrapHeredoc } from '../utils/formatHCL';
import { readScript } from '../utils/fileUtils';
import {
  DEFAULT_DEGRADED_RESPONSE_TIME,
  DEFAULT_MAX_RESPONSE_TIME,
} from '../config/constants';

/**
 * Generate HCL for an API check resource
 *
 * @param app - The application configuration object
 * @param tier - The tier name (app1, app2, app3, or app4)
 * @param check - The API check configuration
 * @param groupResourceId - The Terraform resource ID of the parent group
 * @returns HCL resource block as a string
 *
 * @example
 * generateAPICheck(app, "app1", {
 *   url: "https://api.example.com/health",
 *   method: "GET",
 *   frequency: 5,
 *   activated: true,
 *   urlShort: "service-1",
 *   assertions: [["statusCode().equals(200)"]],
 *   headers: [{ "Authorization": "Bearer token" }]
 * }, "env_observability_app1_group")
 */
export function generateAPICheck(
  app: UrlListConfig,
  tier: string,
  check: ApiCheckConfig,
  groupResourceId: string
): string {
  // Create Terraform resource ID
  const resourceId = sanitizeResourceId(
    `${check.urlShort}_${app.appName}_${tier}_api`
  );

  // Create display name
  const sanitizedAppName = sanitizeResourceId(app.appName);
  const name = `${check.urlShort} ${sanitizedAppName} ${tier}`;

  // Format tags
  const tags = ['API', sanitizedAppName, tier, 'cli'];
  const tagsHCL = formatHCLList(tags);

  // Parse and map assertions
  const assertionsHCL = check.assertions
    .map((assertionArray) => {
      const assertionString = assertionArray[0];
      const parsed = parseAssertion(assertionString);
      const mapped = mapAssertionToTerraform(parsed);
      return generateAssertionBlock(mapped, 4);
    })
    .join('\n\n');

  // Handle setup script if present
  let setupScriptHCL = '';
  if (check.setup && check.setup.length > 0) {
    try {
      const scriptContent = readScript(check.setup);
      setupScriptHCL = `\n    setup_script = ${wrapHeredoc(scriptContent, 'SETUP')}\n`;
    } catch (error) {
      // If script file not found, skip setup script
      console.warn(`Warning: Setup script not found: ${check.setup}`);
    }
  }

  // Handle headers if present
  let headersHCL = '';
  if (check.headers && check.headers.length > 0) {
    // Convert array of objects to single object
    const headersObj: { [key: string]: string } = {};
    check.headers.forEach((header) => {
      const key = Object.keys(header)[0];
      headersObj[key] = header[key];
    });

    headersHCL = `\n    headers = ${formatHCLMap(headersObj, 4)}\n`;
  }

  // Get shouldFail flag (default to false)
  const shouldFail = check.shouldFail !== undefined ? check.shouldFail : false;

  return `resource "checkly_check" "${resourceId}" {
  name                   = "${name}"
  type                   = "API"
  activated              = ${formatHCLBool(check.activated)}
  frequency              = ${check.frequency}
  group_id               = checkly_check_group.${groupResourceId}.id
  tags                   = ${tagsHCL}
  should_fail            = ${formatHCLBool(shouldFail)}
  degraded_response_time = ${DEFAULT_DEGRADED_RESPONSE_TIME}
  max_response_time      = ${DEFAULT_MAX_RESPONSE_TIME}

  request {
    url              = "${check.url}"
    method           = "${check.method}"
    follow_redirects = ${formatHCLBool(true)}
    skip_ssl         = ${formatHCLBool(true)}${setupScriptHCL}${headersHCL}

${assertionsHCL}
  }
}`;
}
