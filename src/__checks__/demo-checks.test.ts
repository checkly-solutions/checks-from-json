import * as path from 'path';
import {
  CheckGroup,
  ApiCheck,
  Dashboard,
  BrowserCheck,
  AssertionBuilder,
  MaintenanceWindow,
  Frequency
} from 'checkly/constructs';
import { smsChannel, emailChannel } from '../alert-channels';
import { demoGroup } from './demo-group.test';

const alertChannels = [smsChannel, emailChannel];


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
new Dashboard('trusted-dashboard', {
  header: 'Trusted Dashboard',
  description: 'Dashboard associated with a basic demo',
  // 'app3', 'api'
  tags: ['prod', 'browser', 'trusted'],
  logo: 'https://assets-global.website-files.com/6154ac78893abf1d1530f251/615f69a10c2a1134331892ef_trusted-logo.svg',
  customUrl: `demo-dashboard`,
});

// example: app3-info
new CheckGroup('trusted-check-group-1', {
  // example: app3 info
  name: 'Demo Group',
  activated: true,
  muted: false,
  runtimeId: '2023.02',
  frequency: 60,
  locations: ['us-east-1', 'eu-west-1'],
  // example: ['app3-info', 'app3' ]
  tags: ['mac', 'group', 'demo'],
  environmentVariables: [],
  apiCheckDefaults: {},
  concurrency: 100,
  alertChannels,
})

new BrowserCheck('browser-trusted-get-started', {
  name: 'Browser - Trusted - Get Started',
  activated: true,
  muted: false,
  doubleCheck: true,
  shouldFail: false,
  locations: ['us-east-1', 'us-east-2'],
  tags: [],
  frequency: Frequency.EVERY_10M,
  environmentVariables: [],
  code: {
    entrypoint: '../tests/trusted-get-started.spec.ts',
  },
})


new ApiCheck('homepage-api-check-1', {
  // example: API - app3 info jsonplaceholder
  name: 'API - Fetch Book List',
  // should look like app3Group and references a dynamically created group i.e. const app3Group = new GroupCheck
  group: demoGroup,
  // bring this from json
  activated: true,
  // example: ['api', 'app3', 'info, 'jsonplaceholder']
  tags: ['API'],
  degradedResponseTime: 10000,
  maxResponseTime: 20000,
  setupScript: {
    entrypoint: path.join(__dirname, './utils/setup.ts'),
  },
  request: {
    // example: "https://jsonplaceholder.typicode.com/posts"
    url: 'https://danube-web.shop/api/books',
    method: 'GET',
    followRedirects: true,
    skipSSL: false,
    assertions: [
      AssertionBuilder.statusCode().equals(200),
    ],
  },
});