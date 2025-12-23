/**
 * Tests for resource ID generator
 * Based on spec sections 6.2 and 10.1
 */

import { generateResourceId } from '../src/generators/resource-id-generator';

describe('generateResourceId', () => {
  describe('API checks', () => {
    test('generates correct ID for API check', () => {
      expect(generateResourceId('api', 'Env-Observability', 'app1', 'books-api'))
        .toBe('api_books_api_env_observability_app1');
    });

    test('handles special characters in urlShort', () => {
      expect(generateResourceId('api', 'TestApp', 'app1', 'test#api$value'))
        .toBe('api_test_api_value_testapp_app1');
    });
  });

  describe('Browser checks', () => {
    test('generates correct ID for browser check', () => {
      expect(generateResourceId('browser', 'Env-Observability', 'app1', 'userflow'))
        .toBe('browser_userflow_env_observability_app1');
    });

    test('handles hyphens in urlShort', () => {
      expect(generateResourceId('browser', 'App-Name', 'app2', 'app-userflow'))
        .toBe('browser_app_userflow_app_name_app2');
    });
  });

  describe('Multi-step checks', () => {
    test('generates correct ID for multi-step check', () => {
      expect(generateResourceId('multistep', 'Env-Observability', 'app1', 'crud-workflow'))
        .toBe('multistep_crud_workflow_env_observability_app1');
    });
  });

  describe('Check groups', () => {
    test('generates correct ID for check group', () => {
      expect(generateResourceId('group', 'Env-Observability', 'app1'))
        .toBe('group_env_observability_app1');
    });

    test('handles spaces in app name', () => {
      expect(generateResourceId('group', 'Env Observability', 'app3'))
        .toBe('group_env_observability_app3');
    });
  });

  describe('Dashboards', () => {
    test('generates correct ID for dashboard', () => {
      expect(generateResourceId('dashboard', 'Env-Observability'))
        .toBe('dashboard_env_observability');
    });

    test('handles uppercase letters', () => {
      expect(generateResourceId('dashboard', 'PROD-APP'))
        .toBe('dashboard_prod_app');
    });
  });

  describe('Alert channels', () => {
    test('generates correct ID for email alert', () => {
      expect(generateResourceId('email', 'team', 'app', '1'))
        .toBe('email_1_team_app');
    });

    test('generates correct ID for webhook alert', () => {
      expect(generateResourceId('webhook', 'servicenow', 'tier', '3'))
        .toBe('webhook_3_servicenow_tier');
    });
  });

  describe('Sanitization edge cases', () => {
    test('collapses multiple underscores', () => {
      expect(generateResourceId('api', 'test___app', 'app1', 'test___value'))
        .toBe('api_test_value_test_app_app1');
    });

    test('removes leading and trailing underscores', () => {
      expect(generateResourceId('api', '_TestApp_', 'app1', '_api_'))
        .toBe('api_api_testapp_app1');
    });

    test('handles already sanitized inputs', () => {
      expect(generateResourceId('api', 'already_sanitized', 'app1', 'test_api'))
        .toBe('api_test_api_already_sanitized_app1');
    });

    test('handles empty components gracefully', () => {
      // Empty string components should still be handled
      expect(generateResourceId('dashboard', 'TestApp', ''))
        .toBe('dashboard_testapp');
    });

    test('handles all special characters', () => {
      expect(generateResourceId('api', 'App@Name!', 'app1', 'test#api$'))
        .toBe('api_test_api_app_name_app1');
    });
  });
});
