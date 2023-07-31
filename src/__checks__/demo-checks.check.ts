import * as path from 'path';
import {
  BrowserCheck,
  ApiCheck,
  Dashboard,
  AssertionBuilder,
  MaintenanceWindow
} from 'checkly/constructs';
import { smsChannel, emailChannel } from '../alert-channels';
import { demoGroup } from './demo-group.check';

const alertChannels = [smsChannel, emailChannel];

/*
 * In this example, we bundle all basic checks needed to check the Checkly homepage. We explicitly define the Browser
 * check here, instead of using a default based on a .spec.js file. This allows us to override the check configuration.
 * We can also add more checks into one file, in this case to cover a specific API call needed to hydrate the homepage.
 */


new MaintenanceWindow('engage-maintenance-window-1', {
  name: 'Programmed website maintenance',
  tags: ['production', 'browser', 'varo'],
  // 2023-07-20 at 11 PM EST in UTC
  startsAt: new Date(Date.UTC(2023, 6, 21, 4, 0, 0)), // Note: JavaScript's months are 0-indexed
  // 2023-07-21 at 12 AM EST in UTC
  endsAt: new Date(Date.UTC(2023, 6, 21, 5, 0, 0)),
  repeatInterval: 1,
  repeatUnit: 'MONTH',
  repeatEndsAt: new Date(new Date().valueOf() + (2160 * 60 * 60 * 1000)), // ~three months from now
})

// Dashboard
new Dashboard('engage-dashboard-1', {
  header: 'Varo Dashboard',
  description: 'Dashboard associated with a basic demo',
  tags: ['prod', 'browser', 'varo'],
  logo: 'https://www.vecteezy.com/png/9665395-green-money-banknote-cartoon-png-file',
  customUrl: `demo-dashboard`,
});

// We can define multiple checks in a single *.check.ts file.
new BrowserCheck('homepage-browser-check', {
  name: 'Browser - Home page',
  alertChannels,
  tags: ['browser'],
  group: demoGroup,
  code: {
    entrypoint: path.join(__dirname, '../tests/homepage.spec.ts'),
  },
});

new BrowserCheck('login-browser-check', {
  name: 'Browser - Login Check',
  alertChannels,
  tags: ['browser'],
  group: demoGroup,
  code: {
    entrypoint: path.join(__dirname, '../tests/login.spec.ts'),
  },
});

new ApiCheck('homepage-api-check-1', {
  name: 'API - Fetch Book List',
  group: demoGroup,
  tags: ['API'],
  degradedResponseTime: 10000,
  maxResponseTime: 20000,
  setupScript: {
    entrypoint: path.join(__dirname, './utils/setup.ts'),
  },
  request: {
    url: 'https://danube-web.shop/api/books',
    method: 'GET',
    followRedirects: true,
    skipSSL: false,
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody('$[0].id').isNotNull(),
    ],
  },
});