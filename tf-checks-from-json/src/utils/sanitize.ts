/**
 * String sanitization utilities for Terraform resource IDs
 * Based on spec section 7.16
 */

/**
 * Sanitize a string for use in Terraform resource IDs
 * - Converts to lowercase
 * - Replaces non-alphanumeric characters with underscores
 * - Collapses multiple underscores
 * - Removes leading/trailing underscores
 *
 * @param str - String to sanitize
 * @returns Sanitized string safe for Terraform resource IDs
 *
 * @example
 * sanitize("Env-Observability") // => "env_observability"
 * sanitize("App Name!") // => "app_name"
 */
export function sanitize(str: string): string {
  return str
    .toLowerCase()                  // Convert to lowercase
    .replace(/[^a-z0-9]/g, '_')    // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_')            // Collapse multiple underscores
    .replace(/^_|_$/g, '');         // Remove leading/trailing underscores
}
