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

    const appName = app.appName.split(' ').join('-').toLowerCase()

    const setupScript =
      check.setup.length > 0
        ? { entrypoint: path.join(__dirname, check.setup) }
        : undefined;

        const assertions = check.assertions.map(([assertionCode]: any) => {
          let assertion = AssertionBuilder;
          // Use regex to separate methods from arguments.
          const matches = assertionCode.match(/([a-zA-Z0-9_$]+)\(([^)]*)\)/g);
          
          if (matches) {
            matches.forEach((part: string) => {
              // Extract methodName and args.
              const [_, methodName, args] = part.match(/([a-zA-Z0-9_$]+)\(([^)]*)\)/) || [];
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

    new ApiCheck(`${check.urlShort}-${appName}-API-${index + 1}`, {
      name: `${check.urlShort} ${appName} ${category}`,
      group: group,
      activated: check.activated,
      frequency: check.frequency,
      tags: ['API', appName, category, "cli"],
      degradedResponseTime: 5000,
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
