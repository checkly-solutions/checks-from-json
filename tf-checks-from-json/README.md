# Terraform Checks from JSON

A TypeScript tool that converts JSON configuration files into Checkly Terraform provider resources. This tool reads a structured JSON file describing monitoring checks and generates complete, ready-to-use Terraform HCL files for the Checkly platform.

## Overview

This project mirrors the architecture of the CLI reference implementation (`cli-checks-from-json/`) but outputs Terraform files instead of Checkly CLI/JavaScript check definitions. It enables infrastructure-as-code workflows for Checkly monitoring by transforming declarative JSON configurations into Terraform resources.

## What It Does

The tool processes `urlList.json` and generates:

- **Terraform Boilerplate**: `terraform.tf`, `variables.tf`, `provider.tf`
- **Alert Channels**: All 7 Checkly alert channel types (Email, SMS, Slack, PagerDuty, Opsgenie, Webhook, Phone Call)
- **Check Groups**: Organized by application and tier with alert channel subscriptions
- **Monitoring Checks**: API checks, browser checks, multi-step checks, URL monitors, TCP monitors, DNS monitors, and heartbeat monitors
- **Global Resources**: Global environment variables and reusable code snippets
- **Dashboards**: Per-application monitoring dashboards with comprehensive configuration
- **Dynamic Variables**: Automatically generates Terraform variables for all `var:` references across the entire configuration

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Terraform (v1.0 or higher) for applying the generated files
- Checkly account with API credentials

## Installation

```bash
# From the project root
cd tf-checks-from-json

# Install dependencies
npm install
```

## Usage

### Example Project Files
* Full Coverage Example:
  * [src/urlList/urlList-full-coverage.json](src/urlList/urlList-full-coverage.json) - See [Full Coverage Readme](src/urlList/README-FULL-COVERAGE.md)
* Checkly Docs Example:
  * [src/urlList/checkly-docs-example.json](src/urlList/checkly-docs-example.json) - Simple setup to monitor the Checkly docs as of Dec 21, 2025.
* Generic, Simple Example:
  * [src/urlList/urlList.json](src/urlList/urlList.json) - Simple example

### Generate Terraform Files

```bash
# From tf-checks-from-json directory
npx ts-node dynamic-json.check.tf.ts
```

This will:
1. Read `src/urlList/urlList.json`
2. Generate Terraform files in `__tf_checks__/`
3. Organize files by application name

### Apply with Terraform

```bash
# Navigate to generated files
cd __tf_checks__

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Set Checkly credentials and alert channel variables
export TF_VAR_checkly_api_key="your_api_key"
export TF_VAR_checkly_account_id="your_account_id"
export TF_VAR_email_tier_1="alerts@example.com"
export TF_VAR_slack_webhook_url="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
export TF_VAR_pagerduty_service_key="your_pagerduty_key"

# Or use a terraform.tfvars file (recommended for multiple variables)
cat > terraform.tfvars <<EOF
checkly_api_key    = "your_api_key"
checkly_account_id = "your_account_id"
email_tier_1       = "alerts@example.com"
slack_webhook_url  = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
pagerduty_service_key = "your_pagerduty_key"
EOF

# Review planned changes
terraform plan

# Apply the configuration
terraform apply
```

## Input Format

The tool expects `src/urlList/urlList.json` with this structure:

