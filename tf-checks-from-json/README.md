# tf-checks-from-json

A TypeScript tool that converts Checkly monitoring configurations from JSON to Terraform HCL files. This tool provides an infrastructure-as-code approach to managing Checkly checks, groups, dashboards, and alert channels.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Input Schema](#input-schema)
- [Output Structure](#output-structure)
- [Supported Check Types](#supported-check-types)
- [Assertions](#assertions)
- [Alert Channels](#alert-channels)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## Overview

`tf-checks-from-json` is a port of the `cli-checks-from-json` tool that generates Terraform HCL files instead of deploying via the Checkly CLI. It maintains 100% functional parity with the CLI tool while providing the benefits of Terraform:

- Version control for monitoring configurations
- Infrastructure-as-code best practices
- Preview changes before applying (`terraform plan`)
- Declarative resource management
- State tracking and drift detection

## Features

- ✅ **Multiple Check Types**: API checks, browser checks, multi-step checks, and uptime monitors
- ✅ **Variable Locations**: 4-level location precedence (check > tier > global > defaults)
- ✅ **Uptime Monitors**: Lightweight HTTP availability monitoring
- ✅ **Alert Channels**: Email and webhook integrations (ServiceNow, MS Teams)
- ✅ **Check Groups**: Organize checks with shared alert subscriptions
- ✅ **Dashboards**: Custom dashboards with tag-based filtering
- ✅ **Assertions**: Comprehensive assertion support for API checks
- ✅ **Script Embedding**: Automatic Playwright script embedding for browser/multi-step checks
- ✅ **Type-Safe**: Full TypeScript with strict mode
- ✅ **Test Coverage**: 102 passing tests

## Installation

### Prerequisites

- Node.js 16+ and npm
- TypeScript 4.5+
- Terraform 1.0+ (for deploying generated HCL)
- Checkly account with API key and account ID

### Setup

1. Clone the repository:
```bash
cd tf-checks-from-json
```

2. Install dependencies:
```bash
npm install
```

3. Verify installation:
```bash
npx tsc --noEmit
npm test
```

## Quick Start

1. **Configure your checks** in `src/urlList/urlList.json`

2. **Add Playwright scripts** to `src/browser-scripts/` and `src/multi-scripts/`

3. **Generate Terraform configuration**:
```bash
npx ts-node src/generate_terraform.ts
```

4. **Deploy to Checkly**:
```bash
cd __checkly_tf__
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your Checkly credentials
terraform init
terraform plan
terraform apply
```

## Usage

### Generating Terraform Configuration

Run the main generator script from the project root:

```bash
npx ts-node src/generate_terraform.ts
```

This will:
1. Parse `src/urlList/urlList.json`
2. Load Playwright scripts from `src/browser-scripts/` and `src/multi-scripts/`
3. Generate Terraform HCL files in `__checkly_tf__/`
4. Create provider configuration and documentation

### Deploying to Checkly

Navigate to the generated Terraform directory:

```bash
cd __checkly_tf__
```

Initialize Terraform:
```bash
terraform init
```

Preview changes:
```bash
terraform plan
```

Apply configuration:
```bash
terraform apply
```

Destroy all resources (cleanup):
```bash
terraform destroy
```

## Input Schema

The tool expects a JSON configuration file at `src/urlList/urlList.json` with the following structure:

```json
[
  {
    "appName": "My Application",
    "app1": [
      {
        "api_check": [
          {
            "url": "https://api.example.com/health",
            "method": "GET",
            "frequency": 5,
            "activated": true,
            "urlShort": "health-check",
            "assertions": [
              "statusCode().equals(200)",
              "jsonBody(\"$.status\").equals(\"healthy\")"
            ]
          }
        ],
        "browser_check": [
          {
            "filePath": "/browser-scripts/login.spec.ts",
            "frequency": 10,
            "activated": true,
            "urlShort": "login-flow"
          }
        ],
        "multi_check": [
          {
            "filePath": "/multi-scripts/crud-api.spec.ts",
            "frequency": 15,
            "activated": true,
            "urlShort": "api-crud"
          }
        ]
      }
    ],
    "app2": [],
    "app3": [],
    "app4": []
  }
]
```

### Application Configuration

Each application object contains:

- **`appName`** (string, required): Application name
- **`app1`, `app2`, `app3`, `app4`** (array, required): Tier-based check organization
  - Higher tier numbers = higher priority
  - Empty arrays are valid (no checks for that tier)

### Check Types

#### API Check

```json
{
  "url": "https://api.example.com/users",
  "method": "GET|POST|PUT|DELETE|PATCH",
  "frequency": 5,
  "activated": true,
  "urlShort": "users-api",
  "assertions": ["assertion1", "assertion2"],
  "headers": [
    {"Authorization": "Bearer {{API_KEY}}"},
    {"Content-Type": "application/json"}
  ],
  "setup": "/setup-scripts/auth.js",
  "shouldFail": false
}
```

#### Browser Check

```json
{
  "filePath": "/browser-scripts/checkout.spec.ts",
  "frequency": 10,
  "activated": true,
  "urlShort": "checkout-flow"
}
```

#### Multi-Step Check

```json
{
  "filePath": "/multi-scripts/user-journey.spec.ts",
  "frequency": 15,
  "activated": true,
  "urlShort": "user-journey"
}
```

## Output Structure

Generated files in `__checkly_tf__/`:

```
__checkly_tf__/
├── main.tf                     # Provider configuration
├── variables.tf                # Input variables (API key, account ID)
├── terraform.tfvars.example    # Credentials template
├── alert_channels.tf           # 12 alert channels (email + webhooks)
├── check_groups.tf             # Check groups by app/tier
├── checks_api.tf               # All API checks
├── checks_browser.tf           # All browser checks
├── checks_multistep.tf         # All multi-step checks
├── monitors_uptime.tf          # All uptime monitors
├── dashboards.tf               # Application dashboards
├── .gitignore                  # Ignore sensitive files
└── README.md                   # Deployment instructions
```

## Supported Check Types

### 1. API Checks

HTTP/HTTPS endpoint monitoring with:
- Configurable HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Custom headers and request bodies
- Setup scripts for authentication
- Comprehensive assertions (see [Assertions](#assertions))

### 2. Browser Checks

Playwright-based browser automation:
- Full browser interaction (clicks, form fills, navigation)
- Screenshot comparison
- JavaScript execution
- Network request interception

### 3. Multi-Step Checks

Complex API workflows:
- Sequential test steps
- State sharing between steps
- API CRUD operation testing
- Integration testing

### 4. Uptime Monitors

Lightweight HTTP availability monitoring:
- Simple URL status code checks
- Lower resource usage than API checks
- Optimized for high-frequency monitoring
- STATUS_CODE assertions only (no JSON_BODY, no setup scripts)
- Ideal for basic availability checks

## Location Configuration

The tool supports flexible location configuration with **4-level precedence**:

### Precedence Hierarchy

1. **Check-level locations** (highest precedence)
2. **Tier-level locations**
3. **Global default locations**
4. **Hardcoded defaults** (backwards compatibility)

### Global Default Locations

Define default locations for all checks at the app level:

```json
{
  "appName": "Production-API",
  "globalConfig": {
    "defaultLocations": ["us-east-1", "eu-west-1"],
    "defaultFrequency": 5
  },
  "app1": [...]
}
```

All checks will use `["us-east-1", "eu-west-1"]` unless overridden.

### Tier-Level Locations

Override global defaults for a specific tier:

```json
{
  "appName": "Production-API",
  "globalConfig": {
    "defaultLocations": ["us-east-1", "eu-west-1"]
  },
  "app1": [
    {
      "locations": ["us-west-1", "ap-south-1"],
      "api_check": [...]
    }
  ]
}
```

All checks in `app1` use `["us-west-1", "ap-south-1"]`, overriding global defaults.

### Per-Check Locations

Override both tier and global locations for a specific check:

```json
{
  "api_check": [
    {
      "url": "https://api.example.com",
      "locations": ["eu-west-1"],
      "urlShort": "eu-only-check",
      ...
    }
  ]
}
```

This check only runs from `eu-west-1`, regardless of tier or global settings.

### Complete Location Example

```json
[
  {
    "appName": "Production-API",
    "globalConfig": {
      "defaultLocations": ["us-east-1", "eu-west-1"]
    },
    "app1": [
      {
        "locations": ["us-west-1", "eu-west-1", "ap-south-1"],
        "api_check": [
          {
            "url": "https://api.example.com/health",
            "locations": ["us-east-1", "eu-west-1"],
            "urlShort": "health"
            // Uses check-level: ["us-east-1", "eu-west-1"]
          }
        ],
        "browser_check": [
          {
            "filePath": "/browser-scripts/login.spec.ts",
            "urlShort": "login"
            // Uses tier-level: ["us-west-1", "eu-west-1", "ap-south-1"]
          }
        ]
      }
    ],
    "app2": [
      {
        "api_check": [
          {
            "url": "https://staging.example.com",
            "urlShort": "staging"
            // Uses global: ["us-east-1", "eu-west-1"]
          }
        ]
      }
    ]
  }
]
```

### Backwards Compatibility

If no locations are specified, the tool uses hardcoded defaults:
- API checks: `["us-east-1", "us-west-2"]`
- Browser/Multi-step checks: `["us-east-1", "us-west-2"]`
- Uptime monitors: `["us-east-1", "us-west-2"]`

Existing configurations without location fields continue to work unchanged.

## Uptime Monitor Configuration

Uptime monitors provide lightweight HTTP availability monitoring using Checkly's `checkly_url_monitor` resource.

### Basic Uptime Monitor

```json
{
  "uptime_check": [
    {
      "url": "https://example.com",
      "frequency": 1,
      "activated": true,
      "urlShort": "homepage-uptime",
      "assertions": [["statusCode().equals(200)"]]
    }
  ]
}
```

### Complete Uptime Monitor Configuration

```json
{
  "uptime_check": [
    {
      "url": "https://api.example.com",
      "frequency": 1,
      "activated": true,
      "urlShort": "api-uptime",
      "followRedirects": true,
      "skipSsl": false,
      "shouldFail": false,
      "locations": ["us-east-1", "eu-west-1", "ap-south-1"],
      "assertions": [["statusCode().equals(200)"]],
      "degradedResponseTime": 2000,
      "maxResponseTime": 5000
    }
  ]
}
```

**Note**: The `method` field is accepted in the input JSON for compatibility but is not used in the generated Terraform. The Checkly `checkly_url_monitor` resource only supports GET requests.

### Uptime Monitor Fields

- **Required**:
  - `url` (string): HTTP/HTTPS endpoint to monitor
  - `frequency` (number): Check frequency in minutes
  - `activated` (boolean): Enable/disable monitor
  - `urlShort` (string): Short identifier

- **Optional**:
  - `locations` (array): Custom locations (defaults per precedence rules)
  - `followRedirects` (boolean): Follow HTTP redirects (default: `true`)
  - `skipSsl` (boolean): Skip SSL verification (default: `false`)
  - `shouldFail` (boolean): Expect monitor to fail (default: `false`)
  - `assertions` (array): Status code assertions only
  - `degradedResponseTime` (number): Degraded threshold in ms (default: `3000`)
  - `maxResponseTime` (number): Max response time in ms (default: `5000`)
  - ~~`method` (string)~~: Not supported - Checkly URL monitors only support GET requests

### Uptime Monitor Limitations

⚠️ **Important**: Uptime monitors only support STATUS_CODE assertions:

**✅ Valid**:
```json
"assertions": [["statusCode().equals(200)"]]
```

**❌ Invalid**:
```json
"assertions": [["jsonBody('$.status').equals('ok')"]]  // Not supported
```

No setup scripts, request headers, or body content are supported for uptime monitors. For complex checks, use API checks instead.

### When to Use Uptime Monitors vs API Checks

**Use Uptime Monitors** for:
- Simple availability checks
- High-frequency monitoring (every minute)
- Basic status code validation
- Cost-effective monitoring at scale

**Use API Checks** for:
- Complex assertions (JSON body, headers, text)
- Authentication requirements
- Setup scripts or request customization
- Response payload validation

## Assertions

API checks support comprehensive assertions using method chaining:

### Status Code

```javascript
statusCode().equals(200)
statusCode().notEquals(500)
```

### JSON Body

```javascript
jsonBody("$.status").equals("success")
jsonBody("$.items[0].price").greaterThan(10)
jsonBody("$.data").hasKey("id")
jsonBody("$.errors").isEmpty()
```

### Headers

```javascript
headers("Content-Type").equals("application/json")
headers("X-Custom").contains("Bearer")
headers("Cache-Control").notEmpty()
```

### Text Body

```javascript
textBody().contains("success")
textBody().notContains("error")
textBody().notEmpty()
```

### Response Time

```javascript
responseTime().lessThan(1000)
responseTime().greaterThan(100)
```

### Supported Comparison Methods

- `equals(value)` - Exact match
- `notEquals(value)` - Not equal
- `contains(value)` - Contains substring
- `notContains(value)` - Does not contain
- `greaterThan(value)` - Greater than (numeric)
- `lessThan(value)` - Less than (numeric)
- `hasKey(key)` - Object has key
- `hasValue(value)` - Object has value
- `isEmpty()` - Empty value
- `notEmpty()` - Not empty
- `isNull()` - Is null
- `notNull()` - Not null

## Alert Channels

The tool automatically creates 12 alert channels:

### Email Channels (4)
- Tier 1: `1john.doe@gmail.com`
- Tier 2: `2john.doe@gmail.com`
- Tier 3: `3john.doe@gmail.com`
- Tier 4: `4john.doe@gmail.com`

### ServiceNow Webhooks (4)
- One per tier
- POST to ServiceNow incident API
- Customizable template per tier

### MS Teams Webhooks (4)
- One per tier
- Adaptive card format
- Includes check details and result link

All alert channels are automatically subscribed to all check groups.

## Troubleshooting

### Common Issues

#### 1. File Not Found Errors

**Error**: `Script file not found: /path/to/script.spec.ts`

**Solution**:
- Verify script path in `urlList.json` starts with `/`
- Ensure file exists in `src/browser-scripts/` or `src/multi-scripts/`
- Check file name spelling and extension

#### 2. JSON Parsing Errors

**Error**: `Invalid JSON syntax in urlList.json`

**Solution**:
- Validate JSON syntax using a JSON validator
- Check for missing commas between objects
- Verify all strings use double quotes
- Ensure brackets are properly closed

#### 3. Schema Validation Errors

**Error**: `Application #1: appName must be a string`

**Solution**:
- Check all required fields are present
- Verify field types match the schema
- Ensure tiers (app1-app4) are arrays

#### 4. Terraform Validation Errors

**Error**: `terraform validate` fails

**Solution**:
```bash
# Re-generate configuration
cd ..
npx ts-node src/generate_terraform.ts

# Re-initialize Terraform
cd __checkly_tf__
rm -rf .terraform .terraform.lock.hcl
terraform init
terraform validate
```

#### 5. Empty Scripts

**Warning**: `Script file is empty: /path/to/script.spec.ts`

**Solution**:
- Add Playwright test code to the script file
- Or remove the check from `urlList.json` if not needed

#### 6. Duplicate Resource IDs

**Error**: Multiple resources with the same ID

**Solution**:
- Ensure `urlShort` values are unique within each tier
- Check for duplicate check definitions
- Regenerate configuration after fixing

### Debug Mode

For verbose output, set the `DEBUG` environment variable:

```bash
DEBUG=* npx ts-node src/generate_terraform.ts
```

### Validation Checklist

Before deploying:

- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes
- [ ] `terraform init` succeeds
- [ ] `terraform validate` succeeds
- [ ] `terraform plan` shows expected resources
- [ ] No duplicate resource IDs
- [ ] All script files exist
- [ ] `terraform.tfvars` contains valid credentials

## Examples

### Example 1: Simple API Health Check

**urlList.json:**
```json
[
  {
    "appName": "My API",
    "app1": [
      {
        "api_check": [
          {
            "url": "https://api.example.com/health",
            "method": "GET",
            "frequency": 5,
            "activated": true,
            "urlShort": "health",
            "assertions": [
              "statusCode().equals(200)",
              "jsonBody(\"$.status\").equals(\"ok\")"
            ]
          }
        ]
      }
    ],
    "app2": [],
    "app3": [],
    "app4": []
  }
]
```

**Generated**: 1 API check, 1 check group, 1 dashboard, 12 alert channels

### Example 2: Multi-Tier Application

**urlList.json:**
```json
[
  {
    "appName": "E-Commerce",
    "app1": [
      {
        "api_check": [
          {
            "url": "https://api.shop.com/products",
            "method": "GET",
            "frequency": 5,
            "activated": true,
            "urlShort": "products",
            "assertions": ["statusCode().equals(200)"]
          }
        ],
        "browser_check": [
          {
            "filePath": "/browser-scripts/checkout.spec.ts",
            "frequency": 10,
            "activated": true,
            "urlShort": "checkout"
          }
        ]
      }
    ],
    "app2": [
      {
        "api_check": [
          {
            "url": "https://api.shop.com/orders",
            "method": "GET",
            "frequency": 10,
            "activated": true,
            "urlShort": "orders",
            "assertions": ["statusCode().equals(200)"]
          }
        ]
      }
    ],
    "app3": [],
    "app4": []
  }
]
```

**Generated**: 3 checks across 2 tiers, 2 check groups, 1 dashboard, 12 alert channels

### Example 3: Authenticated API with Custom Headers

**urlList.json:**
```json
[
  {
    "appName": "Secure API",
    "app1": [
      {
        "api_check": [
          {
            "url": "https://api.secure.com/user",
            "method": "GET",
            "frequency": 5,
            "activated": true,
            "urlShort": "user-profile",
            "headers": [
              {"Authorization": "Bearer {{API_TOKEN}}"},
              {"X-API-Version": "v2"}
            ],
            "assertions": [
              "statusCode().equals(200)",
              "jsonBody(\"$.data.email\").notEmpty()",
              "headers(\"Content-Type\").equals(\"application/json\")"
            ]
          }
        ]
      }
    ],
    "app2": [],
    "app3": [],
    "app4": []
  }
]
```

**Generated**: 1 authenticated API check with custom headers

## Architecture

### Module Structure

```
src/
├── generate_terraform.ts       # Main orchestrator
├── parsers/
│   ├── json-parser.ts          # Parse & validate urlList.json
│   ├── assertion-parser.ts     # Parse assertion strings
│   └── script-loader.ts        # Load Playwright scripts
├── transformers/
│   ├── api-check-transformer.ts
│   ├── browser-check-transformer.ts
│   ├── multi-check-transformer.ts
│   ├── check-group-transformer.ts
│   ├── dashboard-transformer.ts
│   └── alert-channel-transformer.ts
├── generators/
│   ├── resource-id-generator.ts # Generate unique IDs
│   ├── hcl-generator.ts        # Convert to HCL syntax
│   └── file-organizer.ts       # Organize by file
├── writers/
│   └── file-writer.ts          # Write files to disk
├── types/
│   ├── urlList.types.ts        # Input schema types
│   ├── terraform.types.ts      # Terraform resource types
│   └── config.types.ts         # Configuration types
└── utils/
    ├── sanitize.ts             # String sanitization
    ├── logger.ts               # Logging utilities
    └── validation.ts           # Validation helpers
```

### Data Flow

1. **Parse** `urlList.json` → `AppConfig[]`
2. **Transform** each app → Terraform resources
3. **Generate** HCL syntax for each resource
4. **Organize** resources by target file
5. **Write** files to `__checkly_tf__/`

## Testing

Run the test suite:

```bash
npm test
```

Run specific test file:

```bash
npm test -- hcl-generator.test.ts
```

Test coverage:
- 102 tests passing
- Coverage: parsers, generators, transformers
- Edge cases: empty values, special characters, nested structures

## Contributing

This is an internal tool. For bugs or feature requests, contact the team.

## License

Internal use only.
