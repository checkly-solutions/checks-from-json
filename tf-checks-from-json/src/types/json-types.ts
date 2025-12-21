/**
 * Type definitions for the JSON input structure (urlList-full-coverage.json)
 * These interfaces define the shape of the input data that drives check generation
 */

/**
 * Alert settings configuration
 * Controls when and how alerts are sent, with escalation thresholds and reminders
 */
export interface AlertSettings {
  /** Type of escalation - run-based or time-based */
  escalation_type?: 'RUN_BASED' | 'TIME_BASED';
  /** Run-based escalation configuration */
  run_based_escalation?: {
    /** Number of failed runs before escalating (1-5) */
    failed_run_threshold: 1 | 2 | 3 | 4 | 5;
  };
  /** Time-based escalation configuration */
  time_based_escalation?: {
    /** Minutes failing before escalating */
    minutes_failing_threshold: 5 | 10 | 15 | 30;
  };
  /** Reminder configuration */
  reminders?: {
    /** Number of reminders (0-5 or 100000 for unlimited) */
    amount: number;
    /** Interval between reminders in minutes */
    interval: 5 | 10 | 15 | 30;
  };
  /** Parallel run failure threshold configuration */
  parallel_run_failure_threshold?: {
    /** Whether to enable parallel run failure threshold */
    enabled: boolean;
    /** Percentage of parallel runs that must fail */
    percentage: 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
  };
}

/**
 * Retry strategy configuration
 * Configure automatic retries for transient failures with different backoff strategies
 */
export interface RetryStrategy {
  /** Type of retry strategy */
  type: 'FIXED' | 'LINEAR' | 'EXPONENTIAL' | 'SINGLE_RETRY' | 'NO_RETRIES';
  /** Base backoff in seconds before first retry */
  base_backoff_seconds?: number;
  /** Maximum duration for retries in seconds (max 600) */
  max_duration_seconds?: number;
  /** Maximum number of retries (1-10 for FIXED/LINEAR/EXPONENTIAL) */
  max_retries?: number;
  /** Whether to retry in the same region */
  same_region?: boolean;
  /** Conditions for retry */
  only_on?: {
    /** Retry only on network errors */
    network_error?: boolean;
  };
}

/**
 * Environment variable configuration
 * Pass configuration and secrets to checks via environment variables
 */
export interface EnvironmentVariable {
  /** Variable key name */
  key: string;
  /** Variable value (supports "var:variable_name" pattern for Terraform variables) */
  value: string;
  /** Whether the variable is locked from editing in UI */
  locked?: boolean;
  /** Whether the variable value is secret/sensitive */
  secret?: boolean;
}

/**
 * Code snippet configuration
 * Reusable Node.js code for setup/teardown operations
 */
export interface SnippetConfig {
  /** Unique identifier for this snippet */
  id: string;
  /** Display name for the snippet */
  name: string;
  /** Path to script file or inline script content */
  script: string;
}

/**
 * Root configuration with alert channels and apps
 * New format that includes alert channel definitions
 */
export interface RootConfig {
  /** Global alert channel definitions */
  alertChannels: AlertChannelDefinition[];
  /** Application configurations */
  apps: UrlListConfig[];
  /** Optional reusable code snippets */
  snippets?: SnippetConfig[];
  /** Optional global environment variables (account-level) */
  global_environment_variables?: EnvironmentVariable[];
}

/**
 * Alert channel definition
 * Defines a reusable alert channel that can be referenced by check groups
 */
export interface AlertChannelDefinition {
  /** Unique identifier for this alert channel */
  id: string;
  /** Type of alert channel */
  type: 'email' | 'sms' | 'slack' | 'pagerduty' | 'opsgenie' | 'webhook' | 'call';
  /** Type-specific configuration */
  config:
    | EmailChannelConfig
    | SmsChannelConfig
    | SlackChannelConfig
    | PagerdutyChannelConfig
    | OpsgenieChannelConfig
    | WebhookChannelConfig
    | CallChannelConfig;
  /** Send alert on recovery (default: true) */
  send_recovery?: boolean;
  /** Send alert on failure (default: true) */
  send_failure?: boolean;
  /** Send alert on degraded status (default: false) */
  send_degraded?: boolean;
  /** Send SSL expiry alerts (email only, default: false) */
  ssl_expiry?: boolean;
  /** SSL expiry threshold in days (email only, 1-30, default: 30) */
  ssl_expiry_threshold?: number;
}

/**
 * Email alert channel configuration
 */
