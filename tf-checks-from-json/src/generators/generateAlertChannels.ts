/**
 * Generator for Checkly alert channel resources
 * Creates alert channels for all supported types based on JSON definitions
 * Supports: Email, SMS, Slack, PagerDuty, Opsgenie, Webhook, and Phone Call
 */

import path from 'path';
import { writeHCL } from '../utils/fileUtils';
import { formatHCLValue } from '../utils/variableResolver';
import {
  AlertChannelDefinition,
  EmailChannelConfig,
  SmsChannelConfig,
  SlackChannelConfig,
  PagerdutyChannelConfig,
  OpsgenieChannelConfig,
  WebhookChannelConfig,
  CallChannelConfig,
} from '../types/json-types';

/**
 * Generate alert channel resources and write to alert-channels.tf
 * Creates all channel types based on alert channel definitions from JSON
 *
 * @param outputDir - The root output directory path
 * @param alertChannelDefs - Array of alert channel definitions from JSON
 *
 * @example
 * generateAlertChannels('/path/to/__tf_checks__', [
 *   { id: "email_tier1", type: "email", config: { address: "var:email" } },
 *   { id: "slack_alerts", type: "slack", config: { channel: "#alerts", url: "var:slack_url" } }
 * ])
 * // Creates /path/to/__tf_checks__/alert-channels.tf with both email and slack resources
 */
export function generateAlertChannels(
  outputDir: string,
  alertChannelDefs: AlertChannelDefinition[]
): void {
  // Strategy pattern: map channel type to generator function
  const generators: { [key: string]: (def: AlertChannelDefinition) => string } = {
    email: generateEmailChannelHCL,
    sms: generateSmsChannelHCL,
    slack: generateSlackChannelHCL,
    pagerduty: generatePagerdutyChannelHCL,
    opsgenie: generateOpsgenieChannelHCL,
    webhook: generateWebhookChannelHCL,
    call: generateCallChannelHCL,
  };

  // Generate HCL for all alert channels
  const hclBlocks = alertChannelDefs.map((def) => {
    const generator = generators[def.type];
    if (!generator) {
      throw new Error(
        `Unsupported alert channel type: "${def.type}" for channel "${def.id}"`
      );
    }
    return generator(def);
  });

  // Combine all blocks with blank lines between them
  const content = hclBlocks.join('\n\n');

  // Write to alert-channels.tf
  const filePath = path.join(outputDir, 'alert-channels.tf');
  writeHCL(filePath, content);
}

/**
 * Generate common notification flags for alert channels
 * Applies default values for optional settings
 *
 * @param def - Alert channel definition
 * @returns HCL lines for notification flags
 */
function generateNotificationFlags(def: AlertChannelDefinition): string {
  const send_recovery = def.send_recovery ?? true;
  const send_failure = def.send_failure ?? true;
  const send_degraded = def.send_degraded ?? false;

  return `  send_recovery = ${send_recovery}
  send_failure  = ${send_failure}
  send_degraded = ${send_degraded}`;
}

/**
 * Generate HCL for an email alert channel resource
 *
 * @param def - Alert channel definition
 * @returns HCL resource block as a string
 */
function generateEmailChannelHCL(def: AlertChannelDefinition): string {
  const config = def.config as EmailChannelConfig;
  const addressValue = formatHCLValue(config.address);

  let hcl = `resource "checkly_alert_channel" "${def.id}" {
  email {
    address = ${addressValue}
  }

${generateNotificationFlags(def)}`;

  // Add SSL expiry settings if specified
  if (def.ssl_expiry !== undefined) {
    hcl += `\n  ssl_expiry           = ${def.ssl_expiry}`;
  }
  if (def.ssl_expiry_threshold !== undefined) {
    hcl += `\n  ssl_expiry_threshold = ${def.ssl_expiry_threshold}`;
  }

  hcl += '\n}';
  return hcl;
}

/**
 * Generate HCL for an SMS alert channel resource
 *
 * @param def - Alert channel definition
 * @returns HCL resource block as a string
 */
function generateSmsChannelHCL(def: AlertChannelDefinition): string {
  const config = def.config as SmsChannelConfig;
  const nameValue = formatHCLValue(config.name);
  const numberValue = formatHCLValue(config.number);

  return `resource "checkly_alert_channel" "${def.id}" {
  sms {
    name   = ${nameValue}
    number = ${numberValue}
  }

${generateNotificationFlags(def)}
}`;
}

/**
 * Generate HCL for a Slack alert channel resource
 *
 * @param def - Alert channel definition
 * @returns HCL resource block as a string
 */
