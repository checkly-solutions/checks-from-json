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
import { formatHCLValue } from '../utils/variableResolver';
import {
  generateAlertSettingsBlock,
  generateRetryStrategyBlock,
  generateEnvironmentVariablesBlock,
} from '../utils/hclBlockGenerators';
import {
  DEFAULT_DEGRADED_RESPONSE_TIME,
  DEFAULT_MAX_RESPONSE_TIME,
  DEFAULT_RUNTIME_ID,
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

  // Handle query parameters if present
  let queryParamsHCL = '';
  if (check.query_parameters) {
    queryParamsHCL = `\n    query_parameters = ${formatHCLMap(check.query_parameters, 4)}\n`;
  }

  // Handle basic auth if present
  let basicAuthHCL = '';
  if (check.basic_auth) {
    const username = formatHCLValue(check.basic_auth.username);
    const password = formatHCLValue(check.basic_auth.password);
    basicAuthHCL = `\n\n    basic_auth {
      username = ${username}
      password = ${password}
    }`;
  }

  // Handle request body if present
  let bodyHCL = '';
  if (check.body) {
    // Escape the body content for HCL
    const escapedBody = check.body.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    bodyHCL = `\n    body = "${escapedBody}"`;
  }

  let bodyTypeHCL = '';
  if (check.body_type) {
    bodyTypeHCL = `\n    body_type = "${check.body_type}"`;
  }

  // Handle IP family if present
  let ipFamilyHCL = '';
  if (check.ip_family) {
    ipFamilyHCL = `\n    ip_family = "${check.ip_family}"`;
  }

  // Get follow_redirects and skip_ssl (with defaults)
  const followRedirects = check.follow_redirects !== undefined ? check.follow_redirects : true;
  const skipSsl = check.skip_ssl !== undefined ? check.skip_ssl : true;

  // Get shouldFail flag (default to false)
  const shouldFail = check.shouldFail !== undefined ? check.shouldFail : false;

  // Get response time thresholds (with defaults)
  const degradedTime = check.degraded_response_time ?? DEFAULT_DEGRADED_RESPONSE_TIME;
  const maxTime = check.max_response_time ?? DEFAULT_MAX_RESPONSE_TIME;

  // Get runtime_id if present
  const runtimeId = check.runtime_id ?? DEFAULT_RUNTIME_ID;

  // Generate optional blocks
  let alertSettingsHCL = '';
  if (check.alert_settings) {
    alertSettingsHCL = '\n\n' + generateAlertSettingsBlock(check.alert_settings, 2);
  }

  let retryStrategyHCL = '';
  if (check.retry_strategy) {
    retryStrategyHCL = '\n\n' + generateRetryStrategyBlock(check.retry_strategy, 2);
  }

  let environmentVariablesHCL = '';
  if (check.environment_variables && check.environment_variables.length > 0) {
    environmentVariablesHCL = '\n\n' + generateEnvironmentVariablesBlock(check.environment_variables, 2);
  }

  // use_global_alert_settings field
  const useGlobalAlertSettings = check.use_global_alert_settings !== undefined
    ? check.use_global_alert_settings
    : false;

  // Handle local setup script if present
  let localSetupScriptHCL = '';
  if (check.local_setup_script) {
    try {
      const scriptContent = readScript(check.local_setup_script);
      localSetupScriptHCL = `\n  local_setup_script = ${wrapHeredoc(scriptContent, 'SETUP')}`;
    } catch (error) {
      console.warn(`Warning: Local setup script not found: ${check.local_setup_script}`);
    }
  }

  // Handle local teardown script if present
  let localTeardownScriptHCL = '';
  if (check.local_teardown_script) {
    try {
      const scriptContent = readScript(check.local_teardown_script);
      localTeardownScriptHCL = `\n  local_teardown_script = ${wrapHeredoc(scriptContent, 'TEARDOWN')}`;
    } catch (error) {
      console.warn(`Warning: Local teardown script not found: ${check.local_teardown_script}`);
    }
  }

  // Handle setup snippet reference if present
  let setupSnippetHCL = '';
  if (check.setup_snippet_id) {
    const snippetResourceId = sanitizeResourceId(`snippet_${check.setup_snippet_id}`);
    setupSnippetHCL = `\n  setup_snippet_id = checkly_snippet.${snippetResourceId}.id`;
  }

  // Handle teardown snippet reference if present
  let teardownSnippetHCL = '';
  if (check.teardown_snippet_id) {
    const snippetResourceId = sanitizeResourceId(`snippet_${check.teardown_snippet_id}`);
    teardownSnippetHCL = `\n  teardown_snippet_id = checkly_snippet.${snippetResourceId}.id`;
  }

  // Build optional check-level fields
  let groupOrderHCL = '';
  if (check.group_order !== undefined) {
    groupOrderHCL = `\n  group_order = ${check.group_order}`;
  }

  let frequencyOffsetHCL = '';
  if (check.frequency_offset !== undefined) {
    frequencyOffsetHCL = `\n  frequency_offset = ${check.frequency_offset}`;
  }

  let locationsHCL = '';
  if (check.locations && check.locations.length > 0) {
    locationsHCL = `\n  locations = ${formatHCLList(check.locations)}`;
  }

  let mutedHCL = '';
  if (check.muted !== undefined) {
    mutedHCL = `\n  muted = ${formatHCLBool(check.muted)}`;
  }

  let sslCheckDomainHCL = '';
  if (check.ssl_check_domain) {
    sslCheckDomainHCL = `\n  ssl_check_domain = "${check.ssl_check_domain}"`;
  }

  return `resource "checkly_check" "${resourceId}" {
  name                      = "${name}"
  type                      = "API"
  activated                 = ${formatHCLBool(check.activated)}
  frequency                 = ${check.frequency}
  group_id                  = checkly_check_group.${groupResourceId}.id
  tags                      = ${tagsHCL}
  should_fail               = ${formatHCLBool(shouldFail)}
  degraded_response_time    = ${degradedTime}
  max_response_time         = ${maxTime}
  runtime_id                = "${runtimeId}"
  use_global_alert_settings = ${formatHCLBool(useGlobalAlertSettings)}${groupOrderHCL}${frequencyOffsetHCL}${locationsHCL}${mutedHCL}${sslCheckDomainHCL}${localSetupScriptHCL}${localTeardownScriptHCL}${setupSnippetHCL}${teardownSnippetHCL}

  request {
    url              = "${check.url}"
    method           = "${check.method}"
    follow_redirects = ${formatHCLBool(followRedirects)}
    skip_ssl         = ${formatHCLBool(skipSsl)}${ipFamilyHCL}${bodyHCL}${bodyTypeHCL}${setupScriptHCL}${headersHCL}${queryParamsHCL}${basicAuthHCL}

${assertionsHCL}
  }${alertSettingsHCL}${retryStrategyHCL}${environmentVariablesHCL}
}`;
}