export interface EmailChannelConfig {
  /** Email address (can be "var:variable_name" for Terraform variable) */
  address: string;
}

/**
 * SMS alert channel configuration
 */
export interface SmsChannelConfig {
  /** Name for this SMS channel */
  name: string;
  /** Phone number in international format (can be "var:variable_name" for Terraform variable) */
  number: string;
}

/**
 * Slack alert channel configuration
 */
export interface SlackChannelConfig {
  /** Slack channel name (e.g., "#alerts") */
  channel: string;
  /** Slack webhook URL (can be "var:variable_name" for Terraform variable) */
  url: string;
}

/**
 * PagerDuty alert channel configuration
 */
export interface PagerdutyChannelConfig {
  /** PagerDuty service key (can be "var:variable_name" for Terraform variable) */
  service_key: string;
  /** PagerDuty account name (optional) */
  account?: string;
  /** PagerDuty service name (optional) */
  service_name?: string;
}

/**
 * Opsgenie alert channel configuration
 */
export interface OpsgenieChannelConfig {
  /** Opsgenie channel name */
  name: string;
  /** Opsgenie API key (can be "var:variable_name" for Terraform variable) */
  api_key: string;
  /** Opsgenie region (e.g., "us", "eu") */
  region: string;
  /** Alert priority */
  priority: string;
}

/**
 * Webhook alert channel configuration
 */
export interface WebhookChannelConfig {
  /** Webhook name */
  name: string;
  /** Webhook URL (can be "var:variable_name" for Terraform variable) */
  url: string;
  /** HTTP method (default: POST) */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Custom headers (values can be "var:variable_name") */
  headers?: { [key: string]: string };
  /** Query parameters */
  query_parameters?: { [key: string]: string };
  /** Request body template using Checkly placeholders */
  template?: string;
  /** Webhook secret (can be "var:variable_name") */
  webhook_secret?: string;
  /** Webhook type for specialized integrations */
  webhook_type?:
    | 'WEBHOOK_DISCORD'
    | 'WEBHOOK_FIREHYDRANT'
    | 'WEBHOOK_GITLAB_ALERT'
    | 'WEBHOOK_SPIKESH'
    | 'WEBHOOK_SPLUNK'
    | 'WEBHOOK_MSTEAMS'
    | 'WEBHOOK_TELEGRAM';
}

/**
 * Phone call alert channel configuration
 */
export interface CallChannelConfig {
  /** Name for this phone call channel */
  name: string;
  /** Phone number in international format (can be "var:variable_name" for Terraform variable) */
  number: string;
}

/**
 * API check defaults that apply to all API checks in a group
 * These defaults are inherited by checks unless overridden at the check level
 */
export interface ApiCheckDefaults {
  /** Base URL for all API checks in this group (REQUIRED by Terraform provider) */
  url: string;
  /** Default headers for all API checks in this group */
  headers?: { [key: string]: string };
  /** Default query parameters for all API checks in this group */
  query_parameters?: { [key: string]: string };
  /** Default basic authentication for all API checks in this group */
  basic_auth?: {
    username: string;
    password: string;
  };
}

/**
 * Tier definition with alert channel mapping
 * Allows arbitrary tier names and explicit alert channel assignment
 */
export interface TierDefinition {
  /** Alert channel resource ID for this tier */
  alertChannel: string;
  /** Array of check categories for this tier */
  checks: CheckCategory[];
  /** Alert settings that apply to all checks in this tier */
  alert_settings?: AlertSettings;
  /** Retry strategy that applies to all checks in this tier */
  retry_strategy?: RetryStrategy;
  /** Environment variables that apply to all checks in this tier */
  environment_variables?: EnvironmentVariable[];
  /** Runtime ID for all checks in this tier (e.g., "2023.09") */
  runtime_id?: string;
  /** Whether checks in this tier run in parallel across all locations */
  run_parallel?: boolean;
  /** Private locations for checks in this tier */
  private_locations?: string[];
  /** Locations where checks in this tier run (overrides DEFAULT_LOCATIONS) */
  locations?: string[];
  /** Whether checks in this tier are muted */
  muted?: boolean;
  /** Tags that apply to all checks in this tier */
  tags?: string[];
  /** Whether to use global alert settings for checks in this tier */
  use_global_alert_settings?: boolean;
  /** Concurrency limit for this tier (overrides DEFAULT_CONCURRENCY) */
  concurrency?: number;
  /** Default configurations for API checks in this tier */
  api_check_defaults?: ApiCheckDefaults;
}

/**
 * Dashboard configuration
 * Public dashboards for displaying check status
 */
