/**
 * Configuration types for the tool
 */

/**
 * Tool configuration
 */
export interface ToolConfig {
  inputPath: string;           // Path to urlList.json
  outputDir: string;           // Output directory for Terraform files
  scriptsBaseDir: string;      // Base directory for script files
}

/**
 * File mapping for organizing Terraform files
 */
export interface FileMap {
  [filename: string]: string;  // filename -> content
}
