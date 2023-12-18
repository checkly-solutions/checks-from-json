// updated alert channels for msTeams and ServiceNow to be functions that create tiered channels based on inputs.
// you'll also see multiple email channels,
// you will need to create an email for each alert tier you want them available.

// Add your primary name for this repo and team name here
const assignedTeamName = 'jonathan example';
const applicationName = 'smile smile';
// currently using placeholders related to the Observability Team alerting, feel free to update to team specific
const msTeamsAlertUrl =
  'https://swcompany.webhook.office.com/webhookb2/094e8920-b8d3-49ee-a7d4-8576b636ecbb@44b79a67-d972-49ba-9167-8eb05f754a1a/IncomingWebhook/620a617c2e964c7e98fac9d47c8f89ff/71493bd4-0176-499c-bc34-1064b9e3e72e';
const serviceNowAlertUrl =
  'https://sherwindev.service-now.com/api/now/import/u_incident_staging';

// This sanitizes the entries above, so that they can be added in the naming conventions below
const formattedAppName = applicationName.split(' ').join('-').toLowerCase();
const formattedTeamName = assignedTeamName.split(' ').join('-').toLowerCase();

import { URL } from 'node:url';
import { EmailAlertChannel, WebhookAlertChannel } from 'checkly/constructs';

const sendDefaults = {
  sendFailure: true,
  sendRecovery: true,
  sendDegraded: false,
  sslExpiry: true,
  sslExpiryThreshold: 30,
};

// *************
// SERVICE NOW CREATION
// *************
export function createServiceNowChannel(tier: string): WebhookAlertChannel {
  return new WebhookAlertChannel(
    `webhook-${formattedTeamName}-${formattedAppName}-${tier}`,
    {
      name: `ServiceNow ${formattedTeamName} ${formattedAppName} Tier ${tier}`,
      method: 'POST',
      url: new URL(`${serviceNowAlertUrl}`),
      headers: [
        { key: 'Accept', value: 'application/json' },
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: '{{ServiceNow_PWD}}' },
      ],
      sendRecovery: true,
      sendFailure: true,
      sendDegraded: false,
      sslExpiry: false,
      template: `{
                "u_caller": "venkata.s.matta@sherwin.com",
                "u_state": ${tier},
                "u_impact": ${tier},
                "u_urgency": ${tier},
                "u_assignment_group": "edps-application-performance-mgmt",
                "u_assigned_to": "venkata.s.matta@sherwin.com",
                "u_short_description": "{{ALERT_TITLE}}",
                "u_description": "{{ALERT_TYPE}} {{STARTED_AT}} ({{RESPONSE_TIME}}ms) {{REQUEST_URL}}",
                "u_work_notes": "Here are some work notes",
                "u_comments": "There are some comments"
              }`,
    }
  );
}

// ****************
// MS TEAMS WEBHOOK
// ****************
export function createMSTeamsWebhookChannel(tier: string): WebhookAlertChannel {
  return new WebhookAlertChannel(
    `teamsChannel-${formattedTeamName}-${formattedAppName}-${tier}`,
    {
      name: `MSTeams ${formattedTeamName} ${formattedAppName} ${tier}`,
      method: 'POST',
      url: new URL(`${msTeamsAlertUrl}`),
      sendRecovery: true,
      sendFailure: true,
      sendDegraded: true,
      sslExpiry: true,
      template: `{
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "summary": "{{ALERT_TITLE}}",
      "title": "{{ALERT_TITLE}}",
      {{! Embeds for the SSL expiry notifications}}
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
      "potentialAction": [
        {
          "@type": "OpenUri",
          "name": "View in Checkly",
          "targets": [
            { "os": "default", "uri": "{{RESULT_LINK}}" }
          ]
        }
      ]
    }`,
    }
  );
}

// ********************
// EMAIL ALERT CHANNELS
// ********************

//  EMAIL TIER 1
export const emailChannelTier1 = new EmailAlertChannel(
  `email-${formattedTeamName}-${formattedAppName}-1`,
  {
    address: '1venkata.s.matta@sherwin.com',
    ...sendDefaults,
  }
);

// EMAIL TIER 2
export const emailChannelTier2 = new EmailAlertChannel(
  `email-${formattedTeamName}-${formattedAppName}-2`,
  {
    address: '2venkata.s.matta@sherwin.com',
    ...sendDefaults,
  }
);

// EMAIL TIER 3
export const emailChannelTier3 = new EmailAlertChannel(
  `email-${formattedTeamName}-${formattedAppName}-3`,
  {
    address: '3venkata.s.matta@sherwin.com',
    ...sendDefaults,
  }
);

// EMAIL TIER 4
export const emailChannelTier4 = new EmailAlertChannel(
  `email-${formattedTeamName}-${formattedAppName}-4`,
  {
    address: '4venkata.s.matta@sherwin.com',
    ...sendDefaults,
  }
);
