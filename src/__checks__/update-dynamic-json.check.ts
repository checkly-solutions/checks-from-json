//@ts-nocheck
import fs from 'fs';
import path from 'path';
import {
  Dashboard,
  CheckGroup,
  BrowserCheck,
  ApiCheck,
  AssertionBuilder,
} from 'checkly/constructs'; // Import the necessary classes from Checkly
import { emailChannel, msTeamsWebhookChannel } from '../alert-channels'; // Import alert channels

const alertChannels = [emailChannel, msTeamsWebhookChannel];

// Read the JSON data from the file
const data = fs.readFileSync(
  path.join(__dirname, '../urlList/urlList.json'),
  'utf-8'
);

const apps = JSON.parse(data);

apps.forEach((app: any, index: number) => {
  console.log(app.appName);
  // Create a new dashboard for each app
  new Dashboard(`${app.appName.toLowerCase()}-dashboard-${index + 1}`, {
    header: `${app.appName} CLI Dashboard`,
    description: 'Dashboard associated with a basic demo',
    tags: [app.appName, 'cli'],
    useTagsAndOperator: false,
    logo: 'https://mma.prnewswire.com/media/875497/Maritz_logo.jpg?p=facebook',
    customUrl: `${app.appName.toLowerCase()}-dashboard-${index + 1}`,
  });

  const group = new CheckGroup(`${app.appName}-group-${index + 200}`, {
    name: `${app.appName} Group`,
    activated: true,
    muted: false,
    runtimeId: '2023.02',
    frequency: 1,
    locations: ['us-east-1', 'us-west-2'],
    tags: [app.appName, 'cli'],
    environmentVariables: [],
    apiCheckDefaults: {},
    concurrency: 100,
    alertChannels,
  });

  ['browser_checks', 'api_checks'].forEach((category) => {
    if (
      app[category] &&
      app[category].length >= 1 &&
      category === 'browser_checks'
    ) {
      app[category].forEach((check) => {
        const filePath = check.filePath.length > 0 ? check.filePath : undefined;

        new BrowserCheck(`${check.urlShort}-${app.appName}-browser`, {
          name: `${check.urlShort} ${app.appName} ${category}`,
          frequency: check.frequency,
          group,
          tags: ['browser', app.appName],
          code: {
            entrypoint: path.join(`../${filePath}`),
          },
        });
      });
    } else if (
      app[category] &&
      app[category].length >= 1 &&
      category === 'api_checks'
    ) {
      app[category].forEach((check) => {
        const setupScript =
          check.setup.length > 0
            ? { entrypoint: path.join(__dirname, check.setup) }
            : undefined;

        const assertions = check.assertions.map(([assertionCode]) => {
          let assertion = AssertionBuilder;
          assertionCode.split('.').forEach((part) => {
            const [methodName, args] = part
              .match(/(\w+)\((.*)\)/)
              ?.slice(1) ?? [part, ''];
            assertion = assertion[methodName]?.(args) ?? assertion;
          });
          return assertion;
        });

        const headers = check.headers
          ? check.headers.map((header) => {
              const key = Object.keys(header)[0];
              return { key: key, value: header[key] };
            })
          : undefined;

        new ApiCheck(`${app.appName}-${check.urlShort}-check-cli`, {
          name: `${check.urlShort} ${category} ${app.appName}`,
          group: group,
          activated: check.activated,
          frequency: check.frequency,
          tags: ['API', app.appName, category],
          degradedResponseTime: 10000,
          maxResponseTime: 20000,
          request: {
            url: check.url,
            method: check.method,
            followRedirects: true,
            skipSSL: false,
            ...(setupScript && { setupScript }),
            ...(headers && { headers }),
            assertions: assertions,
          },
        });
      });
    }
  });
});