export interface DashboardConfig {
  /** Unique subdomain under checklyhq.com (required) */
  custom_url: string;
  /** Dashboard header text (required) */
  header: string;
  /** Dashboard description */
  description?: string;
  /** Logo URL */
  logo?: string;
  /** Refresh rate in seconds (60, 300, 600) */
  refresh_rate?: 60 | 300 | 600;
  /** Dashboard width (FULL or 960PX) */
  width?: 'FULL' | '960PX';
  /** Show dashboard header */
  show_header?: boolean;
  /** Show P95 response time */
  show_p95?: boolean;
  /** Show P99 response time */
  show_p99?: boolean;
  /** Show links to check run results */
  show_check_run_links?: boolean;
  /** Expand all checks by default */
  expand_checks?: boolean;
  /** Enable pagination */
  paginate?: boolean;
  /** Pagination rate in seconds (30, 60, 300) */
  pagination_rate?: 30 | 60 | 300;
  /** Number of checks per page (1-20) */
  checks_per_page?: number;
  /** Use AND operator for tags (default: OR) */
  use_tags_and_operator?: boolean;
  /** Hide tags on dashboard */
  hide_tags?: boolean;
  /** Make dashboard private (requires authentication) */
  is_private?: boolean;
  /** Enable incident communication */
  enable_incidents?: boolean;
  /** Custom CSS for dashboard styling */
  custom_css?: string;
  /** Custom domain for dashboard */
  custom_domain?: string;
  /** Favicon URL */
  favicon?: string;
  /** Link URL for dashboard logo */
  link?: string;
}

/**
 * Root configuration for an environment/application
 * Contains the app name and dynamically-defined tiers
 */
export interface UrlListConfig {
  appName: string;
  /** Dynamic tier names as keys, tier definitions as values */
  tiers: { [tierName: string]: TierDefinition };
  /** Optional dashboard configuration */
  dashboard?: DashboardConfig;
}

/**
 * URL Monitor configuration
 * Simpler HTTP endpoint monitoring without complex assertions
 */
export interface UrlMonitorConfig {
  /** Display name for the monitor */
  name: string;
  /** URL to monitor */
  url: string;
  /** How often to run the monitor (in minutes) */
  frequency: number;
  /** Whether the monitor is currently active */
  activated: boolean;
  /** Degraded response time threshold in milliseconds (0-30000, default: 3000) */
  degraded_response_time?: number;
  /** Maximum response time threshold in milliseconds (0-30000, default: 5000) */
  max_response_time?: number;
  /** Whether to follow HTTP redirects */
  follow_redirects?: boolean;
  /** IP family to use for the request */
  ip_family?: 'IPv4' | 'IPv6';
  /** Whether to skip SSL certificate verification */
  skip_ssl?: boolean;
  /** Alert settings configuration */
  alert_settings?: AlertSettings;
  /** Retry strategy configuration */
  retry_strategy?: RetryStrategy;
  /** Locations where this monitor runs */
  locations?: string[];
  /** Private locations for this monitor */
  private_locations?: string[];
  /** Tags for organization */
  tags?: string[];
  /** Whether this monitor is muted */
  muted?: boolean;
  /** Whether the monitor should expect a failure */
  should_fail?: boolean;
  /** Whether to use global alert settings */
  use_global_alert_settings?: boolean;
}

/**
 * TCP Monitor configuration
 * Monitor TCP port connectivity and response
 */
export interface TcpMonitorConfig {
  /** Display name for the monitor */
  name: string;
  /** Hostname or IP address to monitor */
  hostname: string;
  /** TCP port number to connect to */
  port: number;
  /** How often to run the monitor (in minutes) */
  frequency: number;
  /** Whether the monitor is currently active */
  activated: boolean;
  /** Data to send after connection (optional) */
  data?: string;
  /** Degraded response time threshold in milliseconds (0-5000, default: 1000) */
  degraded_response_time?: number;
  /** Maximum response time threshold in milliseconds (0-5000, default: 3000) */
  max_response_time?: number;
  /** IP family to use for the connection */
  ip_family?: 'IPv4' | 'IPv6';
  /** Alert settings configuration */
  alert_settings?: AlertSettings;
  /** Retry strategy configuration */
  retry_strategy?: RetryStrategy;
  /** Locations where this monitor runs */
  locations?: string[];
  /** Private locations for this monitor */
  private_locations?: string[];
  /** Tags for organization */
  tags?: string[];
  /** Whether this monitor is muted */
  muted?: boolean;
  /** Whether the monitor should expect a failure */
  should_fail?: boolean;
  /** Whether to use global alert settings */
  use_global_alert_settings?: boolean;
}

