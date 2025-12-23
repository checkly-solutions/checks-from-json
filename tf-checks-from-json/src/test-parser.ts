/**
 * Test harness for JSON parser
 * Validates that urlList.json can be parsed correctly
 */

import { parseUrlListJson } from './parsers/json-parser';
import { log, success, error } from './utils/logger';
import * as path from 'path';

async function main() {
  try {
    const urlListPath = path.join(__dirname, 'urlList', 'urlList.json');

    log('Parsing urlList.json...');
    const apps = await parseUrlListJson(urlListPath);

    success(`Parsed ${apps.length} apps`);

    if (apps.length > 0) {
      log(`First app: ${apps[0].appName}`);

      // Count checks
      let totalChecks = 0;
      for (const app of apps) {
        for (const tier of ['app1', 'app2', 'app3', 'app4'] as const) {
          for (const category of app[tier]) {
            if (category.api_check) totalChecks += category.api_check.length;
            if (category.browser_check) totalChecks += category.browser_check.length;
            if (category.multi_check) totalChecks += category.multi_check.length;
          }
        }
      }

      success(`Total checks found: ${totalChecks}`);
    }

  } catch (err) {
    error(`Failed to parse urlList.json: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
