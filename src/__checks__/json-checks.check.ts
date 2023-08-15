import fs from 'fs';
import path from 'path';
import {
  Dashboard,
  CheckGroup,
  ApiCheck,
  AssertionBuilder,
} from 'checkly/constructs'; // Import the necessary classes from Checkly
import { emailChannel, msTeamsWebhookChannel } from '../alert-channels'; // Import alert channels
const alertChannels = [emailChannel, msTeamsWebhookChannel];

// Read the JSON data from the file
const data = fs.readFileSync(
  path.join(__dirname, '../urlList/sherwinExternalURLs.json'),
  'utf-8'
);
const apps = JSON.parse(data);

apps.forEach((app: any, index: number) => {
  // Create a new dashboard for each app
  const dashboard = new Dashboard(`${app.appName}-dashboard-${index + 1}`, {
    header: `${app.appName} Dashboard`,
    description: 'Dashboard associated with a basic demo',
    tags: [app.appName],
    logo: 'https://www.vecteezy.com/png/9665395-green-money-banknote-cartoon-png-file',
    customUrl: `${app.appName.toLowerCase()}-dashboard`,
  });

  ['info', 'high', 'critical'].forEach((category) => {
    // Create a new check group for each category in the app
    console.log(`${app.appName}, ${category}, ${app[category].length}`);

    if (app[category].length >= 1) {
      // we're using the app's appName & category to create unique identifiers for our groups
      const group = new CheckGroup(`${app.appName}-${category}-group`, {
        name: `${app.appName} ${category} Group`,
        activated: true,
        muted: false,
        runtimeId: '2023.02',
        frequency: 1,
        // we round robin run through these locations, so we're not running on them concurrently by default
        locations: ['us-east-1', 'us-west-2'],
        // the tags we pass a group will dictate how they appear in dashboards
        tags: [app.appName, category],
        environmentVariables: [],
        apiCheckDefaults: {},
        concurrency: 100,
        alertChannels, // This variable needs to be defined somewhere
      });

      app[category].forEach((check: any, checkIndex: number) => {
        // Create a new API check for each check in the category
        new ApiCheck(`${app.appName}-${category}-api-check-${checkIndex + 1}`, {
          name: `API - ${app.appName} ${category} ${check.urlShort} `,
          group: group,
          // checks have an activated true or false value
          activated: check.activated,
          // apps have an app.appName attribute and have URL categories, we're passing these as tags for searchability
          tags: ['API', app.appName, category],
          degradedResponseTime: 10000,
          maxResponseTime: 20000,
          setupScript: {
            entrypoint: path.join(__dirname, './utils/setup.ts'),
          },
          request: {
            // checks have url attributes - this is what our individual checks are targetting
            url: check.url,
            // checks can have multiple types of methods, right now our logic only works with basic 'GET' requests, but we could add additional logic and handling for other methods
            method: check.method,
            followRedirects: true,
            skipSSL: false,
            assertions: [AssertionBuilder.statusCode().equals(200)],
          },
        });
      });
    }
  });
});
