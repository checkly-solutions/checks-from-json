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
 * Valid alert escalation types
 */
export const VALID_ESCALATION_TYPES = ['RUN_BASED', 'TIME_BASED'] as const;

/**
 * Valid retry strategy types
 */
export const VALID_RETRY_TYPES = [
  'FIXED',
  'LINEAR',
  'EXPONENTIAL',
  'SINGLE_RETRY',
  'NO_RETRIES'
] as const;

/**
 * Valid frequency values (in minutes)
 * Covers standard intervals from 0 (on-demand) to 1440 (daily)
 */
export const VALID_FREQUENCY_VALUES = [
  0, 1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440
] as const;

/**
 * Valid HTTP request body types
 */
export const VALID_BODY_TYPES = ['NONE', 'JSON', 'FORM', 'RAW', 'GRAPHQL'] as const;

/**
 * Valid DNS record types
 */
export const VALID_DNS_RECORD_TYPES = [
  'A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'PTR', 'CAA'
] as const;

/**
 * Valid IP family options
 */
export const VALID_IP_FAMILIES = ['IPv4', 'IPv6'] as const;

/**
 * Valid time units for heartbeat monitors
 */
export const VALID_HEARTBEAT_TIME_UNITS = ['minute', 'hour', 'day'] as const;

/**
 * Valid dashboard width options
 */
export const VALID_DASHBOARD_WIDTHS = ['FULL', '960PX'] as const;

/**
 * Valid dashboard refresh rates (in seconds)
 */
export const VALID_DASHBOARD_REFRESH_RATES = [60, 300, 600] as const;

/**
 * Valid dashboard pagination rates (in seconds)
 */
export const VALID_DASHBOARD_PAGINATION_RATES = [30, 60, 300] as const;

/**
 * Maximum response time thresholds by resource type
 */
export const MAX_RESPONSE_TIME_HTTP = 30000;  // 30 seconds for HTTP-based checks
export const MAX_RESPONSE_TIME_TCP_DNS = 5000;  // 5 seconds for TCP/DNS monitors

/**
 * Valid run-based escalation thresholds
 */
export const VALID_RUN_BASED_THRESHOLDS = [1, 2, 3, 4, 5] as const;

/**
 * Valid time-based escalation thresholds (in minutes)
 */
export const VALID_TIME_BASED_THRESHOLDS = [5, 10, 15, 30] as const;

/**
 * Valid reminder intervals (in minutes)
 */
export const VALID_REMINDER_INTERVALS = [5, 10, 15, 30] as const;

/**
 * Valid parallel run failure percentages
 */
export const VALID_PARALLEL_RUN_PERCENTAGES = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100
] as const;

