/**
 * Validation utilities for alert channel definitions
 * Ensures alert channels are properly configured before generation
 */

import {
  AlertChannelDefinition,
  EmailChannelConfig,
  SmsChannelConfig,
  SlackChannelConfig,
  PagerdutyChannelConfig,
  OpsgenieChannelConfig,
  WebhookChannelConfig,
  CallChannelConfig,
  UrlListConfig,
  AlertSettings,
  RetryStrategy,
  EnvironmentVariable,
} from '../types/json-types';

/**
 * Validate all alert channel definitions and their references
 * Throws errors for invalid configurations
 *
 * @param channels - Array of alert channel definitions to validate
 * @param apps - Array of app configurations to validate tier references
 * @throws Error if validation fails
 */
export function validateAlertChannels(
  channels: AlertChannelDefinition[],
  apps: UrlListConfig[]
): void {
  // Check for duplicate IDs
  const ids = new Set<string>();
  channels.forEach((channel) => {
    if (ids.has(channel.id)) {
      throw new Error(`Duplicate alert channel ID: "${channel.id}"`);
    }
    ids.add(channel.id);
  });

  // Validate each channel
  channels.forEach((channel) => {
    validateAlertChannel(channel);
  });

  // Validate tier references point to defined channels
  apps.forEach((app) => {
    Object.entries(app.tiers).forEach(([tierName, tierDef]) => {
      if (!ids.has(tierDef.alertChannel)) {
        throw new Error(
          `Tier "${tierName}" in app "${app.appName}" references undefined alert channel: "${tierDef.alertChannel}"`
        );
      }
    });
  });
}

/**
 * Validate a single alert channel definition
 * Checks type-specific requirements and common settings
 *
 * @param channel - Alert channel definition to validate
 * @throws Error if validation fails
 */
function validateAlertChannel(channel: AlertChannelDefinition): void {
  // Validate SSL settings (email only)
  if (channel.type !== 'email' && (channel.ssl_expiry || channel.ssl_expiry_threshold)) {
    console.warn(
      `⚠️  Alert channel "${channel.id}": ssl_expiry settings are only supported for email channels (ignored)`
    );
  }

  // Validate SSL threshold range
  if (channel.ssl_expiry_threshold !== undefined) {
    if (channel.ssl_expiry_threshold < 1 || channel.ssl_expiry_threshold > 30) {
      throw new Error(
        `Alert channel "${channel.id}": ssl_expiry_threshold must be between 1 and 30, got ${channel.ssl_expiry_threshold}`
      );
    }
  }

  // Type-specific validation
  switch (channel.type) {
    case 'email':
      validateEmailConfig(channel);
      break;
    case 'sms':
      validateSmsConfig(channel);
      break;
    case 'slack':
      validateSlackConfig(channel);
      break;
    case 'pagerduty':
      validatePagerdutyConfig(channel);
      break;
    case 'opsgenie':
      validateOpsgenieConfig(channel);
      break;
    case 'webhook':
      validateWebhookConfig(channel);
      break;
    case 'call':
      validateCallConfig(channel);
      break;
    default:
      throw new Error(
        `Alert channel "${channel.id}": unsupported type "${(channel as any).type}". ` +
          `Supported types: email, sms, slack, pagerduty, opsgenie, webhook, call`
      );
  }
}

/**
 * Validate email channel configuration
 */
function validateEmailConfig(channel: AlertChannelDefinition): void {
  const config = channel.config as EmailChannelConfig;
  if (!config.address) {
    throw new Error(
      `Alert channel "${channel.id}": email config missing required field "address"`
    );
  }
}

/**
 * Validate SMS channel configuration
 */
function validateSmsConfig(channel: AlertChannelDefinition): void {
  const config = channel.config as SmsChannelConfig;
  if (!config.name) {
    throw new Error(
      `Alert channel "${channel.id}": sms config missing required field "name"`
    );
  }
  if (!config.number) {
    throw new Error(
      `Alert channel "${channel.id}": sms config missing required field "number"`
    );
  }
}

/**
 * Validate Slack channel configuration
 */
