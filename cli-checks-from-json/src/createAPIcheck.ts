import path from 'path';
import { ApiCheck, AssertionBuilder } from 'checkly/constructs';

export function createApiCheck(
  app: any,
  category: string,
  check: any,
  group: any
) {
  let handledAppName = app.appName.split(' ').join('-').toLowerCase();

  const setupScript =
    check.setup.length > 0
      ? { entrypoint: path.join(__dirname, check.setup) }
      : undefined;

  // Set shouldFail to false if it's not provided
  const shouldFail = check.shouldFail !== undefined ? check.shouldFail : false;

  const assertions = check.assertions.map(([assertionCode]: any) => {
    let assertion = AssertionBuilder;
    // Use regex to separate methods from arguments.
    const matches = assertionCode.match(/([a-zA-Z0-9_$]+)\(([^)]*)\)/g);

    if (matches) {
      matches.forEach((part: string) => {
        // Extract methodName and args.
        const [_, methodName, args] =
          part.match(/([a-zA-Z0-9_$]+)\(([^)]*)\)/) || [];
        assertion = (assertion as any)[methodName]?.(args) ?? assertion;
      });
    } else {
      // If no parenthetical arguments, treat as a single method.
      assertion = (assertion as any)[assertionCode] ?? assertion;
    }

    return assertion;
  });

  const headers = check.headers
    ? check.headers.map((header: any) => {
        const key = Object.keys(header)[0];
        return { key: key, value: header[key] };
      })
    : undefined;

  new ApiCheck(`${check.urlShort}-${handledAppName}-api`, {
    name: `${check.urlShort} ${handledAppName} ${category}`,
    group: group,
    activated: check.activated,
    frequency: check.frequency,
    shouldFail: shouldFail,
    tags: ['API', handledAppName, category, 'cli'],
    degradedResponseTime: 10000,
    maxResponseTime: 20000,
    request: {
      url: check.url,
      method: check.method,
      followRedirects: true,
      skipSSL: true,
      ...(setupScript && { setupScript }),
      ...(headers && { headers }),
      assertions: assertions,
    },
  });
}
