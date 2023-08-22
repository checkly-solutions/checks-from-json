import { Dashboard } from 'checkly/constructs';

export function createDashboard(appName: string) {
  return new Dashboard(`${appName}-dashboard`, {
    header: `${appName} Dashboard`,
    description: 'Dashboard associated with a basic demo',
    tags: [appName],
    logo: 'https://www.vecteezy.com/png/9665395-green-money-banknote-cartoon-png-file',
    customUrl: `${appName.toLowerCase()}-dashboard`,
  });
}

