/**
 * Type definitions for the JSON input structure (urlList.json)
 * These interfaces define the shape of the input data that drives check generation
 */

/**
 * Tier names used to organize checks by priority
 * app1 = highest priority, app4 = lowest priority
 */
export type TierName = 'app1' | 'app2' | 'app3' | 'app4';

/**
 * Root configuration for an environment/application
 * Contains the app name and checks organized by tier
 */
export interface UrlListConfig {
  appName: string;
  app1: CheckCategory[];
  app2: CheckCategory[];
  app3: CheckCategory[];
  app4: CheckCategory[];
}

/**
 * A category containing different types of checks
 * Each property is optional and contains an array of that check type's configuration
 */
export interface CheckCategory {
  browser_check?: BrowserCheckConfig[];
  api_check?: ApiCheckConfig[];
  multi_check?: MultiStepCheckConfig[];
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
}
