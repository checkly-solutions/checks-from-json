/**
 * Generator for Checkly dashboard resources
 * Creates checkly_dashboard resources for application monitoring dashboards
 */

import { sanitizeResourceId, createSlug } from '../utils/sanitizeResourceId';
import { formatHCLList } from '../utils/formatHCL';
import { DEFAULT_DASHBOARD_LOGO } from '../config/constants';

/**
 * Generate HCL for a dashboard resource
 *
 * @param appName - The application/environment name
 * @returns HCL resource block as a string
 *
 * @example
 * generateDashboard("Env-Observability")
 * // Returns:
 * // resource "checkly_dashboard" "env_observability_dashboard" {
 * //   custom_url  = "env-observability-dashboard"
 * //   custom_domain = ""
 * //   logo        = "https://www.checklyhq.com/images/text_racoon_logo.svg"
 * //   header      = "Env-Observability Dashboard"
 * //   description = "Monitoring dashboard for Env-Observability"
 * //   tags        = ["env-observability"]
 * // }
 */
export function generateDashboard(appName: string): string {
  // Create Terraform resource ID
  const resourceId = sanitizeResourceId(`${appName}_dashboard`);

  // Create custom URL slug
  const customUrl = `${createSlug(appName)}-dashboard`;

  // Create header
  const header = `${appName} Dashboard`;

  // Create description
  const description = `Monitoring dashboard for ${appName}`;

  // Create sanitized app name for tags
  const sanitizedAppName = sanitizeResourceId(appName);

  // Format tags
  const tagsHCL = formatHCLList([sanitizedAppName]);

  return `resource "checkly_dashboard" "${resourceId}" {
  custom_url    = "${customUrl}"
  custom_domain = ""
  logo          = "${DEFAULT_DASHBOARD_LOGO}"
  header        = "${header}"
  description   = "${description}"

  tags = ${tagsHCL}
}`;
}
