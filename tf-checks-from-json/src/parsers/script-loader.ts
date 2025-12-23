/**
 * Script loader for Playwright .spec.ts files
 * Based on spec section 7.5 and 6.5
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Load a Playwright script file
 * filePath is relative to src/ directory (e.g., "/browser-scripts/visit.spec.ts")
 *
 * @param filePath - Path to script file relative to src/ directory
 * @returns Script file content as string
 * @throws Error if file doesn't exist
 *
 * @example
 * const script = loadScript('/browser-scripts/visit.spec.ts')
 * console.log(`Loaded ${script.length} bytes`)
 */
export function loadScript(filePath: string): string {
  // filePath is relative to src/ (e.g., "/browser-scripts/visit.spec.ts")
  // Construct full path from current working directory
  const fullPath = path.join(process.cwd(), 'src', filePath);

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    throw new Error(
      `Script file not found: ${fullPath}\n` +
      `Expected path: ${filePath}\n` +
      `Working directory: ${process.cwd()}\n` +
      `Tip: Ensure the script file exists in src${filePath}`
    );
  }

  // Read file content
  let content: string;
  try {
    content = fs.readFileSync(fullPath, 'utf-8');
  } catch (err) {
    throw new Error(
      `Failed to read script file: ${fullPath}\n` +
      `Error: ${(err as Error).message}`
    );
  }

  // Warn if file is empty
  if (content.trim().length === 0) {
    console.warn(
      `[WARNING] Script file is empty: ${fullPath}\n` +
      `This will create a check with an empty script.`
    );
  }

  // Return content as-is (will be embedded in HCL)
  return content;
}
