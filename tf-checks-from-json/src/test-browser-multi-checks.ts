/**
 * Test harness for browser and multi-step checks
 * Phase 9 validation checkpoint
 *
 * Generates complete stack:
 * - Alert channels (12)
 * - Check group (1)
 * - Browser check (1) with embedded Playwright script
 * - Multi-step check (1) with embedded Playwright script
 * - Dashboard (1)
 *
 * Validates script embedding with terraform
 */

import { createAlertChannels } from './transformers/alert-channel-transformer';
import { transformCheckGroup } from './transformers/check-group-transformer';
import { transformBrowserCheck } from './transformers/browser-check-transformer';
import { transformMultiStepCheck } from './transformers/multi-check-transformer';
import { transformDashboard } from './transformers/dashboard-transformer';
import { generateHcl } from './generators/hcl-generator';
import { organizeByFile } from './generators/file-organizer';
import { writeFiles } from './writers/file-writer';
import { TerraformResource } from './types/terraform.types';
import { AppConfig } from './types/urlList.types';
import { log, success, error } from './utils/logger';

async function main() {
  try {
    log('Testing Phase 9: Browser & Multi-Step Checks...');

    // 1. Create alert channels
    log('1. Creating alert channels...');
    const alertChannels = createAlertChannels();
    for (const channel of alertChannels) {
      channel.hcl = generateHcl(channel);
    }
    success(`Created ${alertChannels.length} alert channels`);

    // 2. Create test app with browser and multi-step checks
    log('2. Creating test app configuration...');
    const testApp: AppConfig = {
      appName: 'E2E-Tests',
      app1: [
        {
          browser_check: [
            {
              urlShort: 'webshop-visit',
              filePath: 'browser-scripts/visit.spec.ts',
              activated: true,
              frequency: 10
            }
          ],
          multi_check: [
            {
              urlShort: 'api-crud',
              filePath: 'multi-scripts/multi-CRUD.spec.ts',
              activated: true,
              frequency: 15
            }
          ]
        }
      ],
      app2: [],
      app3: [],
      app4: []
    };
    success('Test app configured with 1 browser check and 1 multi-step check');

    // 3. Create check group for app1
    log('3. Creating check group...');
    const checkGroup = transformCheckGroup(testApp, 'app1', alertChannels);
    checkGroup.hcl = generateHcl(checkGroup);
    success(`Check group created: ${checkGroup.resourceId}`);

    // 4. Create browser checks
    log('4. Creating browser checks...');
    const browserChecks = [];
    for (const tierConfig of testApp.app1) {
      if (tierConfig.browser_check) {
        for (const check of tierConfig.browser_check) {
          const browserCheck = transformBrowserCheck(testApp, 'app1', check, checkGroup);
          browserCheck.hcl = generateHcl(browserCheck);
          browserChecks.push(browserCheck);
        }
      }
    }
    success(`Created ${browserChecks.length} browser check(s)`);

    // 5. Create multi-step checks
    log('5. Creating multi-step checks...');
    const multiChecks = [];
    for (const tierConfig of testApp.app1) {
      if (tierConfig.multi_check) {
        for (const check of tierConfig.multi_check) {
          const multiCheck = transformMultiStepCheck(testApp, 'app1', check, checkGroup);
          multiCheck.hcl = generateHcl(multiCheck);
          multiChecks.push(multiCheck);
        }
      }
    }
    success(`Created ${multiChecks.length} multi-step check(s)`);

    // 6. Create dashboard
    log('6. Creating dashboard...');
    const dashboard = transformDashboard(testApp);
    dashboard.hcl = generateHcl(dashboard);
    success('Dashboard created');

    // 7. Create provider files
    log('7. Creating Terraform provider configuration...');
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

    success('Provider configuration created');

    // 8. Organize and write files
    log('8. Organizing resources by file...');
    const resources = [
      ...alertChannels,
      checkGroup,
      ...browserChecks,
      ...multiChecks,
      dashboard,
      mainTf,
      variablesTf,
      tfvarsExample,
      gitignore
    ];
    const fileMap = organizeByFile(resources);
    success(`Organized into ${Object.keys(fileMap).length} files`);

    log('9. Writing files to test-output-phase9/...');
    await writeFiles('test-output-phase9', fileMap);
    success('Files written successfully');

    // 10. Summary
    console.log('');
    success('✓ Phase 9 validation complete!');
    log('Generated resources:');
    log(`  - 12 alert channels`);
    log(`  - 1 check group (subscribed to all 12 channels)`);
    log(`  - ${browserChecks.length} browser check with Playwright script`);
    log(`  - ${multiChecks.length} multi-step check with Playwright script`);
    log(`  - 1 dashboard`);
    log('');
    log('Next steps:');
    log('  1. Inspect generated scripts in checks_browser.tf and checks_multistep.tf');
    log('  2. Verify script embedding uses proper heredoc syntax');
    log('  3. cd test-output-phase9');
    log('  4. terraform init');
    log('  5. terraform validate');
    log('  6. terraform plan');
    log('');
    log('Check that scripts are embedded correctly with no syntax errors!');

  } catch (err) {
    error(`Test failed: ${(err as Error).message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
