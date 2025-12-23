/**
 * Webhook Alert Channel Transformer
 *
 * Transforms WebhookAlertChannelConfig from urlList.json to Terraform HCL
 * Based on spec section 5.2
 */

import { WebhookAlertChannelConfig } from '../types/urlList.types';

/**
 * Transform webhook alert channel to Terraform HCL
 *
 * @param config - Webhook alert channel configuration
 * @param resourceName - Terraform resource name (e.g., "rootly_webhook")
 * @returns Terraform HCL string
 */
export function transformWebhookAlertChannel(
  config: WebhookAlertChannelConfig,
  resourceName: string
): string {
  const lines: string[] = [];

  lines.push(`resource "checkly_alert_channel" "${resourceName}" {`);

  // Webhook block
  lines.push(`  webhook {`);
  lines.push(`    name   = "${escapeString(config.name)}"`);

  // URL (optional)
  if (config.url) {
    lines.push(`    url    = "${escapeString(config.url)}"`);
  }

  // Method (optional, default: POST)
  if (config.method) {
    lines.push(`    method = "${config.method}"`);
  }

  // Headers (optional)
  if (config.headers && config.headers.length > 0) {
    lines.push(`    headers = {`);
    for (const headerObj of config.headers) {
      for (const [key, value] of Object.entries(headerObj)) {
        lines.push(`      "${escapeString(key)}" = "${escapeString(value)}"`);
      }
    }
    lines.push(`    }`);
  }

  // Template (optional)
  if (config.template) {
    // Template needs special handling for multiline strings
    const escapedTemplate = escapeTemplateString(config.template);
    lines.push(`    template = <<-EOT`);
    lines.push(`${escapedTemplate}`);
    lines.push(`    EOT`);
  }

  lines.push(`  }`);
  lines.push(`}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Transform multiple webhook alert channels
 *
 * @param configs - Array of webhook alert channel configurations
 * @param baseResourceName - Base resource name (e.g., "webhook")
 * @returns Terraform HCL string for all alert channels
 */
export function transformWebhookAlertChannels(
  configs: WebhookAlertChannelConfig[],
  baseResourceName: string = 'webhook'
): string {
  return configs
    .map((config, index) => {
      const resourceName = configs.length === 1
        ? baseResourceName
        : `${baseResourceName}_${index + 1}`;
      return transformWebhookAlertChannel(config, resourceName);
    })
    .join('\n');
}

/**
 * Escape string for HCL
 *
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')   // Escape backslashes
    .replace(/"/g, '\\"')     // Escape quotes
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r')    // Escape carriage returns
    .replace(/\t/g, '\\t');   // Escape tabs
}

/**
 * Escape template string for HCL heredoc
 *
 * @param str - Template string to escape
 * @returns Escaped template string
 */
function escapeTemplateString(str: string): string {
  // For heredoc (<<-EOT), we don't need to escape quotes
  // but we should preserve the template as-is
  return str;
}
