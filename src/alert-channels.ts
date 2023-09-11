import { EmailAlertChannel, WebhookAlertChannel } from 'checkly/constructs';

const sendDefaults = {
  sendFailure: true,
  sendRecovery: true,
  sendDegraded: false,
  sslExpiry: true,
  sslExpiryThreshold: 30,
};

export const emailChannel = new EmailAlertChannel('email-181540', {
  address: 'jonathan.doe@checklyhq.com',
  ...sendDefaults,
});

/**
 * This is a Checkly CLI AlertChannel construct. To learn more, visit:
 * - https://www.checklyhq.com/docs/cli/
 * - https://www.checklyhq.com/docs/cli/constructs-reference/#alertchannel
 */

export const googleWebHook = new WebhookAlertChannel('webhook-google', {
  name: 'google test webhook',
  method: 'POST',
  url: new URL(
    'https://chat.googleapis.com/v1/spaces/AAAAxDZF9mY/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=ucINJSzNhyy9duSVmEiaXHCSG5GyJYhKC3yfUNXKy00'
  ),
  template: `{ "text": "{{CHECK_NAME}} Failure
{{RESULT_LINK}}
" }`,
  ...sendDefaults,
});

// export const msTeamsWebhookChannel = new WebhookAlertChannel('webhook-181573', {
//   name: 'MSTeams Integration',
//   method: 'POST',
//   url: new URL(
//     'https://swcompany.webhook.office.com/webhookb2/094e8920-b8d3-49ee-a7d4-8576b636ecbb@44b79a67-d972-49ba-9167-8eb05f754a1a/IncomingWebhook/620a617c2e964c7e98fac9d47c8f89ff/71493bd4-0176-499c-bc34-1064b9e3e72e'
//   ),
//   sendRecovery: true,
//   sendFailure: true,
//   sendDegraded: true,
//   sslExpiry: true,
//   template: `{
//   "@type": "MessageCard",
//   "@context": "http://schema.org/extensions",
//   "summary": "{{ALERT_TITLE}}",
//   "title": "{{ALERT_TITLE}}",
//   {{! Embeds for the SSL expiry notifications}}
//   {{#eq ALERT_TYPE "ALERT_SSL" }}
//   {{else}}
//   "sections": [{
//     "facts": [{
//       "name": "Response time",
//       "value": "{{RESPONSE_TIME}}ms"
//     }, {
//       "name": "Location",
//       "value": "{{RUN_LOCATION}}"
//     }, {
//       "name": "Timestamp",
//       "value": "{{STARTED_AT}}"
//     },
//     {{#if GROUP_NAME}}
//     {
//       "name": "Group",
//       "value": "{{GROUP_NAME}}"
//     },
//     {{/if}}
//     {
//       "name": "Tags",
//       "value": "{{#each TAGS}} {{this}} {{#unless @last}},{{/unless}} {{/each}}"
//     }],
//     "markdown": true
//   }],
//   {{/eq}}
//   "potentialAction": [
//     {
//       "@type": "OpenUri",
//       "name": "View in Checkly",
//       "targets": [
//         { "os": "default", "uri": "{{RESULT_LINK}}" }
//       ]
//     }
//   ]
// }
// `,
// });
