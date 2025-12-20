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
 *
 * @example
 * generateBoilerplate('/path/to/__tf_checks__')
 * // Creates:
 * //   /path/to/__tf_checks__/terraform.tf
 * //   /path/to/__tf_checks__/variables.tf
 * //   /path/to/__tf_checks__/provider.tf
 */
export function generateBoilerplate(outputDir: string): void {
  generateTerraformTf(outputDir);
  generateVariablesTf(outputDir);
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
 * Generate variables.tf with Checkly credentials variable definitions
 *
 * @param outputDir - The root output directory path
 */
function generateVariablesTf(outputDir: string): void {
  const content = `variable "checkly_api_key" {
  type        = string
  description = "Checkly API Key"
  sensitive   = true
}

variable "checkly_account_id" {
  type        = string
  description = "Checkly Account ID"
}
`;

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
