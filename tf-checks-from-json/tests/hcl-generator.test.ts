/**
 * Tests for HCL generator
 * Based on spec sections 6.3 and 10.1
 *
 * The HCL generator converts Terraform resource objects to valid HCL strings.
 * This is critical for producing valid Terraform configuration files.
 */

import { generateHcl } from '../src/generators/hcl-generator';
import { TerraformResource } from '../src/types/terraform.types';

describe('generateHcl', () => {
  describe('Simple resources', () => {
    test('generates HCL for resource with primitive values', () => {
      const resource: TerraformResource = {
        resourceType: 'checkly_check',
        resourceId: 'test_check',
        fileName: 'checks_api.tf',
        attributes: {
          name: 'Test Check',
          type: 'API',
          activated: true,
          frequency: 5
        }
      };

      const hcl = generateHcl(resource);

      expect(hcl).toContain('resource "checkly_check" "test_check" {');
      expect(hcl).toContain('name = "Test Check"');
      expect(hcl).toContain('type = "API"');
      expect(hcl).toContain('activated = true');
      expect(hcl).toContain('frequency = 5');
      expect(hcl).toContain('}');
    });

    test('handles boolean values correctly', () => {
      const resource: TerraformResource = {
        resourceType: 'checkly_check',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          activated: true,
          muted: false
        }
      };

      const hcl = generateHcl(resource);
      expect(hcl).toContain('activated = true');
      expect(hcl).toContain('muted = false');
    });

    test('handles number values correctly', () => {
      const resource: TerraformResource = {
        resourceType: 'checkly_check',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          frequency: 5,
          max_response_time: 20000,
          degraded_response_time: 10000
        }
      };

      const hcl = generateHcl(resource);
      expect(hcl).toContain('frequency = 5');
      expect(hcl).toContain('max_response_time = 20000');
      expect(hcl).toContain('degraded_response_time = 10000');
    });
  });

  describe('Nested blocks', () => {
    test('generates nested blocks correctly', () => {
      const resource: TerraformResource = {
        resourceType: 'checkly_check',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          request: {
            url: 'https://api.test.com',
            method: 'GET'
          }
        }
      };

      const hcl = generateHcl(resource);
      expect(hcl).toContain('request {');
      expect(hcl).toContain('url = "https://api.test.com"');
      expect(hcl).toContain('method = "GET"');
      expect(hcl).toContain('}');
    });

    test('handles deep nesting', () => {
      const resource: TerraformResource = {
        resourceType: 'test',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          level1: {
            level2: {
              level3: 'deep value'
            }
          }
        }
      };

      const hcl = generateHcl(resource);
      expect(hcl).toContain('level1 {');
      expect(hcl).toContain('level2 {');
      expect(hcl).toContain('level3 = "deep value"');
    });
  });

  describe('Arrays of blocks', () => {
    test('generates repeated blocks for arrays', () => {
      const resource: TerraformResource = {
        resourceType: 'checkly_check',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          request: {
            assertion: [
              {
                source: 'STATUS_CODE',
                comparison: 'EQUALS',
                target: '200'
              },
              {
                source: 'RESPONSE_TIME',
                comparison: 'LESS_THAN',
                target: '1000'
              }
            ]
          }
        }
      };

      const hcl = generateHcl(resource);

      // Should have two assertion blocks
      const assertionCount = (hcl.match(/assertion \{/g) || []).length;
      expect(assertionCount).toBe(2);

      expect(hcl).toContain('source = "STATUS_CODE"');
      expect(hcl).toContain('source = "RESPONSE_TIME"');
    });
  });

  describe('Terraform references', () => {
    test('does not quote Terraform references', () => {
      const resource: TerraformResource = {
        resourceType: 'checkly_check',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          group_id: 'checkly_check_group.my_group.id'
        }
      };

      const hcl = generateHcl(resource);
      expect(hcl).toContain('group_id = checkly_check_group.my_group.id');
      expect(hcl).not.toContain('"checkly_check_group.my_group.id"');
    });

    test('handles multiple references', () => {
      const resource: TerraformResource = {
        resourceType: 'test',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          group_id: 'checkly_check_group.group1.id',
          alert_channel_subscription: [
            {
              channel_id: 'checkly_alert_channel.email1.id',
              activated: true
            }
          ]
        }
      };

      const hcl = generateHcl(resource);
      expect(hcl).toContain('group_id = checkly_check_group.group1.id');
      expect(hcl).toContain('channel_id = checkly_alert_channel.email1.id');
    });
  });

  describe('String escaping', () => {
    test('escapes quotes in strings', () => {
      const resource: TerraformResource = {
        resourceType: 'test',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          description: 'This is a "quoted" string'
        }
      };

      const hcl = generateHcl(resource);
      expect(hcl).toContain('description = "This is a \\"quoted\\" string"');
    });

    test('escapes backslashes', () => {
      const resource: TerraformResource = {
        resourceType: 'test',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          path: 'C:\\Windows\\System32'
        }
      };

      const hcl = generateHcl(resource);
      expect(hcl).toContain('path = "C:\\\\Windows\\\\System32"');
    });

    test('escapes newlines', () => {
      const resource: TerraformResource = {
        resourceType: 'test',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          message: 'Line 1\nLine 2'
        }
      };

      const hcl = generateHcl(resource);
      expect(hcl).toContain('message = "Line 1\\nLine 2"');
    });
  });

  describe('Maps (headers)', () => {
    test('generates key-value pairs for maps', () => {
      const resource: TerraformResource = {
        resourceType: 'checkly_alert_channel',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          webhook: {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer token'
            }
          }
        }
      };

      const hcl = generateHcl(resource);
      expect(hcl).toContain('headers = {');
      expect(hcl).toContain('"Content-Type" = "application/json"');
      expect(hcl).toContain('"Authorization" = "Bearer token"');
    });
  });

  describe('Null and undefined handling', () => {
    test('skips undefined values', () => {
      const resource: TerraformResource = {
        resourceType: 'test',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          name: 'test',
          description: undefined
        }
      };

      const hcl = generateHcl(resource);
      expect(hcl).toContain('name = "test"');
      expect(hcl).not.toContain('description');
    });

    test('skips null values', () => {
      const resource: TerraformResource = {
        resourceType: 'test',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          name: 'test',
          value: null
        }
      };

      const hcl = generateHcl(resource);
      expect(hcl).toContain('name = "test"');
      expect(hcl).not.toContain('value');
    });
  });

  describe('Array values (tags, locations)', () => {
    test('generates array syntax for string arrays', () => {
      const resource: TerraformResource = {
        resourceType: 'checkly_check',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          tags: ['API', 'production', 'critical'],
          locations: ['us-east-1', 'us-west-2']
        }
      };

      const hcl = generateHcl(resource);
      expect(hcl).toContain('tags = ["API", "production", "critical"]');
      expect(hcl).toContain('locations = ["us-east-1", "us-west-2"]');
    });

    test('handles empty arrays', () => {
      const resource: TerraformResource = {
        resourceType: 'test',
        resourceId: 'test',
        fileName: 'test.tf',
        attributes: {
          tags: []
        }
      };

      const hcl = generateHcl(resource);
      expect(hcl).toContain('tags = []');
    });
  });

  describe('Complex real-world examples', () => {
    test('generates complete API check resource', () => {
      const resource: TerraformResource = {
        resourceType: 'checkly_check',
        resourceId: 'api_test_app1',
        fileName: 'checks_api.tf',
        attributes: {
          name: 'test-api app1',
          type: 'API',
          activated: true,
          frequency: 5,
          group_id: 'checkly_check_group.group_app1.id',
          tags: ['API', 'app', 'app1', 'cli'],
          degraded_response_time: 10000,
          max_response_time: 20000,
          locations: ['us-east-1', 'us-west-2'],
          request: {
            url: 'https://api.example.com/test',
            method: 'GET',
            follow_redirects: true,
            skip_ssl: true,
            assertion: [
              {
                source: 'STATUS_CODE',
                comparison: 'EQUALS',
                target: '200'
              }
            ]
          }
        }
      };

      const hcl = generateHcl(resource);

      // Verify structure
      expect(hcl).toContain('resource "checkly_check" "api_test_app1" {');
      expect(hcl).toContain('request {');
      expect(hcl).toContain('assertion {');

      // Verify Terraform reference is unquoted
      expect(hcl).toContain('group_id = checkly_check_group.group_app1.id');
      expect(hcl).not.toContain('"checkly_check_group.group_app1.id"');
    });
  });
});
