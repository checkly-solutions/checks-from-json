/**
 * Generator for Terraform boilerplate files
 * Creates terraform.tf, variables.tf, and provider.tf
 */

import path from 'path';
import { writeHCL } from '../utils/fileUtils';
import { CHECKLY_PROVIDER_VERSION } from '../config/constants';

/**
 * Generate all boilerplate files in the output directory root
 * Creates terraform.tf, variables.tf, and provider.tf
 *
 * @param outputDir - The root output directory path
 * @param variableRefs - Set of variable names referenced in alert channel configs
 *
 * @example
 * generateBoilerplate('/path/to/__tf_checks__', new Set(['email_tier1', 'slack_url']))
 * // Creates:
 * //   /path/to/__tf_checks__/terraform.tf
 * //   /path/to/__tf_checks__/variables.tf (with dynamic alert channel variables)
 * //   /path/to/__tf_checks__/provider.tf
 */
export function generateBoilerplate(outputDir: string, variableRefs: Set<string> = new Set()): void {
  generateTerraformTf(outputDir);
  generateVariablesTf(outputDir, variableRefs);
  generateProviderTf(outputDir);
}

/**
 * Generate terraform.tf with required providers configuration
 *
 * @param outputDir - The root output directory path
 */
function generateTerraformTf(outputDir: string): void {
  const content = `terraform {
  required_providers {
    checkly = {
      source  = "checkly/checkly"
      version = "${CHECKLY_PROVIDER_VERSION}"
    }
  }
}
`;

  const filePath = path.join(outputDir, 'terraform.tf');
  writeHCL(filePath, content);
}

/**
 * Generate variables.tf with Checkly credentials and dynamic alert channel variables
 *
 * @param outputDir - The root output directory path
 * @param variableRefs - Set of variable names to generate definitions for
 */
function generateVariablesTf(outputDir: string, variableRefs: Set<string>): void {
  // Base credentials (always included)
  let content = `variable "checkly_api_key" {
  type        = string
  description = "Checkly API Key"
  sensitive   = true
}

variable "checkly_account_id" {
  type        = string
  description = "Checkly Account ID"
}
`;

  // Add variable definition for each referenced variable
  if (variableRefs.size > 0) {
    content += '\n# Alert Channel Variables\n';

    // Sort for consistent output
    Array.from(variableRefs).sort().forEach((varName) => {
      content += `
variable "${varName}" {
  type        = string
  description = "Alert channel configuration value for ${varName}"
  sensitive   = true
}
`;
    });
  }

  const filePath = path.join(outputDir, 'variables.tf');
  writeHCL(filePath, content);
}

/**
 * Generate provider.tf with Checkly provider configuration
 *
 * @param outputDir - The root output directory path
 */
function generateProviderTf(outputDir: string): void {
  const content = `provider "checkly" {
  api_key    = var.checkly_api_key
  account_id = var.checkly_account_id
}
`;

  const filePath = path.join(outputDir, 'provider.tf');
  writeHCL(filePath, content);
}
