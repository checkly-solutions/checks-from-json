import { CheckGroup } from "checkly/constructs";
import { emailChannel, msTeamsWebhookChannel } from './alert-channels'; // Import alert channels
const alertChannels = [emailChannel, msTeamsWebhookChannel];

export function createGroup(appName: string, category: string) {
  return new CheckGroup(`${appName}-${category}-group`, {
    name: `${appName} ${category} Group`,
    activated: true,
    muted: false,
    runtimeId: '2023.02',
    // How frequently the resources within the group are run 
    frequency: 1,
    // We round robin run through these locations, so we're not running on them concurrently by default
    locations: ['us-east-1', 'us-west-2'],
    // The tags we pass a group will dictate how they appear in dashboards
    tags: [appName, category],
    environmentVariables: [],
    apiCheckDefaults: {},
    concurrency: 100,
    alertChannels, // This variable needs to be defined somewhere
  });
}