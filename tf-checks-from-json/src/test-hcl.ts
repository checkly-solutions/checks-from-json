/**
 * Test harness for HCL generation, file organization, and file writing
 * Phase 5 validation checkpoint
 */

import { generateHcl } from './generators/hcl-generator';
import { organizeByFile } from './generators/file-organizer';
import { writeFiles } from './writers/file-writer';
import { TerraformResource } from './types/terraform.types';
import { log, success, error } from './utils/logger';

async function main() {
  try {
    log('Testing complete HCL generation stack...');

    // Create a sample API check resource
    const sampleCheck: TerraformResource = {
      resourceType: 'checkly_check',
      resourceId: 'api_test_example_app1',
      fileName: 'checks_api.tf',
      attributes: {
        name: 'test-api example app1',
        type: 'API',
        activated: true,
        frequency: 5,
        group_id: 'checkly_check_group.group_example_app1.id',
        tags: ['API', 'example', 'app1', 'cli'],
        degraded_response_time: 10000,
        max_response_time: 20000,
        locations: ['us-east-1', 'us-west-2'],
        request: {
          url: 'https://api.example.com/test',
          method: 'GET',
          follow_redirects: true,
          skip_ssl: true,
          assertion: [
            {
              source: 'STATUS_CODE',
              comparison: 'EQUALS',
              target: '200'
            }
          ]
        }
      }
    };

    // Generate HCL
    log('1. Generating HCL...');
    sampleCheck.hcl = generateHcl(sampleCheck);
    success('HCL generated');

    // Create main.tf and variables.tf
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

    // Organize by file
    log('2. Organizing files...');
    const resources = [sampleCheck, mainTf, variablesTf];
    const fileMap = organizeByFile(resources);
    success(`Organized into ${Object.keys(fileMap).length} files`);

    // Write files
    log('3. Writing files to test-output/...');
    await writeFiles('test-output', fileMap);
    success('Files written successfully');

    console.log('');
    success('✓ Phase 5 validation complete!');
    log('Check test-output/ directory for generated Terraform files');

  } catch (err) {
    error(`Test failed: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
