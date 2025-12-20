/**
 * File I/O utilities for writing Terraform files and managing directories
 */

import fs from 'fs';
import path from 'path';

/**
 * Ensure a directory exists, creating it and parent directories if needed
 *
 * @param dirPath - The directory path to ensure exists
 *
 * @example
 * ensureDir('/path/to/output/checks')
 * // Creates /path/to/output/checks and any missing parent directories
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Write HCL content to a file, creating parent directories if needed
 * Overwrites the file if it already exists
 *
 * @param filePath - The file path to write to
 * @param content - The HCL content to write
 *
 * @example
 * writeHCL('/path/to/output/groups.tf', 'resource "checkly_check_group" "example" { ... }')
 */
export function writeHCL(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Append HCL content to a file, creating it if it doesn't exist
 * Adds a blank line before the new content for readability
 *
 * @param filePath - The file path to append to
 * @param content - The HCL content to append
 *
 * @example
 * appendHCL('/path/to/output/checks.tf', 'resource "checkly_check" "example2" { ... }')
 */
export function appendHCL(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  ensureDir(dir);

  // Add blank line separator if file already has content
  const separator = fs.existsSync(filePath) && fs.statSync(filePath).size > 0 ? '\n\n' : '';
  fs.appendFileSync(filePath, separator + content, 'utf-8');
}

/**
 * Read a script file and return its contents
 * Resolves the path relative to the CLI implementation directory
 *
 * @param scriptPath - The relative script path (e.g., "/browser-scripts/visit.spec.ts")
 * @param basePath - The base path to resolve from (default: cli-checks-from-json/src)
 * @returns The script file contents
 *
 * @example
 * readScript("/browser-scripts/visit.spec.ts")
 * // Reads from cli-checks-from-json/src/browser-scripts/visit.spec.ts
 */
export function readScript(scriptPath: string, basePath?: string): string {
  // Default base path is the CLI implementation's src directory
  const defaultBasePath = path.join(
    __dirname,
    '../../../cli-checks-from-json/src'
  );
  const resolvedBasePath = basePath || defaultBasePath;

  // Remove leading slash from scriptPath if present
  const cleanScriptPath = scriptPath.startsWith('/')
    ? scriptPath.substring(1)
    : scriptPath;

  const fullPath = path.join(resolvedBasePath, cleanScriptPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Script file not found: ${fullPath}`);
  }

  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Clean/remove a directory and all its contents
 * Useful for starting fresh with output directory
 *
 * @param dirPath - The directory path to remove
 *
 * @example
 * cleanDir('/path/to/output')
 * // Removes the directory and all files/subdirectories
 */
export function cleanDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Initialize output directory structure
 * Creates the base output directory, removing it first if it exists
 *
 * @param outputDir - The output directory path
 *
 * @example
 * initOutputDir('/path/to/__tf_checks__')
 * // Removes __tf_checks__ if it exists, then creates it fresh
 */
export function initOutputDir(outputDir: string): void {
  cleanDir(outputDir);
  ensureDir(outputDir);
}
