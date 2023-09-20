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
    logo: 'https://www.moviemaker.com/wp-content/uploads/2022/05/Could-Any-Other-Actor-Play-Himself-as-Well-as-Nicolas-Cage-Plays-Nicolas-Cage-675x444.jpg',
    customUrl: `${formattedAppName}-dashboard-${index + 1}`,
  });
}
