/**
 * Test harness for check groups
 * Phase 7 validation checkpoint
 */

import { createAlertChannels } from './transformers/alert-channel-transformer';
import { transformCheckGroup } from './transformers/check-group-transformer';
import { transformDashboard } from './transformers/dashboard-transformer';
import { generateHcl } from './generators/hcl-generator';
import { organizeByFile } from './generators/file-organizer';
import { writeFiles } from './writers/file-writer';
import { TerraformResource } from './types/terraform.types';
import { log, success, error } from './utils/logger';

async function main() {
  try {
    log('Testing Phase 7: Check Groups...');

    // 1. Create alert channels
    log('1. Creating alert channels...');
    const alertChannels = createAlertChannels();
    for (const channel of alertChannels) {
      channel.hcl = generateHcl(channel);
    }
    success(`Created ${alertChannels.length} alert channels`);

    // 2. Create check groups for multiple apps and tiers
    log('2. Creating check groups...');
    const checkGroups = [];

    // Create test apps
    const testApp1 = {
      appName: 'Env-Observability',
      app1: [{}], // Non-empty tier
      app2: [{}], // Non-empty tier
      app3: [],   // Empty tier (should skip)
      app4: [{}]  // Non-empty tier
    };

    const testApp2 = {
      appName: 'Production-API',
      app1: [{}],
      app2: [],
      app3: [],
      app4: []
    };

    // Generate groups for non-empty tiers only
    for (const tier of ['app1', 'app2', 'app3', 'app4'] as const) {
      if (testApp1[tier].length > 0) {
        const tierConfig = testApp1[tier][0] || {};
        const group = transformCheckGroup(testApp1, tier, alertChannels, tierConfig);
        group.hcl = generateHcl(group);
        checkGroups.push(group);
      }
    }

    for (const tier of ['app1', 'app2', 'app3', 'app4'] as const) {
      if (testApp2[tier].length > 0) {
        const tierConfig = testApp2[tier][0] || {};
        const group = transformCheckGroup(testApp2, tier, alertChannels, tierConfig);
        group.hcl = generateHcl(group);
        checkGroups.push(group);
      }
    }

    success(`Created ${checkGroups.length} check groups (skipped empty tiers)`);

    // 3. Create dashboards
    log('3. Creating dashboards...');
    const dashboard1 = transformDashboard(testApp1);
    dashboard1.hcl = generateHcl(dashboard1);
    const dashboard2 = transformDashboard(testApp2);
    dashboard2.hcl = generateHcl(dashboard2);
    success('Dashboards created');

    // 4. Create provider files
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

    // 5. Organize and write files
    log('4. Organizing files...');
    const resources = [
      ...alertChannels,
      ...checkGroups,
      dashboard1,
      dashboard2,
      mainTf,
      variablesTf
    ];
    const fileMap = organizeByFile(resources);
    success(`Organized into ${Object.keys(fileMap).length} files`);

    log('5. Writing files to test-output-phase7/...');
    await writeFiles('test-output-phase7', fileMap);
    success('Files written successfully');

    // 6. Summary
    console.log('');
    success('✓ Phase 7 validation complete!');
    log(`Generated resources:`);
    log(`  - 12 alert channels`);
    log(`  - ${checkGroups.length} check groups`);
    log(`  - 2 dashboards`);
    log(`  - Each group subscribes to all 12 alert channels`);
    log('');
    log('Next: Validate with terraform');
    log('  cd test-output-phase7');
    log('  terraform init && terraform validate');
    log('');
    log('Check that alert channel references are unquoted!');

  } catch (err) {
    error(`Test failed: ${(err as Error).message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
