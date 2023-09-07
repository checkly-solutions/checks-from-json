import fs from 'fs';
import path from 'path';

// Import resources
import {createDashboard} from '../createDashboard'
import {createGroup} from '../createGroup'
import {createApiCheck} from '../createAPIcheck'

// Read the JSON data from the file
const data = fs.readFileSync(
  path.join(__dirname, '../urlList/sherwinExternalURLs.json'),
  'utf-8'
);

// Create an array from the parsed JSON
const apps = JSON.parse(data);

// Iterate through the array to create Dashboards based on the app name attribute
apps.forEach((app: any) => {
  const dashboard = createDashboard(app.appName);

  ['info', 'high', 'critical'].forEach((category) => {
    if (app[category].length >= 1) {
      const group = createGroup(app.appName, category);

      app[category].forEach((check: any) => {
        createApiCheck(app.appName, category, check, group);
      });
    }
  });
});