function validateSlackConfig(channel: AlertChannelDefinition): void {
  const config = channel.config as SlackChannelConfig;
  if (!config.channel) {
    throw new Error(
      `Alert channel "${channel.id}": slack config missing required field "channel"`
    );
  }
  if (!config.url) {
    throw new Error(
      `Alert channel "${channel.id}": slack config missing required field "url"`
    );
  }
}

/**
 * Validate PagerDuty channel configuration
 */
function validatePagerdutyConfig(channel: AlertChannelDefinition): void {
  const config = channel.config as PagerdutyChannelConfig;
  if (!config.service_key) {
    throw new Error(
      `Alert channel "${channel.id}": pagerduty config missing required field "service_key"`
    );
  }
}

/**
 * Validate Opsgenie channel configuration
 */
function validateOpsgenieConfig(channel: AlertChannelDefinition): void {
  const config = channel.config as OpsgenieChannelConfig;
  if (!config.name) {
    throw new Error(
      `Alert channel "${channel.id}": opsgenie config missing required field "name"`
    );
  }
  if (!config.api_key) {
    throw new Error(
      `Alert channel "${channel.id}": opsgenie config missing required field "api_key"`
    );
  }
  if (!config.region) {
    throw new Error(
      `Alert channel "${channel.id}": opsgenie config missing required field "region"`
    );
  }
  if (!config.priority) {
    throw new Error(
      `Alert channel "${channel.id}": opsgenie config missing required field "priority"`
    );
  }
}

/**
 * Validate webhook channel configuration
 */
function validateWebhookConfig(channel: AlertChannelDefinition): void {
  const config = channel.config as WebhookChannelConfig;
  if (!config.name) {
    throw new Error(
      `Alert channel "${channel.id}": webhook config missing required field "name"`
    );
  }
  if (!config.url) {
    throw new Error(
      `Alert channel "${channel.id}": webhook config missing required field "url"`
    );
  }
}

/**
 * Validate phone call channel configuration
 */
function validateCallConfig(channel: AlertChannelDefinition): void {
  const config = channel.config as CallChannelConfig;
  if (!config.name) {
    throw new Error(
      `Alert channel "${channel.id}": call config missing required field "name"`
    );
  }
  if (!config.number) {
    throw new Error(
      `Alert channel "${channel.id}": call config missing required field "number"`
    );
  }
}

/**
 * Validate alert settings configuration
 * Checks escalation types and threshold ranges
 *
 * @param settings - Alert settings to validate
 * @param context - Context string for error messages (e.g., "check", "group")
 * @throws Error if validation fails
 */
export function validateAlertSettings(settings: AlertSettings, context: string): void {
  // Validate escalation type
  const validEscalationTypes = ['RUN_BASED', 'TIME_BASED'];
  if (settings.escalation_type && !validEscalationTypes.includes(settings.escalation_type)) {
    throw new Error(
      `${context}: invalid escalation_type "${settings.escalation_type}". Must be RUN_BASED or TIME_BASED`
    );
  }

  // Validate run-based escalation
  if (settings.run_based_escalation) {
    const threshold = settings.run_based_escalation.failed_run_threshold;
    if (![1, 2, 3, 4, 5].includes(threshold)) {
      throw new Error(
        `${context}: run_based_escalation.failed_run_threshold must be 1-5, got ${threshold}`
      );
    }
  }

  // Validate time-based escalation
  if (settings.time_based_escalation) {
    const threshold = settings.time_based_escalation.minutes_failing_threshold;
    if (![5, 10, 15, 30].includes(threshold)) {
      throw new Error(
        `${context}: time_based_escalation.minutes_failing_threshold must be 5, 10, 15, or 30, got ${threshold}`
      );
    }
  }

  // Validate reminders
  if (settings.reminders) {
    const { amount, interval } = settings.reminders;
    if (amount < 0 || (amount > 5 && amount !== 100000)) {
      throw new Error(
        `${context}: reminders.amount must be 0-5 or 100000 (unlimited), got ${amount}`
      );
    }
    if (![5, 10, 15, 30].includes(interval)) {
      throw new Error(
        `${context}: reminders.interval must be 5, 10, 15, or 30, got ${interval}`
      );
    }
  }

  // Validate parallel run failure threshold
  if (settings.parallel_run_failure_threshold) {
    const { enabled, percentage } = settings.parallel_run_failure_threshold;
    if (enabled && ![10, 20, 30, 40, 50, 60, 70, 80, 90, 100].includes(percentage)) {
      throw new Error(
        `${context}: parallel_run_failure_threshold.percentage must be 10-100 in increments of 10, got ${percentage}`
      );
    }
  }
}

