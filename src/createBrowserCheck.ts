import path from 'path';
import { BrowserCheck } from "checkly/constructs";

export function createBrowserCheck(appName: string, category: string, check: any, group: any) {
  return new BrowserCheck(`${check.urlShort}-${appName}-api`, {
    name: `${check.urlShort} ${appName} ${category}`,
    frequency: check.frequency,
    tags: ['browser', appName],
    code: {
      entrypoint: path.join(__dirname, '/browser-scripts/basic-up.spec.js')
    }  })
}