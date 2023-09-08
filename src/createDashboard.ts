import { Dashboard } from 'checkly/constructs';

export function createDashboard(appName: string, index: number) {
  return new Dashboard(`${appName.toLowerCase()}-dashboard-${index + 1}`, {
    header: `${appName} Dashboard`,
    description: 'Dashboard associated with a basic demo',
    tags: [appName, 'cli'],
    useTagsAndOperator: false,
    logo: 'https://mma.prnewswire.com/media/875497/Maritz_logo.jpg?p=facebook',
    customUrl: `${appName.toLowerCase()}-dashboard-${index + 1}`,
  });
}
