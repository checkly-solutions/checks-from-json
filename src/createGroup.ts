import { CheckGroup } from "checkly/constructs";
import { emailChannel, msTeamsWebhookChannel } from './alert-channels'; // Import alert channels
const alertChannels = [emailChannel, msTeamsWebhookChannel];

export function createGroup(appName: string) {
  return new CheckGroup(`${appName}-group`, {
    name: `${appName} Group`,
    activated: true,
    muted: false,
    runtimeId: '2023.02',
    frequency: 1,
    locations: ['us-east-1', 'us-west-2'],
    tags: [appName, 'cli'],
    environmentVariables: [],
    apiCheckDefaults: {},
    concurrency: 100,
    alertChannels,
  });
}