/**
 * Resource ID generator for Terraform resources
 * Based on spec section 6.2
 */

import { sanitize } from '../utils/sanitize';

/**
 * Resource types supported by the generator
 */
export type ResourceType =
  | 'api'
  | 'browser'
  | 'multistep'
  | 'uptime'
  | 'group'
  | 'dashboard'
  | 'email'
  | 'webhook';

/**
 * Generate a unique Terraform resource ID
 *
 * Format patterns:
 * - API/Browser/Multi-step: {type}_{urlShort}_{appName}_{tier}
 * - Group: group_{appName}_{tier}
 * - Dashboard: dashboard_{appName}
 * - Email/Webhook: {type}_{tier}_{appName}_{urlShort}
 *
 * All components are sanitized (lowercase, non-alphanumeric → underscore)
 *
 * @param resourceType - Type of resource
 * @param appName - Application name
 * @param tier - Tier name (app1, app2, app3, app4) - optional for dashboards
 * @param urlShort - Short URL identifier - optional for groups and dashboards
 * @returns Sanitized, unique Terraform resource ID
 *
 * @example
 * generateResourceId('api', 'Env-Observability', 'app1', 'books-api')
 * // => "api_books_api_env_observability_app1"
 *
 * generateResourceId('dashboard', 'Env-Observability')
 * // => "dashboard_env_observability"
 */
export function generateResourceId(
  resourceType: ResourceType,
  appName: string,
  tier?: string,
  urlShort?: string
): string {
  // Build parts array based on resource type
  const parts: string[] = [];

  switch (resourceType) {
    case 'api':
    case 'browser':
    case 'multistep':
    case 'uptime':
      // Pattern: {type}_{urlShort}_{appName}_{tier}
      if (urlShort) parts.push(sanitize(urlShort));
      parts.push(sanitize(appName));
      if (tier) parts.push(sanitize(tier));
      parts.unshift(resourceType);
      break;

    case 'group':
      // Pattern: group_{appName}_{tier}
      parts.push('group', sanitize(appName));
      if (tier) parts.push(sanitize(tier));
      break;

    case 'dashboard':
      // Pattern: dashboard_{appName}
      parts.push('dashboard', sanitize(appName));
      break;

    case 'email':
    case 'webhook':
      // Pattern: {type}_{urlShort}_{appName}_{tier}
      // For alert channels: urlShort is the tier number
      parts.push(resourceType);
      if (urlShort) parts.push(sanitize(urlShort));
      parts.push(sanitize(appName));
      if (tier) parts.push(sanitize(tier));
      break;
  }

  // Filter out empty strings and join
  return parts.filter(p => p.length > 0).join('_');
}