```json
{
  "alertChannels": [
    {
      "id": "email_tier_1",
      "type": "email",
      "config": {
        "address": "var:email_tier_1"
      },
      "send_recovery": true,
      "send_failure": true,
      "send_degraded": false,
      "ssl_expiry": true,
      "ssl_expiry_threshold": 30
    },
    {
      "id": "slack_critical",
      "type": "slack",
      "config": {
        "channel": "#checkly-alerts",
        "url": "var:slack_webhook_url"
      },
      "send_recovery": true,
      "send_failure": true,
      "send_degraded": true
    },
    {
      "id": "pagerduty_oncall",
      "type": "pagerduty",
      "config": {
        "service_key": "var:pagerduty_service_key",
        "account": "MyCompany",
        "service_name": "Checkly Monitoring"
      }
    }
  ],
  "apps": [
    {
      "appName": "Env-Observability",
      "tiers": {
        "app1": {
          "alertChannel": "email_tier_1",
          "checks": [
            {
              "browser_check": [
                {
                  "filePath": "/browser-scripts/visit.spec.ts",
                  "frequency": 5,
                  "activated": true,
                  "urlShort": "app-userflow"
                }
              ],
              "api_check": [
                {
                  "url": "https://api.example.com/endpoint",
                  "activated": true,
                  "method": "GET",
                  "frequency": 5,
                  "setup": "",
                  "assertions": [["statusCode().equals(200)"]],
                  "urlShort": "service-1"
                }
              ],
              "multi_check": [
                {
                  "filePath": "/multi-scripts/multi-CRUD.spec.ts",
                  "frequency": 5,
                  "activated": true,
                  "urlShort": "service-2"
                }
              ]
            }
          ]
        }
      }
    }
  ]
}
```

### JSON Schema

