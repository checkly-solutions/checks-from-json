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

// Iterate through each App within JSON
apps.forEach((app: any, index: number) => {
  // Create dashboard that uses the appName as a tag for reference
  createDashboard(app.appName, index);

  // Create group that will be referenced within a given check
  let group = {};
  group = createGroup(app.appName);

  // Declare what function to use depending on check type read from JSON
  const checkCreators: any = {
    'browser_checks': createBrowserCheck,
    'api_checks': createApiCheck
  };

  ['browser_checks', 'api_checks'].forEach((category) => {
    if (app[category] && app[category].length >= 1) {
      checkCreators[category](app, group, category, index);
    }
  })
})