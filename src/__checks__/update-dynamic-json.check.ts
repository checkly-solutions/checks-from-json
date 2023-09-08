//@ts-nocheck
import fs from 'fs';
import path from 'path';
import {
  Dashboard,
  CheckGroup,
  BrowserCheck,
  ApiCheck,
  AssertionBuilder,
} from 'checkly/constructs'; // Import the necessary classes from Checkly

import { createDashboard } from '../createDashboard';
import { createGroup } from '../createGroup';
import { createApiCheck } from '../createAPIcheck';

// Read the JSON data from the file
const data = fs.readFileSync(
  path.join(__dirname, '../urlList/urlList.json'),
  'utf-8'
);

const apps = JSON.parse(data);

apps.forEach((app: any, index: number) => {
  // Create dashboard that uses the appName as a tag for reference
  createDashboard(app.appName, index);
  // Create group that will be referenced within a given check
  let group = {};
  group = createGroup(app.appName);

  ['browser_checks', 'api_checks'].forEach((category) => {
    if (
      app[category] &&
      app[category].length >= 1 &&
      category === 'browser_checks'
    ) {
      app[category].forEach((check) => {
        const filePath = check.filePath.length > 0 ? check.filePath : undefined;

        new BrowserCheck(`${check.urlShort}-${app.appName}-browser`, {
          name: `${check.urlShort} ${app.appName} ${category}`,
          frequency: check.frequency,
          group,
          tags: ['browser', app.appName],
          code: {
            entrypoint: path.join(`../${filePath}`),
          },
        });
      });
    } else if (
      app[category] &&
      app[category].length >= 1 &&
      category === 'api_checks'
    ) {
      // create API check 
      createApiCheck(app, group, category, index);
    }
  });
});