#### Root Structure
- **alertChannels**: Array of alert channel definitions (see [Alert Channels](#alert-channels) section)
- **apps**: Array of application configurations

#### Application Schema
- **appName**: Application identifier (used for grouping)
- **tiers**: Object with arbitrary tier names as keys (e.g., "production", "staging", "app1")
  - **alertChannel**: Reference to an alert channel ID defined in `alertChannels`
  - **checks**: Array of check categories

#### Check Types
- **browser_check**: Playwright browser checks
- **api_check**: HTTP API endpoint checks with assertions
- **multi_check**: Multi-step API workflow checks
- **url_monitor**: Simple HTTP uptime monitoring
- **tcp_monitor**: TCP port connectivity monitoring
- **dns_monitor**: DNS resolution and record validation monitoring
- **heartbeat_monitor**: Cron job and background service monitoring (via inbound pings)

## API Check Assertions

API checks support **two assertion formats**: object-based (recommended) and CLI string-based (legacy). Both generate identical Terraform resources.

### Object-Based Assertions (Recommended)

The modern, structured format with better readability and IDE support:

```json
{
  "url": "https://api.example.com/health",
  "method": "GET",
  "assertions": [
    {
      "statusCode": {
        "lessThan": 400
      }
    },
    {
      "jsonBody": {
        "hasKey": "status"
      }
    },
    {
      "jsonBody": {
        "equals": "healthy",
        "property": "status"
      }
    }
  ]
}
```

### CLI String-Based Assertions (Legacy)

The original format using method chaining syntax:

```json
{
  "url": "https://api.example.com/health",
  "method": "GET",
  "assertions": [
    ["statusCode().lessThan(400)"],
    ["jsonBody().hasKey('status')"],
    ["jsonBody('status').equals('healthy')"]
  ]
}
```

Both formats generate the same Terraform HCL:

```hcl
assertion {
  source     = "STATUS_CODE"
  comparison = "LESS_THAN"
  target     = "400"
}

assertion {
  source     = "JSON_BODY"
  comparison = "HAS_KEY"
  target     = "status"
}

assertion {
  source     = "JSON_BODY"
  property   = "status"
  comparison = "EQUALS"
  target     = "healthy"
}
```

### Supported Assertion Sources

- **statusCode**: HTTP response status code
- **jsonBody**: JSON response body (with optional `property` for JSON path)
- **textBody**: Plain text response body
- **headers**: HTTP response headers
- **responseTime**: Response time in milliseconds

### Supported Assertion Comparisons

- **equals**, **notEquals**: Exact equality
- **contains**, **notContains**: String/array containment
- **greaterThan**, **lessThan**: Numeric comparison
- **greaterThanOrEqual**, **lessThanOrEqual**: Numeric comparison with equality
- **hasKey**, **notHasKey**: Object property existence (for JSON bodies)
- **hasValue**, **notHasValue**: Array/object value existence
- **isEmpty**, **notEmpty**: Empty check for strings/arrays/objects
- **isNull**, **notNull**: Null value check

### Assertion Examples

```json
// Status code validation
{ "statusCode": { "equals": 200 } }
{ "statusCode": { "lessThan": 400 } }

// JSON body validation
{ "jsonBody": { "hasKey": "data" } }
{ "jsonBody": { "equals": "success", "property": "status" } }
{ "jsonBody": { "contains": "user", "property": "data.name" } }

// Header validation
{ "headers": { "hasKey": "Content-Type" } }
{ "headers": { "contains": "application/json", "property": "Content-Type" } }

// Response time validation
{ "responseTime": { "lessThan": 1000 } }

// Text body validation
{ "textBody": { "contains": "Welcome" } }
```

## Alert Channels

All alert channel configuration is defined in the `alertChannels` array at the top level of the JSON file. The tool supports all 7 Checkly alert channel types.

### Variable References

Use the `"var:variable_name"` pattern to reference Terraform variables for sensitive values anywhere in your configuration:

- **Variable Reference**: `"var:email_address"` → generates `var.email_address` in HCL
- **Literal Value**: `"#slack-channel"` → generates `"#slack-channel"` in HCL

The tool automatically:
1. **Comprehensively scans** for `var:*` references in:
   - Alert channel configurations
   - Global environment variables
   - Tier-level environment variables
   - Tier-level API check defaults (headers, query_parameters, basic_auth)
   - Check-level headers, query_parameters, basic_auth
   - Check-level environment variables
2. **Generates** corresponding Terraform variable definitions in `variables.tf`
3. **Marks** all variables as `sensitive = true` to hide values in Terraform output
4. **Deduplicates** variable names (same variable can be referenced multiple times)

**Example**: A variable `var:api_key` used in both a global environment variable and an API check header will generate a single variable definition:

```hcl
variable "api_key" {
  type        = string
  description = "Dynamically generated from var:api_key reference"
  sensitive   = true
}
```

### Supported Channel Types

#### 1. Email

```json
{
  "id": "email_alerts",
  "type": "email",
  "config": {
    "address": "var:alert_email"
  },
  "send_recovery": true,
  "send_failure": true,
  "send_degraded": false,
  "ssl_expiry": true,
  "ssl_expiry_threshold": 14
}
```

**Config fields:**
- `address` (required): Email address or `var:variable_name`
- `ssl_expiry` (optional, default: false): Send SSL certificate expiry alerts
- `ssl_expiry_threshold` (optional, 1-30, default: 30): Days before expiry to alert

#### 2. Slack

```json
{
  "id": "slack_incidents",
  "type": "slack",
  "config": {
    "channel": "#incidents",
    "url": "var:slack_webhook_url"
  }
}
```

**Config fields:**
- `channel` (required): Slack channel name (e.g., "#alerts")
- `url` (required): Slack webhook URL or `var:variable_name`

#### 3. PagerDuty

```json
{
  "id": "pagerduty_oncall",
  "type": "pagerduty",
  "config": {
    "service_key": "var:pagerduty_service_key",
    "account": "MyCompany",
    "service_name": "Production Alerts"
  }
}
```

**Config fields:**
- `service_key` (required): PagerDuty integration key or `var:variable_name`
- `account` (optional): PagerDuty account name
- `service_name` (optional): Service display name

#### 4. SMS

```json
{
  "id": "sms_oncall",
  "type": "sms",
  "config": {
    "name": "On-Call Team",
    "number": "var:oncall_phone"
  }
}
```

**Config fields:**
- `name` (required): Display name for this SMS channel
- `number` (required): Phone number in international format or `var:variable_name`

#### 5. Opsgenie

```json
{
  "id": "opsgenie_team",
  "type": "opsgenie",
  "config": {
    "name": "Team Alpha",
    "api_key": "var:opsgenie_api_key",
    "region": "US",
    "priority": "P1"
  }
}
```

**Config fields:**
- `name` (required): Channel name
- `api_key` (required): Opsgenie API key or `var:variable_name`
- `region` (required): Region code (e.g., "US", "EU")
- `priority` (required): Alert priority level

#### 6. Webhook

```json
{
  "id": "webhook_custom",
  "type": "webhook",
  "config": {
    "name": "Custom Integration",
    "url": "var:webhook_url",
    "method": "POST",
    "headers": {
      "Authorization": "var:webhook_token",
      "Content-Type": "application/json"
    },
    "template": "{\"alert\": \"{{ALERT_TITLE}}\", \"time\": \"{{STARTED_AT}}\"}"
  }
}
```

**Config fields:**
- `name` (required): Webhook name
- `url` (required): Webhook endpoint URL or `var:variable_name`
- `method` (optional, default: POST): HTTP method (GET, POST, PUT, DELETE, PATCH)
- `headers` (optional): Custom HTTP headers (values can be `var:variable_name`)
- `template` (optional): Custom JSON payload with Checkly placeholders
- `webhook_secret` (optional): Webhook authentication secret or `var:variable_name`
- `webhook_type` (optional): Specialized integration type (WEBHOOK_DISCORD, WEBHOOK_MSTEAMS, etc.)
- `query_parameters` (optional): Query parameters as key-value pairs

**Available template variables:** `{{ALERT_TITLE}}`, `{{RESULT_LINK}}`, `{{CHECK_ID}}`, `{{CHECK_TYPE}}`, `{{ALERT_TYPE}}`, `{{STARTED_AT}}`, `{{CHECK_RESULT_ID}}`

#### 7. Phone Call

```json
{
  "id": "call_oncall",
  "type": "call",
  "config": {
    "name": "On-Call Manager",
    "number": "var:manager_phone"
  }
}
```

**Config fields:**
- `name` (required): Display name for this phone call channel
- `number` (required): Phone number in international format or `var:variable_name`

### Common Settings (All Channel Types)

These optional settings apply to all channel types:

- `send_recovery` (optional, default: true): Send alert when check recovers
- `send_failure` (optional, default: true): Send alert when check fails
- `send_degraded` (optional, default: false): Send alert when check is degraded

## Output Structure

```
__tf_checks__/
├── terraform.tf          # Terraform settings and required providers
├── variables.tf          # Input variables (dynamically generated)
├── provider.tf          # Checkly provider configuration
├── alert-channels.tf    # Alert channel resources (all types)
└── <app-name>/          # Per-application directory
    ├── dashboard.tf     # Application dashboard
    ├── groups.tf        # Check groups with alert subscriptions
    └── checks.tf        # All checks for this application
```

### Generated Files

**variables.tf** - Contains:
- Checkly API credentials (`checkly_api_key`, `checkly_account_id`)
- Dynamically generated variables for each `var:*` reference in alert channels
- All alert channel variables marked as `sensitive = true`

**alert-channels.tf** - Contains:
- All alert channel resources from the `alertChannels` array
- Proper HCL syntax with variable references or literal values
- Type-specific configuration blocks (email, slack, webhook, etc.)

**groups.tf** - Contains:
- Check group resources with `alert_channel_subscription` blocks
- References to alert channels defined in `alert-channels.tf`

## Configuration Validation

The tool performs **comprehensive validation** before generating Terraform to ensure configurations comply with Checkly Terraform provider constraints.

### Validated Constraints

#### Frequency Values
Check frequency must be one of these minute intervals:
- `0` (on-demand, requires `frequency_offset`)
- `1, 2, 5, 10, 15, 30` (high frequency)
- `60, 120, 180, 360, 720, 1440` (hourly to daily)

#### Response Time Thresholds
- **API/Browser/Multi-step checks**: 0-30000 ms (30 seconds max)
- **URL monitors**: 0-30000 ms (30 seconds max)
- **TCP monitors**: 0-5000 ms (5 seconds max)
- **DNS monitors**: 0-5000 ms (5 seconds max)
- **Constraint**: `degraded_response_time` must be less than `max_response_time`

#### Alert Settings
- **escalation_type**: Must be `RUN_BASED` or `TIME_BASED`
- **failed_run_threshold**: 1-5 runs
- **minutes_failing_threshold**: 5, 10, 15, or 30 minutes
- **reminder.amount**: 0-5 or 100000 (unlimited)
- **reminder.interval**: 5, 10, 15, or 30 minutes
- **parallel_run_failure_threshold.percentage**: 10-100 in increments of 10

#### Retry Strategy
- **type**: `FIXED`, `LINEAR`, `EXPONENTIAL`, `SINGLE_RETRY`, or `NO_RETRIES`
- **max_retries**: 1-10
- **max_duration_seconds**: 0-600 (10 minutes max)
- **base_backoff_seconds**: Must be >= 0

#### SSL Expiry (Email Only)
- **ssl_expiry_threshold**: 1-30 days

#### Environment Variables
- **key**: Must start with letter or underscore, contain only alphanumeric + underscores
- **value**: Cannot be empty (unless using `var:` reference)

### Validation Error Messages

The tool provides **clear, actionable error messages** when validation fails:

```
API Check "api-health": Invalid frequency 3. Must be one of: 0, 1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440

TCP Monitor "database": max_response_time must be 0-5000ms, got 10000

DNS Monitor "resolver": degraded_response_time (3000) cannot exceed max_response_time (2000)

Browser Check "user-flow": environment variable "123_VAR" has invalid key. Keys must start with a letter or underscore.
```

All validation occurs **before** any Terraform files are written, preventing invalid configurations from being generated.

## Project Structure

```
tf-checks-from-json/
├── dynamic-json.check.tf.ts    # Main entry point and orchestrator
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript configuration
├── src/
│   ├── types/
│   │   ├── json-types.ts       # Input JSON type definitions (RootConfig, AlertChannelDefinition, etc.)
│   │   └── terraform-types.ts  # Terraform resource type definitions
│   ├── utils/
│   │   ├── sanitizeResourceId.ts     # Resource ID sanitization
│   │   ├── parseAssertions.ts        # Parse CLI string-based assertions
│   │   ├── parseAssertionsObject.ts  # Parse object-based assertions (NEW)
│   │   ├── assertionMapper.ts        # Map CLI assertions to Terraform
│   │   ├── formatHCL.ts              # HCL formatting utilities
│   │   ├── fileUtils.ts              # File I/O operations
│   │   ├── variableResolver.ts       # Comprehensive variable reference parsing
│   │   ├── hclBlockGenerators.ts     # Reusable HCL block generators
│   │   └── validation.ts             # Configuration validation logic
│   ├── config/
│   │   └── constants.ts            # Configuration constants
│   ├── generators/
│   │   ├── generateBoilerplate.ts        # Terraform boilerplate with dynamic variables
│   │   ├── generateAlertChannels.ts      # All 7 alert channel types
│   │   ├── generateGroup.ts              # Check groups with alert subscriptions
│   │   ├── generateAPICheck.ts           # API checks with assertions
│   │   ├── generateBrowserCheck.ts       # Browser checks (Playwright)
│   │   ├── generateMultiStepCheck.ts     # Multi-step checks (API workflows)
│   │   ├── generateUrlMonitor.ts         # URL monitors (simple uptime)
│   │   ├── generateTcpMonitor.ts         # TCP monitors (port connectivity)
│   │   ├── generateDnsMonitor.ts         # DNS monitors (resolution)
│   │   ├── generateHeartbeatMonitor.ts   # Heartbeat monitors (cron jobs)
│   │   ├── generateDashboard.ts          # Dashboards
│   │   ├── generateSnippets.ts           # Reusable code snippets
│   │   └── generateGlobalEnvVars.ts      # Global environment variables
│   └── urlList/
│       └── urlList.json        # Input configuration file
└── __tf_checks__/              # Generated output directory
```

## Architecture

The tool follows a modular generator pattern:

1. **Main Orchestrator** (`dynamic-json.check.tf.ts`): Coordinates the generation process
2. **Type Definitions**: Strong TypeScript typing for JSON input and Terraform output
3. **Utilities**: Reusable helpers for sanitization, parsing, and formatting
4. **Generators**: Specialized functions for each Terraform resource type
5. **Strategy Pattern**: Maps check types to their respective generator functions

## Development

### Type Checking

```bash
npx tsc --noEmit
```

### Adding New Check Types

1. Add type definition to `src/types/json-types.ts`
2. Create generator in `src/generators/generate<Type>.ts`
3. Register generator in the `checkCreators` mapping in `dynamic-json.check.tf.ts`

### Adding New Assertions

Update `src/utils/assertionMapper.ts` to map new assertion formats to Checkly Terraform assertion blocks.

### Adding New Alert Channel Types

If Checkly adds new alert channel types in the future:

1. Add channel config interface to `src/types/json-types.ts`
2. Update `AlertChannelDefinition` type union
3. Add validation function in `src/utils/validation.ts`
4. Create generator function in `src/generators/generateAlertChannels.ts`
5. Register in the generators map

## Key Features

- **Type-Safe**: Full TypeScript type definitions for input and output
- **All Alert Channel Types**: Support for Email, SMS, Slack, PagerDuty, Opsgenie, Webhook, and Phone Call
- **Variable Management**: Automatic detection and generation of Terraform variables from `var:*` references
- **Secure by Default**: All alert channel variables marked as `sensitive = true`
- **Flexible Configuration**: Mix literal values and variable references in the same channel
- **Validated Input**: Comprehensive validation of alert channel definitions before generation
- **Modular**: Easy to extend with new check types or resources
- **Organized Output**: Structured by application and resource type
- **Resource Sanitization**: Automatic conversion of names to Terraform-safe IDs
- **Assertion Mapping**: Intelligent parsing of Checkly assertion syntax
- **Arbitrary Tiers**: Use any tier naming scheme (not limited to app1-app4)

## Limitations

- Browser check scripts must exist in the referenced `filePath`
- Multi-step check scripts must exist in the referenced `filePath`
- Dashboard tags and widgets are minimal (can be extended)
- Alert channel webhook templates are passed as-is (no validation of Checkly placeholders)

## Reference Implementation

This tool mirrors the structure of `cli-checks-from-json/` (Checkly CLI implementation). Key differences:

- **Output**: Terraform HCL instead of JavaScript/TypeScript
- **Provider**: Uses Checkly Terraform provider resources
- **Structure**: Groups resources by application in separate directories

## Related Documentation

- **Checkly Terraform Provider**: See `_kb/checkly_tf_docs/` for resource documentation
- **Checkly Platform**: See `_kb/checkly_docs/` for platform concepts
- **CLI Reference**: See `cli-checks-from-json/` for original implementation

## Troubleshooting

### "JSON file not found" Error

Ensure `src/urlList/urlList.json` exists with valid JSON structure.

### Terraform Validation Errors

- Check that generated resource IDs are unique
- Verify that all referenced alert channels exist in the `alertChannels` array
- Ensure script file paths are valid (for browser/multi-step checks)
- Confirm all `var:*` references have corresponding environment variables or tfvars entries

### Alert Channel Validation Errors

Common validation errors and solutions:

- **"Duplicate alert channel ID"**: Each channel must have a unique `id`
- **"Tier references undefined alert channel"**: Ensure `alertChannel` value matches a channel `id`
- **"Missing required field"**: Check that all required config fields are present for the channel type
- **"ssl_expiry settings only supported for email"**: SSL settings only apply to email channels
- **"ssl_expiry_threshold must be between 1 and 30"**: Use a valid threshold value
- **"Malformed variable reference"**: Ensure format is `"var:variable_name"` (not just `"var:"`)

### TypeScript Compilation Errors

Run `npx tsc --noEmit` to see detailed type errors.

## Contributing

When contributing:

1. Follow the existing modular architecture
2. Add type definitions for new structures
3. Document new generators and utilities
4. Test with sample JSON configurations
5. Run TypeScript type checking before committing
