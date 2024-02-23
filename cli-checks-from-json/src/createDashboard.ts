import { Dashboard } from 'checkly/constructs';

export function createDashboard(appName: string) {
  return new Dashboard(`${appName.toLowerCase()}-dashboard`, {
    header: `${appName} Dashboard`,
    description: 'Dashboard associated with a basic demo',
    tags: [appName, 'cli'],
    useTagsAndOperator: false,
    logo: 'https://www.moviemaker.com/wp-content/uploads/2022/05/Could-Any-Other-Actor-Play-Himself-as-Well-as-Nicolas-Cage-Plays-Nicolas-Cage-675x444.jpg',
    customUrl: `${appName.toLowerCase()}-dashboard`,
  });
}