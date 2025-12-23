/**
 * Logging utilities
 * Based on spec section 7.18
 */

/**
 * Log an informational message
 * @param message - Message to log
 */
export function log(message: string): void {
  console.log(`[tf-checks-from-json] ${message}`);
}

/**
 * Log an error message
 * @param message - Error message to log
 */
export function error(message: string): void {
  console.error(`[ERROR] ${message}`);
}

/**
 * Log a success message
 * @param message - Success message to log
 */
export function success(message: string): void {
  console.log(`[✓] ${message}`);
}

/**
 * Log a warning message
 * @param message - Warning message to log
 */
export function warn(message: string): void {
  console.warn(`[WARNING] ${message}`);
}
