/**
 * Validation utilities
 * Based on spec section 7.17
 */

/**
 * Validate that an object has all required fields
 * Throws an error if any field is missing
 *
 * @param obj - Object to validate
 * @param fields - Array of required field names
 * @throws Error if any required field is missing
 *
 * @example
 * validateRequiredFields({ name: "test" }, ["name", "url"])
 * // Throws: Missing required field: url
 */
export function validateRequiredFields(obj: any, fields: string[]): void {
  for (const field of fields) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}
