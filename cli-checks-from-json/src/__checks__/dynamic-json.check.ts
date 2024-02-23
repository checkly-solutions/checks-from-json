import fs from 'fs';
import path from 'path';

// Import functions necessary to create appropriate resources
import { createDashboard } from '../createDashboard';
import { createGroup } from '../createGroup';
import { createApiCheck } from '../createAPIcheck';
import { createBrowserCheck } from '../createBrowserCheck';
import { createMultiStepCheck } from '../createMultiStep';

// Read the JSON data from the file
const data = fs.readFileSync(
  path.join(__dirname, '../urlList/urlList.json'),
  'utf-8'
);

// Read the JSON data from the file
const apps = JSON.parse(data);

// Iterate through the array to create Dashboards based on the app name attribute
apps.forEach((app: any) => {
  const dashboard = createDashboard(app.appName);

  // Read through new tier based categories
  ['app4', 'app3', 'app2', 'app1'].forEach((tier) => {
    console.log(tier, 'tier');
    if (app[tier].length >= 1) {
      const group = createGroup(app.appName, tier);

      // Declare what function to use depending on check type read from JSON
      const checkCreators: any = {
        browser_check: createBrowserCheck,
        api_check: createApiCheck,
        multi_check: createMultiStepCheck,
      };

      // Iterate over each tier in the app
      app[tier].forEach((checkCategory: { [key: string]: any[] }) => {
        // Iterate over each type of check within the checkCategory
        Object.keys(checkCategory).forEach((checkType) => {
          const checks = checkCategory[checkType];
          if (Array.isArray(checks)) {
            checks.forEach((check) => {
              checkCreators[checkType]?.(app, tier, check, group);
            });
          }
        });
      });
    }
  });
});
