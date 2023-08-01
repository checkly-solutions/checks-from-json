// NOT IN USE






















// NOT IN USE
import * as path from 'path';
import {
  CheckGroup,
  ApiCheck,
  Dashboard,
  AssertionBuilder,
  MaintenanceWindow
} from 'checkly/constructs';
import { smsChannel, emailChannel } from '../alert-channels';
import { demoGroup } from './demo-group.check';

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
// example: app3-dashboard-1
new Dashboard('engage-dashboard-1', {
  header: 'Varo Dashboard',
  description: 'Dashboard associated with a basic demo',
  // 'app3', 'api'
  tags: ['prod', 'browser', 'varo'],
  logo: 'https://www.vecteezy.com/png/9665395-green-money-banknote-cartoon-png-file',
  customUrl: `demo-dashboard`,
});

// example: app3-info
new CheckGroup('demo-check-group-1', {
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