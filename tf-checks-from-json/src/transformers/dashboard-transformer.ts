/**
 * Dashboard transformer - creates Terraform dashboard resources
 * Based on spec section 7.10 and CLI code at createDashboard.ts
 */

import { AppConfig } from '../types/urlList.types';
import { TerraformDashboard } from '../types/terraform.types';
import { generateResourceId } from '../generators/resource-id-generator';
import { sanitize } from '../utils/sanitize';

/**
 * Transform an app configuration to a Terraform dashboard resource
 *
 * @param app - Application configuration
 * @returns Terraform dashboard resource
 *
 * @example
 * const dashboard = transformDashboard({ appName: 'Env-Observability', ... })
 * // => { resourceType: 'checkly_dashboard', resourceId: 'dashboard_env_observability', ... }
 */
export function transformDashboard(app: AppConfig): TerraformDashboard {
  const appName = app.appName;
  const sanitizedAppName = sanitize(appName);

  // Generate resource ID
  const resourceId = generateResourceId('dashboard', appName);

  // Custom URL must only contain alphanumeric and dashes (no underscores)
  // Replace underscores with dashes for Checkly custom URL validation
  const customUrl = `alpaca-test-${sanitizedAppName}-dashboard`.replace(/_/g, '-');

  // Build Terraform resource
  return {
    resourceType: 'checkly_dashboard',
    resourceId,
    fileName: 'dashboards.tf',
    attributes: {
      custom_url: customUrl,
      header: `${appName} Dashboard`,
      description: `Dashboard for ${appName}`,
      tags: [sanitizedAppName, 'cli'],
      use_tags_and_operator: false,
      logo: 'https://www.moviemaker.com/wp-content/uploads/2023/07/1200px-Universal_Pictures_logo.svg_-1900x1069.png'
    }
  };
}
