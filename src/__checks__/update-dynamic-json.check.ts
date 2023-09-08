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

import { createDashboard } from '../createDashboard';
import { createGroup } from '../createGroup';
import { emailChannel, msTeamsWebhookChannel } from '../alert-channels'; // Import alert channels
const alertChannels = [emailChannel, msTeamsWebhookChannel];

// Read the JSON data from the file
const data = fs.readFileSync(
  path.join(__dirname, '../urlList/urlList.json'),
  'utf-8'
);

const apps = JSON.parse(data);

apps.forEach((app: any, index: number) => {
  // Create dashboard that uses the appName as a tag for reference
  createDashboard(app.appName, index);
  // Create group that will be referenced within a given check
  let group = {};
  group = createGroup(app.appName);

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
