import path from 'path';
import { BrowserCheck } from 'checkly/constructs';

export function createBrowserCheck(
  app: any,
  category: string,
  group: any
) {
  app[category].forEach((check: any) => {
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
}
