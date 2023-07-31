import { Dashboard } from 'checkly/constructs';

// Dashboard
const dashboard = new Dashboard('engage-dashboard-1', {
  header: 'Dashboard',
  description: 'Dashboard associated with a basic demo',
  tags: ['prod', 'browser', 'demo'],
  logo: 'https://www.vecteezy.com/png/9665395-green-money-banknote-cartoon-png-file',
  customUrl: `demo-dashboard`,
});
