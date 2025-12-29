/**
 * Type definitions for urlList.json input schema
 * Based on spec section 7.1
 */

/**
 * Root type: Array of applications
 */
export type UrlListJson = AppConfig[];

/**
 * Global configuration for application-wide defaults
 */
export interface GlobalConfig {
  defaultLocations?: string[];   // Default locations for all checks
  defaultFrequency?: number;      // Default frequency in minutes
}

/**
 * Application configuration with tiers
 */
export interface AppConfig {
  appName: string;              // Application name (e.g., "Env-Observability")
  globalConfig?: GlobalConfig;  // Global defaults for locations and frequency
  app1: TierConfig[];           // Critical tier (highest priority)
  app2: TierConfig[];           // High tier
  app3: TierConfig[];           // Medium tier
  app4: TierConfig[];           // Info tier (lowest priority)
  alertChannels?: WebhookAlertChannelConfig[]; // Optional webhook alert channels
}

/**
 * Tier configuration containing check types
 */
export interface TierConfig {
  locations?: string[];                    // Tier-level locations for check group
  browser_check?: BrowserCheckConfig[];
  api_check?: ApiCheckConfig[];
  multi_check?: MultiStepCheckConfig[];
  uptime_check?: UptimeCheckConfig[];     // Uptime monitors
}

/**
 * API Check configuration
 */
export interface ApiCheckConfig {
  // Required fields
  url: string;                  // API endpoint URL
  method: string;               // HTTP method: GET, POST, PUT, DELETE, etc.
  frequency: number;            // Check frequency in minutes
  activated: boolean;           // Enable/disable check
  urlShort: string;             // Short identifier for check
  assertions: string[][];       // Array of assertion code strings

  // Optional fields
  locations?: string[];         // Per-check location override
  setup?: string;               // Path to setup script (relative to src/)
  headers?: Array<{            // HTTP headers
    [key: string]: string;     // e.g., {"X-API-Key": "value"}
  }>;
  shouldFail?: boolean;         // Expect check to fail (default: false)
}

/**
 * Browser Check configuration
 */
export interface BrowserCheckConfig {
  filePath: string;             // Path to Playwright script (relative to src/)
  frequency: number;            // Check frequency in minutes
  activated: boolean;           // Enable/disable check
  urlShort: string;             // Short identifier for check
  locations?: string[];         // Per-check location override
}

/**
 * Multi-Step Check configuration
 */
export interface MultiStepCheckConfig {
  filePath: string;             // Path to Playwright script (relative to src/)
  frequency: number;            // Check frequency in minutes
  activated: boolean;           // Enable/disable check
  urlShort: string;             // Short identifier for check
  locations?: string[];         // Per-check location override
}

/**
 * Uptime Monitor configuration
 * Maps to checkly_url_monitor Terraform resource
 */
export interface UptimeCheckConfig {
  // Required fields
  url: string;                      // HTTP/HTTPS endpoint to monitor
  frequency: number;                // Check frequency in minutes
  activated: boolean;               // Enable/disable monitor
  urlShort: string;                 // Short identifier for monitor

  // Optional fields
  locations?: string[];             // Per-check location override
  method?: string;                  // HTTP method - NOTE: Not used in Terraform output (checkly_url_monitor doesn't support method)
  followRedirects?: boolean;        // Follow redirects (default: true)
  skipSsl?: boolean;                // Skip SSL verification (default: false)
  shouldFail?: boolean;             // Expect monitor to fail (default: false)
  assertions?: string[][];          // Limited to statusCode only
  degradedResponseTime?: number;    // Degraded threshold in ms
  maxResponseTime?: number;         // Max response time in ms
}

/**
 * Webhook Alert Channel configuration
 */
export interface WebhookAlertChannelConfig {
  type: 'webhook';              // Alert channel type (always 'webhook')
  name: string;                 // Alert channel name
  url?: string;                 // Webhook URL (optional)
  method?: string;              // HTTP method (default: POST)
  headers?: Array<{             // HTTP headers
    [key: string]: string;      // e.g., {"Authorization": "Bearer token"}
  }>;
  template?: string;            // Custom webhook payload template (optional)
}
