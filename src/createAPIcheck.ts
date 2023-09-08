import path from 'path';
import { ApiCheck, AssertionBuilder } from 'checkly/constructs';

// Function to create API checks
export function createApiCheck(
  app: any,
  group: any,
  category: string,
  index: number
) {
  app[category].forEach((check: any) => {
    const setupScript =
      check.setup.length > 0
        ? { entrypoint: path.join(__dirname, check.setup) }
        : undefined;

    const assertions = check.assertions.map(([assertionCode]: any) => {
      let assertion = AssertionBuilder;
      assertionCode.split('.').forEach((part: string) => {
        const [methodName, args] = part.match(/(\w+)\((.*)\)/)?.slice(1) ?? [
          part,
          '',
        ];
        assertion = (assertion as any)[methodName]?.(args) ?? assertion;
      });
      return assertion;
    });

    const headers = check.headers
      ? check.headers.map((header: any) => {
          const key = Object.keys(header)[0];
          return { key: key, value: header[key] };
        })
      : undefined;

    new ApiCheck(`${app.appName}-${check.urlShort}-cli-${index + 1}`, {
      name: `${check.urlShort} ${category} ${app.appName}`,
      group: group,
      activated: check.activated,
      frequency: check.frequency,
      tags: ['API', app.appName, category],
      degradedResponseTime: 10000,
      maxResponseTime: 20000,
      request: {
        url: check.url,
        method: check.method,
        followRedirects: true,
        skipSSL: false,
        ...(setupScript && { setupScript }),
        ...(headers && { headers }),
        assertions: assertions,
      },
    });
  });
}