/**
 * Validate retry strategy configuration
 * Checks retry types and max values
 *
 * @param strategy - Retry strategy to validate
 * @param context - Context string for error messages
 * @throws Error if validation fails
 */
export function validateRetryStrategy(strategy: RetryStrategy, context: string): void {
  // Validate retry type
  const validTypes = ['FIXED', 'LINEAR', 'EXPONENTIAL', 'SINGLE_RETRY', 'NO_RETRIES'];
  if (!validTypes.includes(strategy.type)) {
    throw new Error(
      `${context}: invalid retry strategy type "${strategy.type}". Must be one of: ${validTypes.join(', ')}`
    );
  }

  // Validate max_duration_seconds
  if (strategy.max_duration_seconds !== undefined) {
    if (strategy.max_duration_seconds < 0 || strategy.max_duration_seconds > 600) {
      throw new Error(
        `${context}: retry_strategy.max_duration_seconds must be 0-600, got ${strategy.max_duration_seconds}`
      );
    }
  }

  // Validate max_retries
  if (strategy.max_retries !== undefined) {
    if (strategy.max_retries < 1 || strategy.max_retries > 10) {
      throw new Error(
        `${context}: retry_strategy.max_retries must be 1-10, got ${strategy.max_retries}`
      );
    }
  }

  // Validate base_backoff_seconds
  if (strategy.base_backoff_seconds !== undefined && strategy.base_backoff_seconds < 0) {
    throw new Error(
      `${context}: retry_strategy.base_backoff_seconds must be >= 0, got ${strategy.base_backoff_seconds}`
    );
  }
}

/**
 * Validate response time thresholds
 * Different ranges for different check types
 *
 * @param degraded - Degraded response time in milliseconds
 * @param max - Maximum response time in milliseconds
 * @param maxAllowed - Maximum allowed value (30000 for HTTP, 5000 for TCP/DNS)
 * @param context - Context string for error messages
 * @throws Error if validation fails
 */
export function validateResponseTimes(
  degraded: number | undefined,
  max: number | undefined,
  maxAllowed: number,
  context: string
): void {
  if (degraded !== undefined) {
    if (degraded < 0 || degraded > maxAllowed) {
      throw new Error(
        `${context}: degraded_response_time must be 0-${maxAllowed}, got ${degraded}`
      );
    }
  }

  if (max !== undefined) {
    if (max < 0 || max > maxAllowed) {
      throw new Error(
        `${context}: max_response_time must be 0-${maxAllowed}, got ${max}`
      );
    }
  }

  if (degraded !== undefined && max !== undefined && degraded >= max) {
    throw new Error(
      `${context}: degraded_response_time (${degraded}) must be less than max_response_time (${max})`
    );
  }
}

/**
 * Validate frequency value
 * Checks against allowed minute intervals
 *
 * @param frequency - Frequency in minutes
 * @param context - Context string for error messages
 * @throws Error if validation fails
 */
export function validateFrequency(frequency: number, context: string): void {
  const validFrequencies = [0, 1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440];
  if (!validFrequencies.includes(frequency)) {
    throw new Error(
      `${context}: frequency must be one of ${validFrequencies.join(', ')}, got ${frequency}`
    );
  }
}

/**
 * Validate environment variables
 * Checks key format and value presence
 *
 * @param envVars - Array of environment variables to validate
 * @param context - Context string for error messages
 * @throws Error if validation fails
 */
export function validateEnvironmentVariables(
  envVars: EnvironmentVariable[],
  context: string
): void {
  envVars.forEach((envVar, index) => {
    // Check key format (alphanumeric, underscores, must start with letter or underscore)
    if (!envVar.key.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
      throw new Error(
        `${context}: environment variable #${index + 1} has invalid key "${envVar.key}". ` +
          `Keys must start with a letter or underscore and contain only alphanumeric characters and underscores.`
      );
    }

    // Check value is present
    if (!envVar.value || envVar.value.trim() === '') {
      throw new Error(
        `${context}: environment variable "${envVar.key}" has empty value`
      );
    }
  });
}
