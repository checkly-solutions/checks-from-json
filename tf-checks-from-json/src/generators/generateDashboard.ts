/**
 * Generator for Checkly dashboard resources
 * Creates checkly_dashboard resources for application monitoring dashboards
 */

import { DashboardConfig } from '../types/json-types';
import { sanitizeResourceId, createSlug } from '../utils/sanitizeResourceId';
import { formatHCLList, formatHCLBool } from '../utils/formatHCL';
import { DEFAULT_DASHBOARD_LOGO } from '../config/constants';

/**
 * Generate HCL for a dashboard resource
 *
 * @param appName - The application/environment name
 * @param config - Optional dashboard configuration (if not provided, generates defaults)
 * @returns HCL resource block as a string
 *
 * @example
 * generateDashboard("Env-Observability", {
 *   custom_url: "my-dashboard",
 *   header: "Production Dashboard",
 *   refresh_rate: 60,
 *   show_p95: true
 * })
 */
export function generateDashboard(appName: string, config?: DashboardConfig): string {
  // Create Terraform resource ID
  const resourceId = sanitizeResourceId(`${appName}_dashboard`);

  // Use config values or generate defaults
  const customUrl = config?.custom_url ?? `${createSlug(appName)}-dashboard`;
  const header = config?.header ?? `${appName} Dashboard`;
  const description = config?.description ?? `Monitoring dashboard for ${appName}`;
  const logo = config?.logo ?? DEFAULT_DASHBOARD_LOGO;

  // Create sanitized app name for tags
  const sanitizedAppName = sanitizeResourceId(appName);
  const tagsHCL = formatHCLList([sanitizedAppName]);

  // Build optional fields
  let customDomainHCL = '';
  if (config?.custom_domain) {
    customDomainHCL = `\n  custom_domain = "${config.custom_domain}"`;
  }

  let refreshRateHCL = '';
  if (config?.refresh_rate !== undefined) {
    refreshRateHCL = `\n  refresh_rate = ${config.refresh_rate}`;
  }

  let widthHCL = '';
  if (config?.width) {
    widthHCL = `\n  width = "${config.width}"`;
  }

  let showHeaderHCL = '';
  if (config?.show_header !== undefined) {
    showHeaderHCL = `\n  show_header = ${formatHCLBool(config.show_header)}`;
  }

  let showP95HCL = '';
  if (config?.show_p95 !== undefined) {
    showP95HCL = `\n  show_p95 = ${formatHCLBool(config.show_p95)}`;
  }

  let showP99HCL = '';
  if (config?.show_p99 !== undefined) {
    showP99HCL = `\n  show_p99 = ${formatHCLBool(config.show_p99)}`;
  }

  let showCheckRunLinksHCL = '';
  if (config?.show_check_run_links !== undefined) {
    showCheckRunLinksHCL = `\n  show_check_run_links = ${formatHCLBool(config.show_check_run_links)}`;
  }

  let expandChecksHCL = '';
  if (config?.expand_checks !== undefined) {
    expandChecksHCL = `\n  expand_checks = ${formatHCLBool(config.expand_checks)}`;
  }

  let paginateHCL = '';
  if (config?.paginate !== undefined) {
    paginateHCL = `\n  paginate = ${formatHCLBool(config.paginate)}`;
  }

  let paginationRateHCL = '';
  if (config?.pagination_rate !== undefined) {
    paginationRateHCL = `\n  pagination_rate = ${config.pagination_rate}`;
  }

  let checksPerPageHCL = '';
  if (config?.checks_per_page !== undefined) {
    checksPerPageHCL = `\n  checks_per_page = ${config.checks_per_page}`;
  }

  let useTagsAndOperatorHCL = '';
  if (config?.use_tags_and_operator !== undefined) {
    useTagsAndOperatorHCL = `\n  use_tags_and_operator = ${formatHCLBool(config.use_tags_and_operator)}`;
  }

  let hideTagsHCL = '';
  if (config?.hide_tags !== undefined) {
    hideTagsHCL = `\n  hide_tags = ${formatHCLBool(config.hide_tags)}`;
  }

  let isPrivateHCL = '';
  if (config?.is_private !== undefined) {
    isPrivateHCL = `\n  is_private = ${formatHCLBool(config.is_private)}`;
  }

  let enableIncidentsHCL = '';
  if (config?.enable_incidents !== undefined) {
    enableIncidentsHCL = `\n  enable_incidents = ${formatHCLBool(config.enable_incidents)}`;
  }

  let customCssHCL = '';
  if (config?.custom_css) {
    // Escape the CSS content for HCL
    const escapedCss = config.custom_css.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    customCssHCL = `\n  custom_css = "${escapedCss}"`;
  }

  let faviconHCL = '';
  if (config?.favicon) {
    faviconHCL = `\n  favicon = "${config.favicon}"`;
  }

  let linkHCL = '';
  if (config?.link) {
    linkHCL = `\n  link = "${config.link}"`;
  }

  return `resource "checkly_dashboard" "${resourceId}" {
  custom_url  = "${customUrl}"
  logo        = "${logo}"
  header      = "${header}"
  description = "${description}"${customDomainHCL}${refreshRateHCL}${widthHCL}${showHeaderHCL}${showP95HCL}${showP99HCL}${showCheckRunLinksHCL}${expandChecksHCL}${paginateHCL}${paginationRateHCL}${checksPerPageHCL}${useTagsAndOperatorHCL}${hideTagsHCL}${isPrivateHCL}${enableIncidentsHCL}${customCssHCL}${faviconHCL}${linkHCL}

  tags = ${tagsHCL}
}`;
}