function generateSlackChannelHCL(def: AlertChannelDefinition): string {
  const config = def.config as SlackChannelConfig;
  const channelValue = formatHCLValue(config.channel);
  const urlValue = formatHCLValue(config.url);

  return `resource "checkly_alert_channel" "${def.id}" {
  slack {
    channel = ${channelValue}
    url     = ${urlValue}
  }

${generateNotificationFlags(def)}
}`;
}

/**
 * Generate HCL for a PagerDuty alert channel resource
 *
 * @param def - Alert channel definition
 * @returns HCL resource block as a string
 */
function generatePagerdutyChannelHCL(def: AlertChannelDefinition): string {
  const config = def.config as PagerdutyChannelConfig;
  const serviceKeyValue = formatHCLValue(config.service_key);

  let pagerdutyBlock = `  pagerduty {
    service_key = ${serviceKeyValue}`;

  // Add optional fields
  if (config.account) {
    const accountValue = formatHCLValue(config.account);
    pagerdutyBlock += `\n    account     = ${accountValue}`;
  }
  if (config.service_name) {
    const serviceNameValue = formatHCLValue(config.service_name);
    pagerdutyBlock += `\n    service_name = ${serviceNameValue}`;
  }

  pagerdutyBlock += '\n  }';

  return `resource "checkly_alert_channel" "${def.id}" {
${pagerdutyBlock}

${generateNotificationFlags(def)}
}`;
}

/**
 * Generate HCL for an Opsgenie alert channel resource
 *
 * @param def - Alert channel definition
 * @returns HCL resource block as a string
 */
function generateOpsgenieChannelHCL(def: AlertChannelDefinition): string {
  const config = def.config as OpsgenieChannelConfig;
  const nameValue = formatHCLValue(config.name);
  const apiKeyValue = formatHCLValue(config.api_key);
  const regionValue = formatHCLValue(config.region);
  const priorityValue = formatHCLValue(config.priority);

  return `resource "checkly_alert_channel" "${def.id}" {
  opsgenie {
    name     = ${nameValue}
    api_key  = ${apiKeyValue}
    region   = ${regionValue}
    priority = ${priorityValue}
  }

${generateNotificationFlags(def)}
}`;
}

/**
 * Generate HCL for a webhook alert channel resource
 *
 * @param def - Alert channel definition
 * @returns HCL resource block as a string
 */
function generateWebhookChannelHCL(def: AlertChannelDefinition): string {
  const config = def.config as WebhookChannelConfig;
  const nameValue = formatHCLValue(config.name);
  const urlValue = formatHCLValue(config.url);

  let webhookBlock = `  webhook {
    name   = ${nameValue}
    url    = ${urlValue}`;

  // Add optional method
  if (config.method) {
    const methodValue = formatHCLValue(config.method);
    webhookBlock += `\n    method = ${methodValue}`;
  }

  // Add optional headers
  if (config.headers && Object.keys(config.headers).length > 0) {
    webhookBlock += '\n    \n    headers = {';
    Object.entries(config.headers).forEach(([key, value]) => {
      const formattedValue = formatHCLValue(value);
      webhookBlock += `\n      "${key}" = ${formattedValue}`;
    });
    webhookBlock += '\n    }';
  }

  // Add optional query parameters
  if (config.query_parameters && Object.keys(config.query_parameters).length > 0) {
    webhookBlock += '\n    \n    query_parameters = {';
    Object.entries(config.query_parameters).forEach(([key, value]) => {
      const formattedValue = formatHCLValue(value);
      webhookBlock += `\n      "${key}" = ${formattedValue}`;
    });
    webhookBlock += '\n    }';
  }

  // Add optional template (use heredoc for multiline templates)
  if (config.template) {
    webhookBlock += '\n    \n    template = <<-EOT\n';
    webhookBlock += config.template;
    webhookBlock += '\nEOT';
  }

  // Add optional webhook secret
  if (config.webhook_secret) {
    const secretValue = formatHCLValue(config.webhook_secret);
    webhookBlock += `\n    webhook_secret = ${secretValue}`;
  }

  // Add optional webhook type
  if (config.webhook_type) {
    const typeValue = formatHCLValue(config.webhook_type);
    webhookBlock += `\n    webhook_type = ${typeValue}`;
  }

  webhookBlock += '\n  }';

  return `resource "checkly_alert_channel" "${def.id}" {
${webhookBlock}

${generateNotificationFlags(def)}
}`;
}

/**
 * Generate HCL for a phone call alert channel resource
 *
 * @param def - Alert channel definition
 * @returns HCL resource block as a string
 */
function generateCallChannelHCL(def: AlertChannelDefinition): string {
  const config = def.config as CallChannelConfig;
  const nameValue = formatHCLValue(config.name);
  const numberValue = formatHCLValue(config.number);

  return `resource "checkly_alert_channel" "${def.id}" {
  call {
    name   = ${nameValue}
    number = ${numberValue}
  }

${generateNotificationFlags(def)}
}`;
}
