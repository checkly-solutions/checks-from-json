/**
 * Main orchestrator - generates Terraform HCL from urlList.json
 * Based on spec section 6.4 and CLI code at dynamic-json.check.ts
 */

import { parseUrlListJson } from './parsers/json-parser';
import { createAlertChannels } from './transformers/alert-channel-transformer';
import { transformWebhookAlertChannels } from './transformers/webhook-alert-channel-transformer';
import { transformCheckGroup } from './transformers/check-group-transformer';
import { transformApiCheck } from './transformers/api-check-transformer';
import { transformBrowserCheck } from './transformers/browser-check-transformer';
import { transformMultiStepCheck } from './transformers/multi-check-transformer';
import { transformUptimeMonitor } from './transformers/uptime-monitor-transformer';
import { transformDashboard } from './transformers/dashboard-transformer';
import { generateHcl } from './generators/hcl-generator';
import { organizeByFile } from './generators/file-organizer';
import { writeFiles } from './writers/file-writer';
import { TerraformResource, TerraformAlertChannel } from './types/terraform.types';
import { WebhookAlertChannelConfig } from './types/urlList.types';
import { log, success, error } from './utils/logger';

/**
 * Main orchestration function
 * Generates complete Terraform configuration from urlList.json
 */
async function main() {
  try {
    log('Generating Terraform HCL from urlList.json...');
    console.log('');

    // 1. Parse urlList.json
    log('1. Parsing urlList.json...');
    const apps = await parseUrlListJson('src/urlList/urlList.json');
    success(`Parsed ${apps.length} application(s)`);

    // 2. Create alert channels (once for all apps)
    log('2. Creating alert channels...');

    // Check if any app has custom webhook alert channels
    const customAlertChannels = collectCustomAlertChannels(apps);

    let alertChannels: TerraformAlertChannel[];
    if (customAlertChannels.length > 0) {
      // Validate webhook configurations
      validateWebhookAlertChannels(customAlertChannels);

      // Use custom webhook alert channels from urlList.json
      alertChannels = transformCustomAlertChannels(customAlertChannels);
      success(`Created ${alertChannels.length} custom webhook alert channel(s)`);
    } else {
      // Use default alert channels (12 channels: email + ServiceNow + MS Teams)
      alertChannels = createAlertChannels();
      success(`Created ${alertChannels.length} default alert channels`);
    }

    for (const channel of alertChannels) {
      channel.hcl = generateHcl(channel);
    }

    // 3. Process each app
    const allResources: TerraformResource[] = [...alertChannels];
    let totalCheckGroups = 0;
    let totalApiChecks = 0;
    let totalBrowserChecks = 0;
    let totalMultiChecks = 0;
    let totalUptimeMonitors = 0;

    for (const app of apps) {
      log(`3. Processing app: ${app.appName}...`);

      // Create dashboard for app
      const dashboard = transformDashboard(app);
      dashboard.hcl = generateHcl(dashboard);
      allResources.push(dashboard);

      // Process each tier (reverse order: app4, app3, app2, app1)
      for (const tier of ['app4', 'app3', 'app2', 'app1'] as const) {
        const tierConfigs = app[tier];

        // Skip empty tiers
        if (tierConfigs.length === 0) {
          continue;
        }

        log(`   Processing tier: ${tier}...`);

        // Create check group for this tier
        // Use first checkCategory or empty TierConfig for location resolution
        const tierConfig = tierConfigs[0] || {};
        const checkGroup = transformCheckGroup(app, tier, alertChannels, tierConfig);
        checkGroup.hcl = generateHcl(checkGroup);
        allResources.push(checkGroup);
        totalCheckGroups++;

        // Process each check category in the tier
        for (const checkCategory of tierConfigs) {
          // Process API checks
          if (checkCategory.api_check) {
            for (const check of checkCategory.api_check) {
              const apiCheck = transformApiCheck(app, tier, check, checkGroup, checkCategory);
              apiCheck.hcl = generateHcl(apiCheck);
              allResources.push(apiCheck);
              totalApiChecks++;
            }
          }

          // Process browser checks
          if (checkCategory.browser_check) {
            for (const check of checkCategory.browser_check) {
              const browserCheck = transformBrowserCheck(app, tier, check, checkGroup, checkCategory);
              browserCheck.hcl = generateHcl(browserCheck);
              allResources.push(browserCheck);
              totalBrowserChecks++;
            }
          }

          // Process multi-step checks
          if (checkCategory.multi_check) {
            for (const check of checkCategory.multi_check) {
              const multiCheck = transformMultiStepCheck(app, tier, check, checkGroup, checkCategory);
              multiCheck.hcl = generateHcl(multiCheck);
              allResources.push(multiCheck);
              totalMultiChecks++;
            }
          }

          // Process uptime monitors
          if (checkCategory.uptime_check) {
            for (const check of checkCategory.uptime_check) {
              const uptimeMonitor = transformUptimeMonitor(app, tier, check, checkGroup, checkCategory);
              uptimeMonitor.hcl = generateHcl(uptimeMonitor);
              allResources.push(uptimeMonitor);
              totalUptimeMonitors++;
            }
          }
        }
      }

      success(`   Completed app: ${app.appName}`);
    }

    // 4. Create provider configuration files
    log('4. Creating Terraform provider configuration...');
    const mainTf: TerraformResource = {
      resourceType: '',
      resourceId: '',
      fileName: 'main.tf',
      hcl: `terraform {
  required_providers {
    checkly = {
      source  = "checkly/checkly"
      version = "~> 1.7"
    }
  }
}

provider "checkly" {
  api_key    = var.checkly_api_key
  account_id = var.checkly_account_id
}
`,
      attributes: {}
    };

    const variablesTf: TerraformResource = {
      resourceType: '',
      resourceId: '',
      fileName: 'variables.tf',
      hcl: `variable "checkly_api_key" {
  description = "Checkly API Key"
  type        = string
  sensitive   = true
}

variable "checkly_account_id" {
  description = "Checkly Account ID"
  type        = string
}
`,
      attributes: {}
    };

    const tfvarsExample: TerraformResource = {
      resourceType: '',
      resourceId: '',
      fileName: 'terraform.tfvars.example',
      hcl: `# Copy this file to terraform.tfvars and fill in your values
# terraform.tfvars is gitignored for security

checkly_api_key    = "cu_your_api_key_here"
checkly_account_id = "your_account_id_here"
`,
      attributes: {}
    };

    const gitignore: TerraformResource = {
      resourceType: '',
      resourceId: '',
      fileName: '.gitignore',
      hcl: `# Terraform files
.terraform/
*.tfstate
*.tfstate.*
*.tfvars
!*.tfvars.example
.terraform.lock.hcl

# Crash log files
crash.log
crash.*.log
`,
      attributes: {}
    };

    const readme: TerraformResource = {
      resourceType: '',
      resourceId: '',
      fileName: 'README.md',
      hcl: `# Checkly Terraform Configuration

Generated by tf-checks-from-json from urlList.json

## Setup

1. Copy terraform.tfvars.example to terraform.tfvars:
   \`\`\`bash
   cp terraform.tfvars.example terraform.tfvars
   \`\`\`

2. Fill in your Checkly credentials in terraform.tfvars:
   - API Key: Get from https://app.checklyhq.com/settings/user/api-keys
   - Account ID: Get from https://app.checklyhq.com/settings/account/general

3. Initialize Terraform:
   \`\`\`bash
   terraform init
   \`\`\`

4. Review the plan:
   \`\`\`bash
   terraform plan
   \`\`\`

5. Apply the configuration:
   \`\`\`bash
   terraform apply
   \`\`\`

## Resource Summary

- **Alert Channels**: ${alertChannels.length}
- **Check Groups**: ${totalCheckGroups}
- **API Checks**: ${totalApiChecks}
- **Browser Checks**: ${totalBrowserChecks}
- **Multi-Step Checks**: ${totalMultiChecks}
- **Uptime Monitors**: ${totalUptimeMonitors}
- **Dashboards**: ${apps.length}

**Total Checks**: ${totalApiChecks + totalBrowserChecks + totalMultiChecks + totalUptimeMonitors}

## Destroying Resources

To remove all resources from Checkly:

\`\`\`bash
terraform destroy
\`\`\`
`,
      attributes: {}
    };

    allResources.push(mainTf, variablesTf, tfvarsExample, gitignore, readme);
    success('Provider configuration created');

    // 5. Organize resources by file
    log('5. Organizing resources by file...');
    const fileMap = organizeByFile(allResources);
    success(`Organized into ${Object.keys(fileMap).length} files`);

    // 6. Write files to __checkly_tf__/
    log('6. Writing files to __checkly_tf__/...');
    await writeFiles('__checkly_tf__', fileMap);
    success('Files written successfully');

    // 7. Summary
    console.log('');
    success('✓ Terraform generation complete!');
    console.log('');
    log('Generated resources:');
    log(`  - ${alertChannels.length} alert channels`);
    log(`  - ${totalCheckGroups} check groups`);
    log(`  - ${totalApiChecks} API checks`);
    log(`  - ${totalBrowserChecks} browser checks`);
    log(`  - ${totalMultiChecks} multi-step checks`);
    log(`  - ${totalUptimeMonitors} uptime monitors`);
    log(`  - ${apps.length} dashboards`);
    log(`  - Total checks: ${totalApiChecks + totalBrowserChecks + totalMultiChecks + totalUptimeMonitors}`);
    console.log('');
    log('Next steps:');
    log('  1. cd __checkly_tf__');
    log('  2. cp terraform.tfvars.example terraform.tfvars');
    log('  3. Edit terraform.tfvars with your Checkly credentials');
    log('  4. terraform init');
    log('  5. terraform plan');
    log('  6. terraform apply');

  } catch (err) {
    error(`Generation failed: ${(err as Error).message}`);
    console.error(err);
    process.exit(1);
  }
}

