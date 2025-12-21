/**
 * Generator for Checkly code snippet resources
 * Creates checkly_snippet resources for reusable setup/teardown code
 */

import { SnippetConfig } from '../types/json-types';
import { sanitizeResourceId } from '../utils/sanitizeResourceId';
import { wrapHeredoc } from '../utils/formatHCL';
import { readScript } from '../utils/fileUtils';

/**
 * Generate HCL for a code snippet resource
 *
 * @param snippet - The snippet configuration
 * @returns HCL resource block as a string
 *
 * @example
 * generateSnippet({
 *   id: "auth_setup",
 *   name: "Authentication Setup",
 *   script: "/snippets/auth-setup.js"
 * })
 */
export function generateSnippet(snippet: SnippetConfig): string {
  // Create Terraform resource ID from snippet ID
  const resourceId = sanitizeResourceId(`snippet_${snippet.id}`);

  // Read and inline the script file
  let scriptContent: string;
  try {
    scriptContent = readScript(snippet.script);
  } catch (error) {
    throw new Error(
      `Failed to read snippet script file: ${snippet.script}. Error: ${error}`
    );
  }

  // Wrap script in heredoc
  const scriptHCL = wrapHeredoc(scriptContent, 'EOT');

  return `resource "checkly_snippet" "${resourceId}" {
  name   = "${snippet.name}"
  script = ${scriptHCL}
}`;
}

/**
 * Generate HCL for all snippet resources
 *
 * Note: Import blocks are not used for snippets because their IDs are
 * auto-assigned by Checkly's API and not known ahead of time.
 * Unlike environment variables (where ID = key), snippet IDs are numeric
 * and only available after creation.
 *
 * @param snippets - Array of snippet configurations
 * @returns Combined HCL for all snippets
 */
export function generateSnippets(snippets: SnippetConfig[]): string {
  return snippets.map(snippet => generateSnippet(snippet)).join('\n\n');
}
