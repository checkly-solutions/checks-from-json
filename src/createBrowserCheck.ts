import path from 'path';
import { BrowserCheck } from 'checkly/constructs';

export const createBrowserCheck = (app: any, group: any, category: string, index: number) => {
  app[category].forEach((check: any) => {
    const appName = app.appName.split(' ').join('-').toLowerCase();

    const filePath = check.filePath.length > 0 ? check.filePath : undefined;

    new BrowserCheck(`${check.urlShort}-${appName}-Browser-${index+1}`, {
      name: `${check.urlShort} ${appName} ${category}`,
      frequency: check.frequency,
      group,
      tags: ['browser', appName, "cli"],
      code: {
        entrypoint: path.join(`../${filePath}`),
      },
    });
  });
};