/**
 * DNS Monitor configuration
 * Monitor DNS resolution and validate records
 */
export interface DnsMonitorConfig {
  /** Display name for the monitor */
  name: string;
  /** Domain name or hostname to query */
  query: string;
  /** DNS record type to query */
  record_type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'TXT' | 'SOA' | 'PTR' | 'CAA';
  /** How often to run the monitor (in minutes) */
  frequency: number;
  /** Whether the monitor is currently active */
  activated: boolean;
  /** Degraded response time threshold in milliseconds (0-5000, default: 1000) */
  degraded_response_time?: number;
  /** Maximum response time threshold in milliseconds (0-5000, default: 3000) */
  max_response_time?: number;
  /** Protocol to use for DNS query */
  protocol?: 'UDP' | 'TCP';
  /** Custom name server to query (hostname:port or IP:port) */
  name_server?: string;
  /** Alert settings configuration */
  alert_settings?: AlertSettings;
  /** Retry strategy configuration */
  retry_strategy?: RetryStrategy;
  /** Locations where this monitor runs */
  locations?: string[];
  /** Private locations for this monitor */
  private_locations?: string[];
  /** Tags for organization */
  tags?: string[];
  /** Whether this monitor is muted */
  muted?: boolean;
  /** Whether the monitor should expect a failure */
  should_fail?: boolean;
  /** Whether to use global alert settings */
  use_global_alert_settings?: boolean;
}

/**
 * Heartbeat Monitor configuration
 * Monitor cron jobs and background services via periodic pings
 */
export interface HeartbeatMonitorConfig {
  /** Display name for the monitor */
  name: string;
  /** Expected period between heartbeats */
  period: number;
  /** Unit for the period (minute, hour, day) */
  period_unit: 'minute' | 'hour' | 'day';
  /** Grace period before alerting */
  grace: number;
  /** Unit for the grace period (minute, hour, day) */
  grace_unit: 'minute' | 'hour' | 'day';
  /** Whether the monitor is currently active */
  activated: boolean;
  /** Whether this monitor is muted */
  muted?: boolean;
  /** Tags for organization */
  tags?: string[];
  /** Alert settings configuration */
  alert_settings?: AlertSettings;
  /** Whether to use global alert settings */
  use_global_alert_settings?: boolean;
}

/**
 * A category containing different types of checks
 * Each property is optional and contains an array of that check type's configuration
 */
export interface CheckCategory {
  browser_check?: BrowserCheckConfig[];
  api_check?: ApiCheckConfig[];
  multi_check?: MultiStepCheckConfig[];
  url_monitor?: UrlMonitorConfig[];
  tcp_monitor?: TcpMonitorConfig[];
  dns_monitor?: DnsMonitorConfig[];
  heartbeat_monitor?: HeartbeatMonitorConfig[];
}

/**
 * Configuration for a browser check
 * Uses Playwright to run end-to-end tests in a real browser
 */
export interface BrowserCheckConfig {
  /** Relative path to the Playwright test script */
  filePath: string;
  /** How often to run the check (in minutes) */
  frequency: number;
  /** Whether the check is currently active */
  activated: boolean;
  /** Short identifier used in resource naming */
  urlShort: string;
  /** Alert settings configuration */
  alert_settings?: AlertSettings;
  /** Whether to use global alert settings */
  use_global_alert_settings?: boolean;
  /** Retry strategy configuration */
  retry_strategy?: RetryStrategy;
  /** Environment variables */
  environment_variables?: EnvironmentVariable[];
  /** Degraded response time threshold in milliseconds (0-30000) */
  degraded_response_time?: number;
  /** Maximum response time threshold in milliseconds (0-30000) */
  max_response_time?: number;
  /** Runtime ID (e.g., "2023.09") */
  runtime_id?: string;
  /** Order of the check within the group */
  group_order?: number;
  /** Frequency offset in seconds (0, 10, 20, 30) when frequency=0 */
  frequency_offset?: number;
  /** Locations where this check runs (overrides group default) */
  locations?: string[];
  /** Whether this check is muted */
  muted?: boolean;
  /** Path to local setup script */
  local_setup_script?: string;
  /** Path to local teardown script */
  local_teardown_script?: string;
  /** ID of snippet to use for setup (references snippet from snippets array) */
  setup_snippet_id?: string;
  /** ID of snippet to use for teardown (references snippet from snippets array) */
  teardown_snippet_id?: string;
}

