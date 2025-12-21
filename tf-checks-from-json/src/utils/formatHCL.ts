/**
 * Utilities for formatting HCL (HashiCorp Configuration Language)
 * Provides helpers for indentation, escaping, and heredoc wrapping
 */

/**
 * Indent a string by a specified number of spaces
 * Useful for creating properly formatted HCL blocks
 *
 * @param content - The content to indent
 * @param spaces - Number of spaces to indent (default: 2)
 * @returns Indented content
 *
 * @example
 * indent("name = \"test\"", 2) // "  name = \"test\""
 * indent("line1\nline2", 4) // "    line1\n    line2"
 */
export function indent(content: string, spaces: number = 2): string {
  const indentation = ' '.repeat(spaces);
  return content
    .split('\n')
    .map((line) => (line ? indentation + line : line))
    .join('\n');
}

/**
 * Escape a string for use in HCL
 * Escapes double quotes, backslashes, and other special characters
 *
 * @param value - The string to escape
 * @returns Escaped string safe for HCL
 *
 * @example
 * escapeHCLString('Hello "World"') // 'Hello \\"World\\"'
 * escapeHCLString('Path\\To\\File') // 'Path\\\\To\\\\File'
 */
export function escapeHCLString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')    // Escape backslashes
    .replace(/"/g, '\\"')      // Escape double quotes
    .replace(/\n/g, '\\n')     // Escape newlines
    .replace(/\t/g, '\\t');    // Escape tabs
}

/**
 * Wrap content in a heredoc for multiline strings
 * Uses the <<-EOT syntax which allows for indentation
 *
 * @param script - The script content to wrap
 * @param marker - The heredoc marker (default: "EOT")
 * @returns Content wrapped in heredoc syntax
 *
 * @example
 * wrapHeredoc("const foo = 'bar';\nconsole.log(foo);")
 * // Returns:
 * // <<-EOT
 * // const foo = 'bar';
 * // console.log(foo);
 * // EOT
 */
export function wrapHeredoc(script: string, marker: string = 'EOT'): string {
  // Escape dollar signs in template literals for Terraform
  // JavaScript ${variable} becomes Terraform $${variable} which renders as ${variable}
  const escapedScript = script.replace(/\$/g, '$$$$');
  return `<<-${marker}\n${escapedScript}\n${marker}`;
}

/**
 * Format a map/object as HCL map syntax
 *
 * @param obj - Object to format as HCL map
 * @param indent - Number of spaces to indent (default: 0)
 * @returns HCL map syntax
 *
 * @example
 * formatHCLMap({ "Content-Type": "application/json", "Authorization": "Bearer token" })
 * // Returns:
 * // {
 * //   "Content-Type"  = "application/json"
 * //   "Authorization" = "Bearer token"
 * // }
 */
export function formatHCLMap(
  obj: { [key: string]: string },
  indentSpaces: number = 0
): string {
  const entries = Object.entries(obj);

  if (entries.length === 0) {
    return '{}';
  }

  const spaces = ' '.repeat(indentSpaces);
  const innerSpaces = ' '.repeat(indentSpaces + 2);

  let result = `${spaces}{\n`;
  entries.forEach(([key, value]) => {
    result += `${innerSpaces}"${key}" = "${escapeHCLString(value)}"\n`;
  });
  result += `${spaces}}`;

  return result;
}

/**
 * Format an array as HCL list syntax
 *
 * @param items - Array of strings to format
 * @returns HCL list syntax
 *
 * @example
 * formatHCLList(["us-east-1", "us-west-2"])
 * // Returns: ["us-east-1", "us-west-2"]
 */
export function formatHCLList(items: string[]): string {
  if (items.length === 0) {
    return '[]';
  }

  const quotedItems = items.map((item) => `"${escapeHCLString(item)}"`);
  return `[${quotedItems.join(', ')}]`;
}

/**
 * Format a boolean for HCL (lowercase true/false)
 *
 * @param value - Boolean value
 * @returns HCL boolean string
 *
 * @example
 * formatHCLBool(true) // "true"
 * formatHCLBool(false) // "false"
 */
export function formatHCLBool(value: boolean): string {
  return value ? 'true' : 'false';
}
