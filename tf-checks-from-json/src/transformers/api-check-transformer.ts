/**
 * API check transformer - creates Terraform API check resources
 * Based on spec section 7.6 and CLI code at createAPIcheck.ts
 */

import { AppConfig, ApiCheckConfig } from '../types/urlList.types';
import { TerraformCheck, TerraformCheckGroup } from '../types/terraform.types';
import { generateResourceId } from '../generators/resource-id-generator';
import { parseAssertion } from '../parsers/assertion-parser';
import { loadScript } from '../parsers/script-loader';
import { sanitize } from '../utils/sanitize';

/**
 * Transform headers array to headers map
 *
 * CLI format: [{"X-API-Key": "secret"}, {"Content-Type": "application/json"}]
 * Terraform format: {"X-API-Key": "secret", "Content-Type": "application/json"}
 *
 * @param headersArray - Array of header objects
 * @returns Headers map
 */
function transformHeaders(headersArray: Array<{[key: string]: string}>): {[key: string]: string} {
  const headersMap: {[key: string]: string} = {};

  for (const header of headersArray) {
    const key = Object.keys(header)[0];
    const value = header[key];
    headersMap[key] = value;
  }

  return headersMap;
}

/**
 * Transform an API check from JSON to Terraform resource
 *
 * Integrates:
 * - Assertion parser (converts assertion strings to Terraform format)
 * - Headers transformation (array → map)
 * - Setup script loading (if specified)
 * - Group reference (links to check group)
 *
 * @param app - Application configuration
 * @param tier - Tier name (app1, app2, app3, app4)
 * @param check - API check configuration from JSON
 * @param checkGroup - Check group resource (for group_id reference)
 * @returns Terraform API check resource
 *
 * @example
 * const apiCheck = transformApiCheck(app, 'app1', checkConfig, group)
 * // => { resourceType: 'checkly_check', type: 'API', ... }
 */
export function transformApiCheck(
  app: AppConfig,
  tier: string,
  check: ApiCheckConfig,
  checkGroup: TerraformCheckGroup
): TerraformCheck {
  const appName = app.appName;
  const sanitizedAppName = sanitize(appName);

  // Generate resource ID
  const resourceId = generateResourceId('api', appName, tier, check.urlShort);

  // Parse assertions (flatten nested arrays and parse each string)
  const assertions = check.assertions.flat().map(assertionString => {
    return parseAssertion(assertionString);
  });

  // Transform headers (if present)
  const headers = check.headers ? transformHeaders(check.headers) : undefined;

  // Load setup script (if present and non-empty)
  const setupScript = (check.setup && check.setup.length > 0)
    ? loadScript(check.setup)
    : undefined;

  // Build Terraform resource
  const resource: TerraformCheck = {
    resourceType: 'checkly_check',
    resourceId,
    fileName: 'checks_api.tf',
    attributes: {
      name: `${check.urlShort} ${sanitizedAppName} ${tier}`,
      type: 'API',
      activated: check.activated,
      frequency: check.frequency,
      group_id: `checkly_check_group.${checkGroup.resourceId}.id`,
      tags: ['API', sanitizedAppName, tier, 'cli'],
      degraded_response_time: 10000,
      max_response_time: 20000,
      should_fail: check.shouldFail || false,
      locations: ['us-east-1', 'us-west-2'],
      request: {
        url: check.url,
        method: check.method,
        follow_redirects: true,
        skip_ssl: true,
        assertion: assertions
      }
    }
  };

  // Add optional fields only if present
  if (headers) {
    resource.attributes.request!.headers = headers;
  }

  if (setupScript) {
    resource.attributes.local_setup_script = setupScript;
  }

  return resource;
}
