/**
 * Alert channel transformer - creates Terraform alert channel resources
 * Based on spec section 7.11 and CLI code at alert-channels.ts
 *
 * Creates 12 total alert channels:
 * - 4 email channels (tiers 1-4)
 * - 4 ServiceNow webhook channels (tiers 1-4)
 * - 4 MS Teams webhook channels (tiers 1-4)
 */

import { TerraformAlertChannel } from '../types/terraform.types';

/**
 * Create all alert channel resources
 *
 * @returns Array of 12 alert channel resources
 */
export function createAlertChannels(): TerraformAlertChannel[] {
  const channels: TerraformAlertChannel[] = [];

  // Create 4 email channels (tiers 1-4)
  for (let tier = 1; tier <= 4; tier++) {
    channels.push(createEmailChannel(tier));
  }

  // Create webhook channels (ServiceNow + MS Teams) for each tier
  for (let tier = 1; tier <= 4; tier++) {
    channels.push(createServiceNowWebhook(tier));
    channels.push(createMSTeamsWebhook(tier));
  }

  return channels;
}

/**
 * Create an email alert channel
 *
 * @param tier - Tier number (1-4)
 * @returns Email alert channel resource
 */
function createEmailChannel(tier: number): TerraformAlertChannel {
  return {
    resourceType: 'checkly_alert_channel',
    resourceId: `email_team_app_${tier}`,
    fileName: 'alert_channels.tf',
    attributes: {
      email: {
        address: `${tier}john.doe@gmail.com`
      },
      send_failure: true,
      send_recovery: true,
      send_degraded: false,
      ssl_expiry: true,
      ssl_expiry_threshold: 30
    }
  };
}

/**
 * Create a ServiceNow webhook alert channel
 *
 * @param tier - Tier number (1-4)
 * @returns ServiceNow webhook alert channel resource
 */
function createServiceNowWebhook(tier: number): TerraformAlertChannel {
  return {
    resourceType: 'checkly_alert_channel',
    resourceId: `webhook_servicenow_tier_${tier}`,
    fileName: 'alert_channels.tf',
    attributes: {
      webhook: {
        name: `ServiceNow Tier ${tier}`,
        method: 'POST',
        url: 'https://gmaildev.service-now.com/api/now/import/u_incident_staging',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': '{{ServiceNow_PWD}}'
        },
        template: `{
  "u_caller": "john.doe@gmail.com",
  "u_state": ${tier},
  "u_impact": ${tier},
  "u_urgency": ${tier},
  "u_assignment_group": "team-name",
  "u_assigned_to": "john.doe@gmail.com",
  "u_short_description": "{{ALERT_TITLE}}",
  "u_description": "{{ALERT_TYPE}} {{STARTED_AT}} ({{RESPONSE_TIME}}ms) {{REQUEST_URL}}",
  "u_work_notes": "Here are some work notes",
  "u_comments": "There are some comments"
}`
      },
      send_failure: true,
      send_recovery: true,
      send_degraded: false
    }
  };
}

/**
 * Create an MS Teams webhook alert channel
 *
 * @param tier - Tier number (1-4)
 * @returns MS Teams webhook alert channel resource
 */
function createMSTeamsWebhook(tier: number): TerraformAlertChannel {
  return {
    resourceType: 'checkly_alert_channel',
    resourceId: `webhook_msteams_tier_${tier}`,
    fileName: 'alert_channels.tf',
    attributes: {
      webhook: {
        name: `MSTeams Tier ${tier}`,
        method: 'POST',
        url: 'https://company.webhook.office.com/webhookb2/UUID/IncomingWebhook/STRING/UUID',
        template: `{
  "@type": "MessageCard",
  "@context": "http://schema.org/extensions",
  "summary": "{{ALERT_TITLE}}",
  "title": "{{ALERT_TITLE}}",
  {{#eq ALERT_TYPE "ALERT_SSL" }}
  {{else}}
  "sections": [{
    "facts": [{
      "name": "Response time",
      "value": "{{RESPONSE_TIME}}ms"
    }, {
      "name": "Location",
      "value": "{{RUN_LOCATION}}"
    }, {
      "name": "Timestamp",
      "value": "{{STARTED_AT}}"
    },
    {{#if GROUP_NAME}}
    {
      "name": "Group",
      "value": "{{GROUP_NAME}}"
    },
    {{/if}}
    {
      "name": "Tags",
      "value": "{{#each TAGS}} {{this}} {{#unless @last}},{{/unless}} {{/each}}"
    }],
    "markdown": true
  }],
  {{/eq}}
  "potentialAction": [{
    "@type": "OpenUri",
    "name": "View in Checkly",
    "targets": [{ "os": "default", "uri": "{{RESULT_LINK}}" }]
  }]
}`
      },
      send_failure: true,
      send_recovery: true,
      send_degraded: true,
      ssl_expiry: true
    }
  };
}
