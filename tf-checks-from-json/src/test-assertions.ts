/**
 * Test harness for assertion parser
 * Validates that real assertions from urlList.json parse correctly
 */

import { parseUrlListJson } from './parsers/json-parser';
import { parseAssertion } from './parsers/assertion-parser';
import { log, success, error } from './utils/logger';
import * as path from 'path';

async function main() {
  try {
    const urlListPath = path.join(__dirname, 'urlList', 'urlList.json');
    const apps = await parseUrlListJson(urlListPath);

    log('Testing assertion parser with real urlList.json assertions...');

    let totalAssertions = 0;
    let successfullyParsed = 0;

    for (const app of apps) {
      for (const tier of ['app1', 'app2', 'app3', 'app4'] as const) {
        for (const category of app[tier]) {
          if (category.api_check) {
            for (const check of category.api_check) {
              for (const assertionArray of check.assertions) {
                for (const assertionString of assertionArray) {
                  totalAssertions++;
                  try {
                    const parsed = parseAssertion(assertionString);
                    successfullyParsed++;
                    log(`✓ Parsed: "${assertionString}"`);
                    log(`  → source: ${parsed.source}, comparison: ${parsed.comparison}, target: ${parsed.target}`);
                  } catch (err) {
                    error(`✗ Failed to parse: "${assertionString}"`);
                    error(`  Error: ${(err as Error).message}`);
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log('');
    success(`Successfully parsed ${successfullyParsed}/${totalAssertions} assertions`);

    if (successfullyParsed !== totalAssertions) {
      process.exit(1);
    }

  } catch (err) {
    error(`Test failed: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
