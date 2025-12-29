/**
 * Location resolution utility
 * Implements 4-level precedence: check > tier > global > hardcoded defaults
 */

import { AppConfig, TierConfig } from '../types/urlList.types';

/**
 * Check type for determining hardcoded defaults
 */
export type CheckType = 'api' | 'browser' | 'multi_step' | 'uptime';

/**
 * Resolve locations using 4-level precedence hierarchy
 *
 * Precedence (highest to lowest):
 * 1. Check-level locations (check.locations)
 * 2. Tier-level locations (tierConfig.locations)
 * 3. Global default locations (app.globalConfig.defaultLocations)
 * 4. Hardcoded defaults (based on check type)
 *
 * @param check - Individual check configuration (may have locations field)
 * @param tierConfig - Tier configuration (may have locations field)
 * @param app - Application configuration (may have globalConfig.defaultLocations)
 * @param checkType - Type of check for hardcoded defaults
 * @returns Resolved locations array
 */
export function resolveLocations(
  check: { locations?: string[] } | null,
  tierConfig: TierConfig | null,
  app: AppConfig,
  checkType: CheckType
): string[] {
  // 1. Check-level locations (highest precedence)
  if (check?.locations && check.locations.length > 0) {
    return check.locations;
  }

  // 2. Tier-level locations
  if (tierConfig?.locations && tierConfig.locations.length > 0) {
    return tierConfig.locations;
  }

  // 3. Global default locations
  if (app.globalConfig?.defaultLocations && app.globalConfig.defaultLocations.length > 0) {
    return app.globalConfig.defaultLocations;
  }

  // 4. Hardcoded defaults (backwards compatibility)
  return getHardcodedDefaults(checkType);
}

/**
 * Get hardcoded default locations based on check type
 * Maintains backwards compatibility with current behavior
 *
 * @param checkType - Type of check
 * @returns Default locations for check type
 */
function getHardcodedDefaults(checkType: CheckType): string[] {
  switch (checkType) {
    case 'api':
      return ['us-east-1', 'us-west-2'];
    case 'browser':
    case 'multi_step':
      return ['us-east-1', 'us-west-2'];
    case 'uptime':
      return ['us-east-1', 'us-west-2'];
    default:
      return ['us-east-1', 'us-west-2'];
  }
}

/**
 * Validate location codes (basic validation)
 * Warns if empty array provided
 *
 * @param locations - Array of location codes
 * @returns true if valid
 */
export function validateLocations(locations: string[]): boolean {
  if (locations.length === 0) {
    console.warn('⚠️  Warning: Empty locations array provided. At least one location required.');
    return false;
  }
  return true;
}
