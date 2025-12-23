/**
 * Test harness for alert channels and dashboards
 * Phase 6 validation checkpoint
 */

import { createAlertChannels } from './transformers/alert-channel-transformer';
import { transformDashboard } from './transformers/dashboard-transformer';
import { generateHcl } from './generators/hcl-generator';
import { organizeByFile } from './generators/file-organizer';
import { writeFiles } from './writers/file-writer';
import { TerraformResource } from './types/terraform.types';
import { log, success, error } from './utils/logger';

async function main() {
  try {
    log('Testing Phase 6: Alert Channels & Dashboards...');

    // 1. Create alert channels
    log('1. Creating alert channels...');
    const alertChannels = createAlertChannels();
    success(`Created ${alertChannels.length} alert channels`);

    // Generate HCL for all channels
    for (const channel of alertChannels) {
      channel.hcl = generateHcl(channel);
    }

    // 2. Create dashboard
    log('2. Creating dashboard...');
    const dashboard = transformDashboard({
      appName: 'Test-App',
      app1: [],
      app2: [],
      app3: [],
      app4: []
    });
    dashboard.hcl = generateHcl(dashboard);
    success('Dashboard created');

    // 3. Create provider files
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

    // 4. Organize and write files
    log('3. Organizing files...');
    const resources = [...alertChannels, dashboard, mainTf, variablesTf];
    const fileMap = organizeByFile(resources);
    success(`Organized into ${Object.keys(fileMap).length} files`);

    log('4. Writing files to test-output-phase6/...');
    await writeFiles('test-output-phase6', fileMap);
    success('Files written successfully');

    // 5. Summary
    console.log('');
    success('✓ Phase 6 validation complete!');
    log(`Generated resources:`);
    log(`  - 4 email alert channels`);
    log(`  - 4 ServiceNow webhook channels`);
    log(`  - 4 MS Teams webhook channels`);
    log(`  - 1 dashboard`);
    log(`  - Total: ${alertChannels.length + 1} resources`);
    log('');
    log('Next: Run terraform init && terraform plan in test-output-phase6/');

  } catch (err) {
    error(`Test failed: ${(err as Error).message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
