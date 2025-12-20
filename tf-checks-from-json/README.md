# Terraform Checks from JSON

A TypeScript tool that converts JSON configuration files into Checkly Terraform provider resources. This tool reads a structured JSON file describing monitoring checks and generates complete, ready-to-use Terraform HCL files for the Checkly platform.

## Overview

This project mirrors the architecture of the CLI reference implementation (`cli-checks-from-json/`) but outputs Terraform files instead of Checkly CLI/JavaScript check definitions. It enables infrastructure-as-code workflows for Checkly monitoring by transforming declarative JSON configurations into Terraform resources.

## What It Does

The tool processes `urlList.json` and generates:

- **Terraform Boilerplate**: `terraform.tf`, `variables.tf`, `provider.tf`
- **Alert Channels**: Email, Slack, and other notification configurations
- **Check Groups**: Organized by application and tier (app1, app2, app3, app4)
- **Monitoring Checks**: API checks, browser checks, and multi-step checks
- **Dashboards**: Per-application monitoring dashboards

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

# Set Checkly credentials
export TF_VAR_checkly_api_key="your_api_key"
export TF_VAR_checkly_account_id="your_account_id"

# Review planned changes
terraform plan

# Apply the configuration
terraform apply
```

## Input Format

The tool expects `src/urlList/urlList.json` with this structure:

```json
[
  {
    "appName": "Env-Observability",
    "app1": [
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
    ],
    "app2": [],
    "app3": [],
    "app4": []
  }
]
```

### JSON Schema

- **appName**: Application identifier (used for grouping)
- **app1/app2/app3/app4**: Tier-based check categories (processed in reverse order: app4 → app1)
- **browser_check**: Playwright browser checks
- **api_check**: HTTP API endpoint checks
- **multi_check**: Multi-step API workflow checks

## Output Structure

```
__tf_checks__/
├── terraform.tf          # Terraform settings and required providers
├── variables.tf          # Input variables (API key, account ID)
├── provider.tf          # Checkly provider configuration
├── alert_channels.tf    # Alert channel resources
└── <app-name>/          # Per-application directory
    ├── dashboard.tf     # Application dashboard
    ├── groups.tf        # Check groups (one per tier)
    └── checks.tf        # All checks for this application
```

## Project Structure

```
tf-checks-from-json/
├── dynamic-json.check.tf.ts    # Main entry point
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript configuration
├── src/
│   ├── types/
│   │   ├── json-types.ts       # Input JSON type definitions
│   │   └── terraform-types.ts  # Terraform resource type definitions
│   ├── utils/
│   │   ├── sanitizeResourceId.ts    # Resource ID sanitization
│   │   ├── parseAssertions.ts       # Parse assertion strings
│   │   ├── assertionMapper.ts       # Map assertions to Terraform
│   │   ├── formatHCL.ts            # HCL formatting utilities
│   │   └── fileUtils.ts            # File I/O operations
│   ├── config/
│   │   └── constants.ts            # Configuration constants
│   ├── generators/
│   │   ├── generateBoilerplate.ts       # Terraform boilerplate
│   │   ├── generateAlertChannels.ts     # Alert channels
│   │   ├── generateGroup.ts            # Check groups
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
3. Register generator in the `checkCreators` mapping (dynamic-json.check.tf.ts:92-103)

### Adding New Assertions

Update `src/utils/assertionMapper.ts` to map new assertion formats to Checkly Terraform assertion blocks.

## Key Features

- **Type-Safe**: Full TypeScript type definitions for input and output
- **Modular**: Easy to extend with new check types or resources
- **Organized Output**: Structured by application and resource type
- **Resource Sanitization**: Automatic conversion of names to Terraform-safe IDs
- **Assertion Mapping**: Intelligent parsing of Checkly assertion syntax
- **Tier Ordering**: Processes tiers in correct order (app4 → app1)

## Limitations

- Browser check scripts must exist in the referenced `filePath`
- Multi-step check scripts must exist in the referenced `filePath`
- Alert channel configurations are currently hardcoded (see `generateAlertChannels.ts`)
- Dashboard tags and widgets are minimal (can be extended)

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
- Verify that all referenced alert channels exist
- Ensure script file paths are valid (for browser/multi-step checks)

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
