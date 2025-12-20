/**
 * Utilities for sanitizing names to Terraform-compliant resource identifiers
 * Terraform requires: lowercase, alphanumeric characters and underscores only
 */

/**
 * Sanitize a string to be a valid Terraform resource identifier
 * Converts to lowercase, replaces non-alphanumeric characters with underscores,
 * and removes leading/trailing underscores
 *
 * @param input - The string to sanitize
 * @returns A Terraform-compliant resource identifier
 *
 * @example
 * sanitizeResourceId("Env-Observability") // "env_observability"
 * sanitizeResourceId("service-1") // "service_1"
 * sanitizeResourceId("My App Name") // "my_app_name"
 */
export function sanitizeResourceId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')  // Replace non-alphanumeric with underscore
    .replace(/^_+|_+$/g, '')       // Remove leading/trailing underscores
    .replace(/_+/g, '_');          // Collapse multiple underscores
}

/**
 * Sanitize an app name for use in resource identifiers
 * This is an alias for sanitizeResourceId but provides semantic clarity
 *
 * @param appName - The application name to sanitize
 * @returns A sanitized app name suitable for resource IDs
 *
 * @example
 * sanitizeAppName("Env-Observability") // "env_observability"
 */
export function sanitizeAppName(appName: string): string {
  return sanitizeResourceId(appName);
}

/**
 * Create a kebab-case slug from a string (for URLs, file names)
 * Similar to sanitizeResourceId but uses hyphens instead of underscores
 *
 * @param input - The string to convert to a slug
 * @returns A kebab-case slug
 *
 * @example
 * createSlug("Env Observability") // "env-observability"
 * createSlug("My Dashboard") // "my-dashboard"
 */
export function createSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')   // Replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, '')        // Remove leading/trailing hyphens
    .replace(/-+/g, '-');           // Collapse multiple hyphens
}
