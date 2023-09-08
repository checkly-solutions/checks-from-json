import { ApiCheck, AssertionBuilder } from "checkly/constructs";

export function createApiCheck(appName: string, category: string, check: any, group: any) {
  return new ApiCheck(`${check.urlShort}-${appName}-api`, {
    name: `${check.urlShort} ${appName} ${category}`,
    group: group,
    // checks have an activated true or false value
    activated: check.activated,
    // apps have an appName attribute and have URL categories, we're passing these as tags for searchability
    tags: ['API', appName],
    degradedResponseTime: 5000,
    maxResponseTime: 10000,
    request: {
      // checks have url attributes - this is what our individual checks are targetting
      url: check.url,
      // checks can have multiple types of methods, right now our logic only works with basic 'GET' requests, but we could add additional logic and handling for other methods
      method: check.method,
      followRedirects: true,
      skipSSL: false,
      assertions: [AssertionBuilder.statusCode().equals(200)],
    },
  });
}
