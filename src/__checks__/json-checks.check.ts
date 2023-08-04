import fs from 'fs';
import path from 'path';
import {
  Dashboard,
  BrowserCheck,
  CheckGroup,
  ApiCheck,
  AssertionBuilder,
} from 'checkly/constructs'; // Import the necessary classes from your library
import { smsChannel, emailChannel } from '../alert-channels';
const alertChannels = [smsChannel, emailChannel];

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
    tags: [app.appName, 'trusted'],
    logo: 'https://www.vecteezy.com/png/9665395-green-money-banknote-cartoon-png-file',
    customUrl: `${app.appName}-dashboard`,
  });

  ['info', 'high', 'critical'].forEach((category) => {
    // Create a new check group for each category in the app
    const group = new CheckGroup(`${app.appName}-${category}-group`, {
      name: `${app.appName} ${category} Group`,
      activated: true,
      muted: false,
      runtimeId: '2023.02',
      frequency: 1,
      locations: ['us-east-1'],
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
        activated: check.activated,
        tags: ['API', app.appName, category],
        degradedResponseTime: 10000,
        maxResponseTime: 20000,
        setupScript: {
          entrypoint: path.join(__dirname, './utils/setup.ts'),
        },
        request: {
          url: check.url,
          method: check.method,
          followRedirects: true,
          skipSSL: false,
          assertions: [AssertionBuilder.statusCode().equals(200)],
        },
      });
    });
  });
});
