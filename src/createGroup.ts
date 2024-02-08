// Notice how each function creating a ServiceNow or MSTeamsWebhook has a ('#') within it, this is what dynamically creates the channel.
// For email (or any other individual channel) if you want the same ones used you'll have to either follow the function approach or create individual emails and add to the proper tier

import { CheckGroup, AlertChannel } from 'checkly/constructs';
// import all the alert channels you want to assign
import {
  emailChannelTier1,
  emailChannelTier2,
  emailChannelTier3,
  emailChannelTier4,
  createServiceNowChannel,
  createMSTeamsWebhookChannel,
} from './alert-channels'; // Import alert channels


// // assign the appropriate alert to the appropriate tier
// const tier4Channels: AlertChannel[] = [emailChannelTier4];
// const tier3Channels: AlertChannel[] = [
//   emailChannelTier3,
//   createServiceNowChannel('3'),
//   createMSTeamsWebhookChannel('3'),
// ];
// const tier2Channels: AlertChannel[] = [
//   emailChannelTier2,
//   createServiceNowChannel('2'),
//   createMSTeamsWebhookChannel('2'),
// ];
// const tier1Channels: AlertChannel[] = [
//   emailChannelTier1,
//   createServiceNowChannel('1'),
//   createMSTeamsWebhookChannel('1'),
// ];

// const tierChannelMapping: any = {
//   tier1: tier1Channels,
//   tier2: tier2Channels,
//   tier3: tier3Channels,
//   tier4: tier4Channels,
// };

export function createGroup(appName: string, category: string) {
  const formattedAppName = appName.split(' ').join('-').toLowerCase();

  // const alertChannels = tierChannelMapping[category];

  // if (!alertChannels) {
  //   throw new Error(`Invalid category: ${category}`);
  // }
  const alertChannels = [
    emailChannelTier1,
    emailChannelTier2,
    emailChannelTier3,
    emailChannelTier4,
  ]
  
  
  return new CheckGroup(`${formattedAppName}-${category}-group`, {
    name: `${formattedAppName} ${category} Group`,
    activated: true,
    muted: false,
    runtimeId: '2023.09',
    // How frequently the resources within the group are run 
    frequency: 30,
    // We round robin run through these locations, so we're not running on them concurrently by default
    locations: ['us-east-1', 'us-west-2'],

    // if using private locations uncomment this line and comment out locations array. 
    // privateLocations: ['sherwintest-privatelocation']
    
    // The tags we pass a group will dictate how they appear in dashboards
    tags: [formattedAppName, category],
    environmentVariables: [],
    apiCheckDefaults: {},
    concurrency: 100,
    alertChannels, // This variable needs to be defined somewhere
  });
}
