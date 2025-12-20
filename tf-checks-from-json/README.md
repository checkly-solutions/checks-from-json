# Terraform Checks from JSON

A TypeScript tool that converts JSON configuration files into Checkly Terraform provider resources. This tool reads a structured JSON file describing monitoring checks and generates complete, ready-to-use Terraform HCL files for the Checkly platform.

## Overview

This project mirrors the architecture of the CLI reference implementation (`cli-checks-from-json/`) but outputs Terraform files instead of Checkly CLI/JavaScript check definitions. It enables infrastructure-as-code workflows for Checkly monitoring by transforming declarative JSON configurations into Terraform resources.

## What It Does

The tool processes `urlList.json` and generates:

- **Terraform Boilerplate**: `terraform.tf`, `variables.tf`, `provider.tf`
- **Alert Channels**: All 7 Checkly alert channel types (Email, SMS, Slack, PagerDuty, Opsgenie, Webhook, Phone Call)
- **Check Groups**: Organized by application and tier with alert channel subscriptions
- **Monitoring Checks**: API checks, browser checks, and multi-step checks
- **Dashboards**: Per-application monitoring dashboards
- **Dynamic Variables**: Automatically generates Terraform variables for sensitive alert channel values

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
- **api_check**: HTTP API endpoint checks
- **multi_check**: Multi-step API workflow checks

## Alert Channels

All alert channel configuration is defined in the `alertChannels` array at the top level of the JSON file. The tool supports all 7 Checkly alert channel types.

### Variable References

Use the `"var:variable_name"` pattern to reference Terraform variables for sensitive values:

- **Variable Reference**: `"var:email_address"` → generates `var.email_address` in HCL
- **Literal Value**: `"#slack-channel"` → generates `"#slack-channel"` in HCL

The tool automatically:
1. Scans all alert channel configurations for `var:*` references
2. Generates corresponding Terraform variable definitions in `variables.tf`
3. Marks all variables as `sensitive = true`

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
│   │   ├── sanitizeResourceId.ts    # Resource ID sanitization
│   │   ├── parseAssertions.ts       # Parse assertion strings
│   │   ├── assertionMapper.ts       # Map assertions to Terraform
│   │   ├── formatHCL.ts            # HCL formatting utilities
│   │   ├── fileUtils.ts            # File I/O operations
│   │   ├── variableResolver.ts     # Variable reference parsing (var:name → var.name)
│   │   └── validation.ts           # Alert channel validation logic
│   ├── config/
│   │   └── constants.ts            # Configuration constants
│   ├── generators/
│   │   ├── generateBoilerplate.ts       # Terraform boilerplate with dynamic variables
│   │   ├── generateAlertChannels.ts     # All 7 alert channel types
│   │   ├── generateGroup.ts            # Check groups with alert subscriptions
│   │   ├── generateAPICheck.ts         # API checks
│   │   ├── generateBrowserCheck.ts     # Browser checks
│   │   ├── generateMultiStepCheck.ts   # Multi-step checks
│   │   └── generateDashboard.ts        # Dashboards
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

## License

ISC

## Contributing

When contributing:

1. Follow the existing modular architecture
2. Add type definitions for new structures
3. Document new generators and utilities
4. Test with sample JSON configurations
5. Run TypeScript type checking before committing
