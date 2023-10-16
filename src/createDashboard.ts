import { Dashboard } from 'checkly/constructs';

export function createDashboard(appName: string, index: number) {
  const formattedAppName = appName.split(' ').join('-').toLowerCase()

  return new Dashboard(`${formattedAppName}-dashboard-${index + 1}`, {
    header: `${appName} Dashboard`,
    description: 'Dashboard associated with a basic demo',
    tags: [formattedAppName],
    useTagsAndOperator: true,
    isPrivate: true,
    enableIncidents: true,
    logo: 'https://weliveentertainment.com/wp-content/uploads/2017/06/ca-1095x578.jpg',
    customUrl: `${formattedAppName}-dashboard-${index + 1}`,
  });
}
