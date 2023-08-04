import { CheckGroup } from 'checkly/constructs'
import { smsChannel, emailChannel } from '../alert-channels'
const alertChannels = [smsChannel, emailChannel]

export const demoGroup = new CheckGroup('demo-check-group-1', {
  name: 'Demo Group',
  activated: true,
  muted: false,
  runtimeId: '2023.02',
  frequency: 60,
  locations: ['us-east-1', 'eu-west-1'],
  tags: ['mac', 'group', 'demo'],
  environmentVariables: [],
  apiCheckDefaults: {},
  concurrency: 100,
  alertChannels,
})