/**
 * Collect custom alert channels from all apps
 *
 * @param apps - Array of app configurations
 * @returns Array of unique custom webhook alert channels
 */
function collectCustomAlertChannels(apps: any[]): WebhookAlertChannelConfig[] {
  const customChannels: WebhookAlertChannelConfig[] = [];
  const seenChannels = new Set<string>();

  for (const app of apps) {
    if (app.alertChannels && Array.isArray(app.alertChannels)) {
      for (const channel of app.alertChannels) {
        // Create a unique key for deduplication (based on name and url)
        const key = `${channel.name}:${channel.url || ''}`;
        if (!seenChannels.has(key)) {
          seenChannels.add(key);
          customChannels.push(channel);
        }
      }
    }
  }

  return customChannels;
}

/**
 * Validates that webhook alert channels have required URL field
 * @throws Error if webhook is missing URL with helpful guidance
 */
function validateWebhookAlertChannels(configs: WebhookAlertChannelConfig[]): void {
  const webhooksWithoutUrl = configs
    .map((config, index) => ({ config, index }))
    .filter(({ config }) =>
      !config.url || config.url.trim() === ''
    );

  if (webhooksWithoutUrl.length > 0) {
    const errors = webhooksWithoutUrl.map(({ config, index }) => {
      const name = config.name || `(unnamed webhook at index ${index})`;
      return `  - "${name}" at alertChannels[${index}]`;
    }).join('\n');

    throw new Error(
      `\n❌ Webhook Alert Channel Validation Failed\n\n` +
      `The following webhook alert channels are missing required "url" field:\n${errors}\n\n` +
      `📝 How to fix:\n` +
      `Add a valid webhook URL to each webhook in src/urlList/urlList.json:\n\n` +
      `{\n` +
      `  "type": "webhook",\n` +
      `  "name": "Webhook Alert Channel",\n` +
      `  "method": "POST",\n` +
      `  "url": "https://your-webhook-endpoint.com/alerts"\n` +
      `}\n\n` +
      `💡 The webhook URL must be a valid HTTPS endpoint that can receive Checkly alerts.`
    );
  }
}

/**
 * Transform custom alert channels to Terraform resources
 *
 * @param configs - Array of webhook alert channel configurations
 * @returns Array of Terraform alert channel resources
 * @remarks Assumes webhooks validated by validateWebhookAlertChannels()
 */
function transformCustomAlertChannels(configs: WebhookAlertChannelConfig[]): TerraformAlertChannel[] {
  return configs.map((config, index) => {
    const resourceId = configs.length === 1 ? 'webhook' : `webhook_${index + 1}`;
    const hcl = transformWebhookAlertChannels([config], resourceId);

    // Convert headers array format to object format for Terraform
    const headers: { [key: string]: string } = {};
    if (config.headers) {
      for (const headerObj of config.headers) {
        for (const [key, value] of Object.entries(headerObj)) {
          headers[key] = value;
        }
      }
    }

    return {
      resourceType: 'checkly_alert_channel' as const,
      resourceId,
      fileName: 'alert_channels.tf',
      hcl,
      attributes: {
        webhook: {
          name: config.name,
          method: config.method || 'POST',
          url: config.url!,  // Non-null assertion - validated by validateWebhookAlertChannels()
          headers: Object.keys(headers).length > 0 ? headers : undefined,
          template: config.template
        }
      }
    };
  });
}

main();