/**
 * Configuration for an API check
 * Tests HTTP endpoints with assertions on response
 */
export interface ApiCheckConfig {
  /** The API endpoint URL to test */
  url: string;
  /** HTTP method (GET, POST, PUT, DELETE, etc.) */
  method: string;
  /** How often to run the check (in minutes) */
  frequency: number;
  /** Whether the check is currently active */
  activated: boolean;
  /** Short identifier used in resource naming */
  urlShort: string;
  /** Array of assertion chains (e.g., [["statusCode().equals(200)"]]) */
  assertions: string[][];
  /** Optional path to setup script */
  setup?: string;
  /** Whether the check should expect a failure (default: false) */
  shouldFail?: boolean;
  /** Optional HTTP headers to include in the request */
  headers?: Array<{ [key: string]: string }>;
  /** Alert settings configuration */
  alert_settings?: AlertSettings;
  /** Whether to use global alert settings */
  use_global_alert_settings?: boolean;
  /** Retry strategy configuration */
  retry_strategy?: RetryStrategy;
  /** Environment variables */
  environment_variables?: EnvironmentVariable[];
  /** Degraded response time threshold in milliseconds (0-30000) */
  degraded_response_time?: number;
  /** Maximum response time threshold in milliseconds (0-30000) */
  max_response_time?: number;
  /** Runtime ID (e.g., "2023.09") */
  runtime_id?: string;
  /** Basic authentication credentials */
  basic_auth?: {
    /** Username (supports "var:variable_name" pattern) */
    username: string;
    /** Password (supports "var:variable_name" pattern) */
    password: string;
  };
  /** Request body content */
  body?: string;
  /** Request body type */
  body_type?: 'NONE' | 'JSON' | 'FORM' | 'RAW' | 'GRAPHQL';
  /** Query parameters to include in the request */
  query_parameters?: { [key: string]: string };
  /** IP family to use for the request */
  ip_family?: 'IPv4' | 'IPv6';
  /** Whether to follow HTTP redirects (default: true) */
  follow_redirects?: boolean;
  /** Whether to skip SSL certificate verification (default: true) */
  skip_ssl?: boolean;
  /** Domain to check SSL certificate for */
  ssl_check_domain?: string;
  /** Order of the check within the group */
  group_order?: number;
  /** Frequency offset in seconds (0, 10, 20, 30) when frequency=0 */
  frequency_offset?: number;
  /** Locations where this check runs (overrides group default) */
  locations?: string[];
  /** Whether this check is muted */
  muted?: boolean;
  /** Path to local setup script */
  local_setup_script?: string;
  /** Path to local teardown script */
  local_teardown_script?: string;
  /** ID of snippet to use for setup (references snippet from snippets array) */
  setup_snippet_id?: string;
  /** ID of snippet to use for teardown (references snippet from snippets array) */
  teardown_snippet_id?: string;
}

/**
 * Configuration for a multi-step check
 * Runs multiple API requests in sequence as a test scenario
 */
export interface MultiStepCheckConfig {
  /** Relative path to the multi-step test script */
  filePath: string;
  /** How often to run the check (in minutes) */
  frequency: number;
  /** Whether the check is currently active */
  activated: boolean;
  /** Short identifier used in resource naming */
  urlShort: string;
  /** Alert settings configuration */
  alert_settings?: AlertSettings;
  /** Whether to use global alert settings */
  use_global_alert_settings?: boolean;
  /** Retry strategy configuration */
  retry_strategy?: RetryStrategy;
  /** Environment variables */
  environment_variables?: EnvironmentVariable[];
  /** Degraded response time threshold in milliseconds (0-30000) */
  degraded_response_time?: number;
  /** Maximum response time threshold in milliseconds (0-30000) */
  max_response_time?: number;
  /** Runtime ID (e.g., "2023.09") */
  runtime_id?: string;
  /** Order of the check within the group */
  group_order?: number;
  /** Frequency offset in seconds (0, 10, 20, 30) when frequency=0 */
  frequency_offset?: number;
  /** Locations where this check runs (overrides group default) */
  locations?: string[];
  /** Whether this check is muted */
  muted?: boolean;
  /** Path to local setup script */
  local_setup_script?: string;
  /** Path to local teardown script */
  local_teardown_script?: string;
  /** ID of snippet to use for setup (references snippet from snippets array) */
  setup_snippet_id?: string;
  /** ID of snippet to use for teardown (references snippet from snippets array) */
  teardown_snippet_id?: string;
}
