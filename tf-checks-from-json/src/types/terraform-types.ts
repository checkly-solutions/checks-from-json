/**
 * Type definitions for Terraform resource structures
 * These interfaces define the shape of Terraform configuration blocks
 */

/**
 * Terraform assertion block for API checks
 * Defines the expected response characteristics
 */
export interface TerraformAssertion {
  /** Where to check (STATUS_CODE, JSON_BODY, TEXT_BODY, RESPONSE_TIME, HEADERS) */
  source: string;
  /** How to compare (EQUALS, NOT_EQUALS, CONTAINS, GREATER_THAN, LESS_THAN, etc.) */
  comparison: string;
  /** The expected value */
  target: string;
  /** Optional property path for JSON_BODY or header name for HEADERS */
  property?: string;
}

/**
 * Parsed assertion from CLI format
 * Intermediate representation before mapping to Terraform
 */
export interface ParsedAssertion {
  /** The assertion source method (statusCode, jsonBody, etc.) */
  sourceMethod: string;
  /** Arguments passed to the source method (if any) */
  sourceArgs?: string;
  /** The comparison method (equals, contains, lessThan, etc.) */
  comparisonMethod: string;
  /** Arguments passed to the comparison method */
  comparisonArgs: string;
}

/**
 * Configuration for a Terraform check group resource
 */
export interface TerraformGroupConfig {
  /** Terraform resource identifier */
  resourceId: string;
  /** Human-readable group name */
  name: string;
  /** Whether checks in the group are running */
  activated: boolean;
  /** Whether to suppress notifications */
  muted: boolean;
  /** Number of checks that can run in parallel */
  concurrency: number;
  /** Geographic locations where checks run */
  locations: string[];
  /** Tags for organizing and filtering */
  tags: string[];
  /** Alert channel resource IDs to subscribe to */
  alertChannelIds: string[];
}

/**
 * Configuration for a Terraform API check resource
 */
export interface TerraformAPICheckConfig {
  /** Terraform resource identifier */
  resourceId: string;
  /** Human-readable check name */
  name: string;
  /** Whether the check is running */
  activated: boolean;
  /** How often to run (in minutes) */
  frequency: number;
  /** Terraform resource ID of the parent group */
  groupResourceId: string;
  /** Tags for organizing and filtering */
  tags: string[];
  /** API endpoint URL */
  url: string;
  /** HTTP method */
  method: string;
  /** Assertions to validate the response */
  assertions: TerraformAssertion[];
  /** Optional HTTP headers */
  headers?: { [key: string]: string };
  /** Optional setup script content (inlined as heredoc) */
  setupScript?: string;
  /** Whether the check should expect failure */
  shouldFail: boolean;
  /** Response time threshold for degraded state (ms) */
  degradedResponseTime: number;
  /** Maximum acceptable response time (ms) */
  maxResponseTime: number;
}

/**
 * Configuration for a Terraform browser/multi-step check resource
 */
export interface TerraformBrowserCheckConfig {
  /** Terraform resource identifier */
  resourceId: string;
  /** Human-readable check name */
  name: string;
  /** Check type (BROWSER or MULTI_STEP) */
  type: 'BROWSER' | 'MULTI_STEP';
  /** Whether the check is running */
  activated: boolean;
  /** How often to run (in minutes) */
  frequency: number;
  /** Terraform resource ID of the parent group */
  groupResourceId: string;
  /** Tags for organizing and filtering */
  tags: string[];
  /** Playwright/Puppeteer script content (inlined as heredoc) */
  script: string;
  /** Runtime version (e.g., "2023.09") */
  runtimeId: string;
}

/**
 * Configuration for a Terraform dashboard resource
 */
export interface TerraformDashboardConfig {
  /** Terraform resource identifier */
  resourceId: string;
  /** Custom URL slug for the dashboard */
  customUrl: string;
  /** Dashboard header/title */
  header: string;
  /** Optional description */
  description: string;
  /** Logo URL */
  logo: string;
  /** Tags for filtering checks to display */
  tags: string[];
}

/**
 * Configuration for a Terraform alert channel resource
 */
export interface TerraformAlertChannelConfig {
  /** Terraform resource identifier */
  resourceId: string;
  /** Channel type (email, webhook, etc.) */
  type: 'email' | 'webhook' | 'slack' | 'pagerduty' | 'opsgenie';
  /** Email address (for email type) */
  email?: string;
  /** Webhook URL (for webhook type) */
  webhookUrl?: string;
  /** Webhook name (for webhook type) */
  webhookName?: string;
  /** Whether to send recovery notifications */
  sendRecovery: boolean;
  /** Whether to send failure notifications */
  sendFailure: boolean;
  /** Whether to send degraded notifications */
  sendDegraded: boolean;
}
