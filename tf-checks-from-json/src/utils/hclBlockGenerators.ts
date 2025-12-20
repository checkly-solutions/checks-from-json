/**
 * Utility functions for generating reusable HCL blocks
 * These functions generate common Terraform configuration blocks that are shared across multiple resource types
 */

import { AlertSettings, RetryStrategy, EnvironmentVariable } from '../types/json-types';
import { formatHCLValue } from './variableResolver';
import { formatHCLBool } from './formatHCL';

/**
 * Generate HCL block for alert_settings
 *
 * @param settings - Alert settings configuration
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns HCL string for alert_settings block
 *
 * @example
 * generateAlertSettingsBlock({
 *   escalation_type: 'RUN_BASED',
 *   run_based_escalation: { failed_run_threshold: 2 },
 *   reminders: { amount: 1, interval: 5 }
 * }, 2)
 */
export function generateAlertSettingsBlock(settings: AlertSettings, indent: number = 2): string {
  const baseIndent = ' '.repeat(indent);
  const innerIndent = ' '.repeat(indent + 2);
  const nestedIndent = ' '.repeat(indent + 4);

  let hcl = `${baseIndent}alert_settings {\n`;

  // Escalation type
  if (settings.escalation_type) {
    hcl += `${innerIndent}escalation_type = "${settings.escalation_type}"\n`;
  }

  // Run-based escalation
  if (settings.run_based_escalation) {
    hcl += `\n${innerIndent}run_based_escalation {\n`;
    hcl += `${nestedIndent}failed_run_threshold = ${settings.run_based_escalation.failed_run_threshold}\n`;
    hcl += `${innerIndent}}\n`;
  }

  // Time-based escalation
  if (settings.time_based_escalation) {
    hcl += `\n${innerIndent}time_based_escalation {\n`;
    hcl += `${nestedIndent}minutes_failing_threshold = ${settings.time_based_escalation.minutes_failing_threshold}\n`;
    hcl += `${innerIndent}}\n`;
  }

  // Reminders
  if (settings.reminders) {
    hcl += `\n${innerIndent}reminders {\n`;
    hcl += `${nestedIndent}amount   = ${settings.reminders.amount}\n`;
    hcl += `${nestedIndent}interval = ${settings.reminders.interval}\n`;
    hcl += `${innerIndent}}\n`;
  }

  // Parallel run failure threshold
  if (settings.parallel_run_failure_threshold) {
    hcl += `\n${innerIndent}parallel_run_failure_threshold {\n`;
    hcl += `${nestedIndent}enabled    = ${formatHCLBool(settings.parallel_run_failure_threshold.enabled)}\n`;
    hcl += `${nestedIndent}percentage = ${settings.parallel_run_failure_threshold.percentage}\n`;
    hcl += `${innerIndent}}\n`;
  }

  hcl += `${baseIndent}}`;

  return hcl;
}

/**
 * Generate HCL block for retry_strategy
 *
 * @param strategy - Retry strategy configuration
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns HCL string for retry_strategy block
 *
 * @example
 * generateRetryStrategyBlock({
 *   type: 'FIXED',
 *   base_backoff_seconds: 60,
 *   max_duration_seconds: 600,
 *   max_retries: 3
 * }, 2)
 */
export function generateRetryStrategyBlock(strategy: RetryStrategy, indent: number = 2): string {
  const baseIndent = ' '.repeat(indent);
  const innerIndent = ' '.repeat(indent + 2);

  let hcl = `${baseIndent}retry_strategy {\n`;
  hcl += `${innerIndent}type = "${strategy.type}"\n`;

  if (strategy.base_backoff_seconds !== undefined) {
    hcl += `${innerIndent}base_backoff_seconds = ${strategy.base_backoff_seconds}\n`;
  }

  if (strategy.max_duration_seconds !== undefined) {
    hcl += `${innerIndent}max_duration_seconds = ${strategy.max_duration_seconds}\n`;
  }

  if (strategy.max_retries !== undefined) {
    hcl += `${innerIndent}max_retries = ${strategy.max_retries}\n`;
  }

  if (strategy.same_region !== undefined) {
    hcl += `${innerIndent}same_region = ${formatHCLBool(strategy.same_region)}\n`;
  }

  // only_on nested block
  if (strategy.only_on) {
    hcl += `\n${innerIndent}only_on {\n`;
    if (strategy.only_on.network_error !== undefined) {
      hcl += `${' '.repeat(indent + 4)}network_error = ${formatHCLBool(strategy.only_on.network_error)}\n`;
    }
    hcl += `${innerIndent}}\n`;
  }

  hcl += `${baseIndent}}`;

  return hcl;
}

/**
 * Generate HCL blocks for environment variables
 *
 * @param vars - Array of environment variable configurations
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns HCL string with multiple environment_variable blocks
 *
 * @example
 * generateEnvironmentVariablesBlock([
 *   { key: 'TEST_URL', value: 'https://test.example.com', locked: false },
 *   { key: 'API_KEY', value: 'var:api_key', locked: true, secret: true }
 * ], 2)
 */
export function generateEnvironmentVariablesBlock(vars: EnvironmentVariable[], indent: number = 2): string {
  const baseIndent = ' '.repeat(indent);
  const innerIndent = ' '.repeat(indent + 2);

  const blocks = vars.map((envVar) => {
    // Format value (handles both literal strings and "var:*" references)
    const formattedValue = formatHCLValue(envVar.value);

    let hcl = `${baseIndent}environment_variable {\n`;
    hcl += `${innerIndent}key   = "${envVar.key}"\n`;
    hcl += `${innerIndent}value = ${formattedValue}\n`;

    if (envVar.locked !== undefined) {
      hcl += `${innerIndent}locked = ${formatHCLBool(envVar.locked)}\n`;
    }

    if (envVar.secret !== undefined) {
      hcl += `${innerIndent}secret = ${formatHCLBool(envVar.secret)}\n`;
    }

    hcl += `${baseIndent}}`;

    return hcl;
  });

  return blocks.join('\n\n');
}
