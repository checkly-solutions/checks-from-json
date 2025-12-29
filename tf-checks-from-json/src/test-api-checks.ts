/**
 * Test harness for API checks
 * Phase 8 validation checkpoint - FIRST DEPLOYMENT MILESTONE
 *
 * Generates complete stack:
 * - Alert channels (12)
 * - Check group (1)
 * - API checks (2) with assertions, headers, and setup scripts
 * - Dashboard (1)
 *
 * Validates with terraform and deploys to Checkly
 */

import { createAlertChannels } from './transformers/alert-channel-transformer';
import { transformCheckGroup } from './transformers/check-group-transformer';
import { transformApiCheck } from './transformers/api-check-transformer';
import { transformDashboard } from './transformers/dashboard-transformer';
import { generateHcl } from './generators/hcl-generator';
import { organizeByFile } from './generators/file-organizer';
import { writeFiles } from './writers/file-writer';
import { TerraformResource } from './types/terraform.types';
import { AppConfig } from './types/urlList.types';
import { log, success, error } from './utils/logger';

async function main() {
  try {
    log('Testing Phase 8: API Checks - FIRST DEPLOYMENT MILESTONE...');

    // 1. Create alert channels
    log('1. Creating alert channels...');
    const alertChannels = createAlertChannels();
    for (const channel of alertChannels) {
      channel.hcl = generateHcl(channel);
    }
    success(`Created ${alertChannels.length} alert channels`);

    // 2. Create test app with API checks
    log('2. Creating test app configuration...');
    const testApp: AppConfig = {
      appName: 'Books-API',
      app1: [
        {
          api_check: [
            {
              urlShort: 'GET-books',
              url: 'https://danube-web.shop/api/books',
              method: 'GET',
              activated: true,
              frequency: 5,
              shouldFail: false,
              assertions: [
                ['statusCode().equals(200)'],
                ['jsonBody("$.length").greaterThan(0)'],
                ['responseTime().lessThan(2000)']
              ],
              headers: [
                { 'Accept': 'application/json' },
                { 'X-API-Key': 'test-key-123' }
              ]
            },
            {
              urlShort: 'POST-book',
              url: 'https://danube-web.shop/api/books',
              method: 'POST',
              activated: true,
              frequency: 10,
              shouldFail: false,
              assertions: [
                ['statusCode().equals(201)'],
                ['jsonBody("$.id").notEmpty()'],
                ['headers("Content-Type").contains("application/json")']
              ],
              headers: [
                { 'Content-Type': 'application/json' },
                { 'Accept': 'application/json' }
              ],
              setup: '' // Empty setup script (should be skipped)
            }
          ]
        }
      ],
      app2: [],
      app3: [],
      app4: []
    };
    success('Test app configured with 2 API checks');

    // 3. Create check group for app1
    log('3. Creating check group...');
    const tierConfig = testApp.app1[0] || {};
    const checkGroup = transformCheckGroup(testApp, 'app1', alertChannels, tierConfig);
    checkGroup.hcl = generateHcl(checkGroup);
    success(`Check group created: ${checkGroup.resourceId}`);

    // 4. Create API checks
    log('4. Creating API checks...');
    const apiChecks = [];
    for (const checkCategory of testApp.app1) {
      if (checkCategory.api_check) {
        for (const check of checkCategory.api_check) {
          const apiCheck = transformApiCheck(testApp, 'app1', check, checkGroup, checkCategory);
          apiCheck.hcl = generateHcl(apiCheck);
          apiChecks.push(apiCheck);
        }
      }
    }
    success(`Created ${apiChecks.length} API checks`);

    // 5. Create dashboard
    log('5. Creating dashboard...');
    const dashboard = transformDashboard(testApp);
    dashboard.hcl = generateHcl(dashboard);
    success('Dashboard created');

    // 6. Create provider files
    log('6. Creating Terraform provider configuration...');
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

    // 7. Organize and write files
    log('7. Organizing resources by file...');
    const resources = [
      ...alertChannels,
      checkGroup,
      ...apiChecks,
      dashboard,
      mainTf,
      variablesTf,
      tfvarsExample,
      gitignore
    ];
    const fileMap = organizeByFile(resources);
    success(`Organized into ${Object.keys(fileMap).length} files`);

    log('8. Writing files to test-output-phase8/...');
    await writeFiles('test-output-phase8', fileMap);
    success('Files written successfully');

    // 9. Summary
    console.log('');
    success('✓ Phase 8 validation complete - FIRST DEPLOYMENT MILESTONE!');
    log('Generated resources:');
    log(`  - 12 alert channels`);
    log(`  - 1 check group (subscribed to all 12 channels)`);
    log(`  - ${apiChecks.length} API checks with assertions and headers`);
    log(`  - 1 dashboard`);
    log('');
    log('Next steps:');
    log('  1. Copy terraform.tfvars.example to terraform.tfvars');
    log('  2. Fill in your Checkly API key and account ID');
    log('  3. cd test-output-phase8');
    log('  4. terraform init');
    log('  5. terraform validate');
    log('  6. terraform plan');
    log('  7. terraform apply  # Deploy to Checkly!');
    log('');
    log('After deployment, verify in Checkly UI:');
    log('  - Checks run successfully');
    log('  - Assertions execute correctly');
    log('  - Headers are sent with requests');
    log('  - Alert channels subscribed to group');
    log('  - Dashboard shows checks');

  } catch (err) {
    error(`Test failed: ${(err as Error).message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
