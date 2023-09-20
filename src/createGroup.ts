import { CheckGroup } from "checkly/constructs";
import { emailChannel, googleWebHook } from './alert-channels'; // Import alert channels
const alertChannels = [emailChannel, googleWebHook];

export function createGroup(appName: string) {
  const formattedAppName = appName.split(' ').join('-').toLowerCase()

  return new CheckGroup(`${formattedAppName}-group`, {
    name: `${formattedAppName}`,
    activated: true,
    muted: true,
    runtimeId: '2023.02',
    frequency: 1,
    locations: ['us-east-1', 'us-west-2'],
    tags: [formattedAppName, 'cli'],
    environmentVariables: [],
    apiCheckDefaults: {},
    concurrency: 100,
    alertChannels,
  });
}