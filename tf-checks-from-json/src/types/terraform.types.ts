/**
 * Type definitions for Terraform resources
 * Based on spec section 7.2
 */

/**
 * Base Terraform resource type
 */
export interface TerraformResource {
  resourceType: string;        // e.g., "checkly_check"
  resourceId: string;          // e.g., "api_books_env_obs_app1"
  attributes: any;             // Resource-specific attributes
  hcl?: string;                // Generated HCL (added later)
  fileName: string;            // e.g., "checks_api.tf"
}

/**
 * Terraform Check resource (API, BROWSER, or MULTI_STEP)
 */
export interface TerraformCheck extends TerraformResource {
  resourceType: 'checkly_check';
  attributes: {
    name: string;
    type: 'API' | 'BROWSER' | 'MULTI_STEP';
    activated: boolean;
    frequency: number;
    locations?: string[];
    group_id: string;          // Reference to check group
    group_order?: number;
    tags?: string[];
    degraded_response_time?: number;
    max_response_time?: number;
    should_fail?: boolean;
    runtime_id?: string;
    request?: TerraformRequest;
    script?: string;
    local_setup_script?: string;
  };
}

/**
 * Terraform Request block for API checks
 */
export interface TerraformRequest {
  url: string;
  method: string;
  follow_redirects?: boolean;
  skip_ssl?: boolean;
  headers?: { [key: string]: string };
  assertion?: TerraformAssertion[];
}

/**
 * Terraform Assertion block
 */
export interface TerraformAssertion {
  source: 'STATUS_CODE' | 'JSON_BODY' | 'HEADERS' | 'TEXT_BODY' | 'RESPONSE_TIME';
  property?: string;
  comparison: string;
  target: string;
}

/**
 * Terraform CheckGroup resource
 */
export interface TerraformCheckGroup extends TerraformResource {
  resourceType: 'checkly_check_group';
  attributes: {
    name: string;
    activated: boolean;
    muted: boolean;
    concurrency: number;
    locations?: string[];
    tags?: string[];
    runtime_id?: string;
    alert_channel_subscription?: Array<{
      channel_id: string;
      activated: boolean;
    }>;
  };
}

/**
 * Terraform Dashboard resource
 */
export interface TerraformDashboard extends TerraformResource {
  resourceType: 'checkly_dashboard';
  attributes: {
    custom_url: string;
    header: string;
    description?: string;
    tags?: string[];
    use_tags_and_operator?: boolean;
    logo?: string;
  };
}

/**
 * Terraform AlertChannel resource
 */
export interface TerraformAlertChannel extends TerraformResource {
  resourceType: 'checkly_alert_channel';
  attributes: {
    email?: {
      address: string;
    };
    webhook?: {
      name: string;
      method: string;
      url: string;
      headers?: { [key: string]: string };
      template?: string;
    };
    send_failure?: boolean;
    send_recovery?: boolean;
    send_degraded?: boolean;
    ssl_expiry?: boolean;
    ssl_expiry_threshold?: number;
  };
}
