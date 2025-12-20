/**
 * Configuration constants for Terraform generation
 * Default values, mappings, and configuration options
 */

/**
 * Default geographic locations for check execution
 * These are AWS region identifiers where Checkly can run checks
 */
export const DEFAULT_LOCATIONS = ['us-east-1', 'us-west-2'];

/**
 * Default Checkly runtime version
 * This determines the Node.js version and available features
 */
export const DEFAULT_RUNTIME_ID = '2023.09';

/**
 * Default concurrency for check groups
 * Maximum number of checks that can run in parallel within a group
 */
export const DEFAULT_CONCURRENCY = 100;

/**
 * Checkly Terraform provider version constraint
 * Using ~> 1.7 means >= 1.7.0 and < 2.0.0
 */
export const CHECKLY_PROVIDER_VERSION = '~> 1.7';

/**
 * Default response time thresholds (in milliseconds)
 */
export const DEFAULT_DEGRADED_RESPONSE_TIME = 10000;  // 10 seconds
export const DEFAULT_MAX_RESPONSE_TIME = 20000;        // 20 seconds

/**
 * Dashboard configuration defaults
 */
export const DEFAULT_DASHBOARD_LOGO = 'https://www.checklyhq.com/images/text_racoon_logo.svg';

/**
 * Mapping from CLI assertion source methods to Terraform source constants
 * CLI uses camelCase method names, Terraform uses SCREAMING_SNAKE_CASE
 */
export const ASSERTION_SOURCE_MAP: { [key: string]: string } = {
  statusCode: 'STATUS_CODE',
  jsonBody: 'JSON_BODY',
  textBody: 'TEXT_BODY',
  responseTime: 'RESPONSE_TIME',
  headers: 'HEADERS',
};

/**
 * Mapping from CLI assertion comparison methods to Terraform comparison constants
 * CLI uses camelCase method names, Terraform uses SCREAMING_SNAKE_CASE
 */
export const ASSERTION_COMPARISON_MAP: { [key: string]: string } = {
  equals: 'EQUALS',
  notEquals: 'NOT_EQUALS',
  contains: 'CONTAINS',
  notContains: 'NOT_CONTAINS',
  greaterThan: 'GREATER_THAN',
  lessThan: 'LESS_THAN',
  greaterThanOrEqual: 'GREATER_THAN_OR_EQUAL',
  lessThanOrEqual: 'LESS_THAN_OR_EQUAL',
  isEmpty: 'IS_EMPTY',
  isNotEmpty: 'IS_NOT_EMPTY',
  hasKey: 'HAS_KEY',
  hasValue: 'HAS_VALUE',
  isNull: 'IS_NULL',
  isNotNull: 'IS_NOT_NULL',
};

/**
 * Tier names in priority order (highest to lowest)
 * Used for iterating through tiers in the correct order
 */
export const TIER_ORDER: string[] = ['app4', 'app3', 'app2', 'app1'];

/**
 * Email alert channel tier mapping
 * Maps tier names to alert channel resource IDs
 */
export const ALERT_CHANNEL_TIER_MAP: { [key: string]: string } = {
  app1: 'email_tier_1',
  app2: 'email_tier_2',
  app3: 'email_tier_3',
  app4: 'email_tier_4',
};

/**
 * All alert channel resource IDs
 * Used for subscribing groups to all channels
 */
export const ALL_ALERT_CHANNEL_IDS: string[] = [
  'email_tier_1',
  'email_tier_2',
  'email_tier_3',
  'email_tier_4',
];
