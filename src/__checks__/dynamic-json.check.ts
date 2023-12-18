import fs from 'fs';
import path from 'path';

// Import functions necessary to create appropriate resources
import { createDashboard } from '../createDashboard';
import { createGroup } from '../createGroup';
import { createApiCheck } from '../createAPIcheck';
import { createBrowserCheck } from '../createBrowserCheck';

// Read the JSON data from the file
const data = fs.readFileSync(
  path.join(__dirname, '../urlList/urlList.json'),
  'utf-8'
);

const apps = JSON.parse(data);

// Iterate through the array to create Dashboards based on the app name attribute
apps.forEach((app: any) => {
  const dashboard = createDashboard(app.appName);

  // Read through new tier based categories
  ['tier4', 'tier3', 'tier2', 'tier1'].forEach((tier) => {
    console.log(tier, 'tier');
    if (app[tier].length >= 1) {
      const group = createGroup(app.appName, tier);

      // Declare what function to use depending on check type read from JSON
      const checkCreators: any = {
        browser_check: createBrowserCheck,
        api_check: createApiCheck,
      };

      // Iterate over each tier in the app
      app[tier].forEach((checkCategory: { [key: string]: any[] }) => {
        // Iterate over each type of check within the checkCategory
        Object.keys(checkCategory).forEach((checkType) => {
          // Retrieve the array of checks for the current checkType
          console.log(checkType, '-------- checkType  ------');
          const checks = checkCategory[checkType];

          // Check if the checkType is one of the known types and is an array
          if (Array.isArray(checks)) {
            console.log(checks, '--------- check of above ----------');
            // Use type assertion to assert that checkCreators[checkType] is a function
            const checkCreatorFunction = checkCreators[checkType] as (
              app: any,
              tier: string,
              check: any,
              group: any
            ) => void;

            // Check if checkCreatorFunction is a function before calling it
            if (typeof checkCreatorFunction === 'function') {
              console.log('checkCreatorFunction hit');
            
              // Log the parameters being passed to the check creator function
              console.log(`Parameters for ${checkType}:`, { app, tier, checks, group });
            
              checks.forEach((check) => {
                checkCreatorFunction(app, tier, check, group);
              });
            }
          } else {
            console.log(`No checks found for ${tier}`);
          }
        });
      });
    }
  });
});
