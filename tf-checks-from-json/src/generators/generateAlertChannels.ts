/**
 * Generator for Checkly alert channel resources
 * Parses alert-channels.ts and generates Terraform alert channel resources
 */

import path from 'path';
import fs from 'fs';
import { writeHCL } from '../utils/fileUtils';

/**
 * Email alert channel configuration
 */
interface EmailChannelConfig {
  tier: number;
  email: string;
  resourceId: string;
}

/**
 * Generate alert channel resources and write to alert-channels.tf
 *
 * @param outputDir - The root output directory path
 *
 * @example
 * generateAlertChannels('/path/to/__tf_checks__')
 * // Creates /path/to/__tf_checks__/alert-channels.tf with email channel resources
 */
export function generateAlertChannels(outputDir: string): void {
  // Parse email channels from alert-channels.ts
  const emailChannels = parseEmailChannels();

  // Generate HCL for all email channels
  const hclBlocks = emailChannels.map((channel) =>
    generateEmailChannelHCL(channel)
  );

  // Combine all blocks with blank lines between them
  const content = hclBlocks.join('\n\n');

  // Write to alert-channels.tf
  const filePath = path.join(outputDir, 'alert-channels.tf');
  writeHCL(filePath, content);
}

/**
 * Parse email channel definitions from the CLI alert-channels.ts file
 * Extracts tier numbers and email addresses
 *
 * @returns Array of email channel configurations
 */
function parseEmailChannels(): EmailChannelConfig[] {
  // Path to the CLI alert-channels.ts file
  const alertChannelsPath = path.join(
    __dirname,
    '../../../cli-checks-from-json/src/alert-channels.ts'
  );

  // Read the file content
  const content = fs.readFileSync(alertChannelsPath, 'utf-8');

  // Parse email channels using regex
  // Looking for patterns like:
  // export const emailChannelTier1 = new EmailAlertChannel(
  //   `email-${formattedTeamName}-${formattedAppName}-1`,
  //   {
  //     address: '1john.doe@gmail.com',
  const emailChannels: EmailChannelConfig[] = [];

  // Regex to match email channel definitions
  // Match: emailChannelTier{N} ... address: '{email}'
  const tierRegex = /emailChannelTier(\d+)/g;
  const addressRegex = /address:\s*['"]([^'"]+)['"]/g;

  let tierMatch;
  const tiers: number[] = [];
  while ((tierMatch = tierRegex.exec(content)) !== null) {
    tiers.push(parseInt(tierMatch[1]));
  }

  let addressMatch;
  const addresses: string[] = [];
  while ((addressMatch = addressRegex.exec(content)) !== null) {
    addresses.push(addressMatch[1]);
  }

  // Match tiers with addresses (should be same length)
  for (let i = 0; i < tiers.length && i < addresses.length; i++) {
    emailChannels.push({
      tier: tiers[i],
      email: addresses[i],
      resourceId: `email_tier_${tiers[i]}`,
    });
  }

  return emailChannels;
}

/**
 * Generate HCL for an email alert channel resource
 *
 * @param channel - Email channel configuration
 * @returns HCL resource block as a string
 *
 * @example
 * generateEmailChannelHCL({ tier: 1, email: '1john.doe@gmail.com', resourceId: 'email_tier_1' })
 * // Returns:
 * // resource "checkly_alert_channel" "email_tier_1" {
 * //   email {
 * //     address = "1john.doe@gmail.com"
 * //   }
 * //   send_recovery = true
 * //   send_failure  = true
 * //   send_degraded = false
 * // }
 */
function generateEmailChannelHCL(channel: EmailChannelConfig): string {
  return `resource "checkly_alert_channel" "${channel.resourceId}" {
  email {
    address = "${channel.email}"
  }

  send_recovery = true
  send_failure  = true
  send_degraded = false
}`;
}
