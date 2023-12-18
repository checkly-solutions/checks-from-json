import path from 'path';
import { BrowserCheck } from 'checkly/constructs';

export const createBrowserCheck = (
  app: any,
  category: string,
  check: any,
  group: any
) => {
  const filePath = check.filePath.length > 0 ? check.filePath : undefined;

  new BrowserCheck(`${check.urlShort}-${app.appName}-${category}`, {
    name: `${check.urlShort} ${app.appName} ${category}`,
    frequency: check.frequency,
    group,
    tags: [category, app.appName, 'cli'],
    code: {
      entrypoint: path.join(`../${filePath}`),
    },
  });
};
