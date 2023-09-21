import { Dashboard } from 'checkly/constructs';

export function createDashboard(appName: string, index: number) {
  const formattedAppName = appName.split(' ').join('-').toLowerCase()

  return new Dashboard(`${formattedAppName}-dashboard-${index + 1}`, {
    header: `${appName} Dashboard`,
    description: 'Dashboard associated with a basic demo',
    tags: [formattedAppName],
    useTagsAndOperator: false,
    isPrivate: true,
    enableIncidents: true,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Squarespace_Logo.png',
    customUrl: `${formattedAppName}-dashboard-${index + 1}`,
  });
}
