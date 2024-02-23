import path from 'path';
import { BrowserCheck } from 'checkly/constructs';

export const createBrowserCheck = (
  app: any,
  category: string,
  check: any,
  group: any
) => {

  let handledAppName = app.appName.split(' ').join('-').toLowerCase();


  const filePath = check.filePath.length > 0 ? check.filePath : undefined;

  new BrowserCheck(`${check.urlShort}-${handledAppName}-${category}`, {
    name: `${check.urlShort} ${handledAppName} ${category}`,
    frequency: check.frequency,
    group,
    tags: [category, handledAppName, 'cli'],
    code: {
      entrypoint: path.join(`../${filePath}`),
    },
  });
};
