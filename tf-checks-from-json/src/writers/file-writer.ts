/**
 * File writer - writes Terraform files to disk
 * Based on spec section 7.15
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileMap } from '../types/config.types';
import { log } from '../utils/logger';

/**
 * Write Terraform files to disk
 *
 * Creates the output directory if it doesn't exist and writes all files
 * with UTF-8 encoding.
 *
 * @param outputDir - Output directory path
 * @param fileMap - Map of filename to file content
 *
 * @example
 * await writeFiles('__checkly_tf__', fileMap)
 * // Creates __checkly_tf__/ and writes all .tf files
 */
export async function writeFiles(
  outputDir: string,
  fileMap: FileMap
): Promise<void> {
  // Create output directory if it doesn't exist
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      log(`Created output directory: ${outputDir}`);
    }
  } catch (err) {
    throw new Error(
      `Failed to create output directory: ${outputDir}\n` +
      `Error: ${(err as Error).message}\n` +
      `Tip: Check directory permissions`
    );
  }

  // Write each file
  for (const [filename, content] of Object.entries(fileMap)) {
    const filePath = path.join(outputDir, filename);

    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      log(`  Wrote ${filename}`);
    } catch (err) {
      throw new Error(
        `Failed to write file: ${filePath}\n` +
        `Error: ${(err as Error).message}\n` +
        `Tip: Check file permissions and disk space`
      );
    }
  }
}
