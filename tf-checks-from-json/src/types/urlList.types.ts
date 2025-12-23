/**
 * Type definitions for urlList.json input schema
 * Based on spec section 7.1
 */

/**
 * Root type: Array of applications
 */
export type UrlListJson = AppConfig[];

/**
 * Application configuration with tiers
 */
export interface AppConfig {
  appName: string;              // Application name (e.g., "Env-Observability")
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
  browser_check?: BrowserCheckConfig[];
  api_check?: ApiCheckConfig[];
  multi_check?: MultiStepCheckConfig[];
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
}

/**
 * Multi-Step Check configuration
 */
export interface MultiStepCheckConfig {
  filePath: string;             // Path to Playwright script (relative to src/)
  frequency: number;            // Check frequency in minutes
  activated: boolean;           // Enable/disable check
  urlShort: string;             // Short identifier for check
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
