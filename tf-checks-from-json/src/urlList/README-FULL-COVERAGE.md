# Full Coverage Demo - urlList-full-coverage.json

This file demonstrates **complete configuration coverage** for the JSON to Terraform Checks Converter, showcasing every available feature and configuration option across all resource types.

## Purpose

- **Documentation**: Serves as a living example of all available configurations
- **Testing**: Validates that all features work together correctly
- **Template**: Provides a starting point for creating comprehensive monitoring setups
- **Reference**: Shows proper syntax and structure for all configuration options

## How to Use This Example

### Generate Terraform from Full Coverage Demo

```bash
cd tf-checks-from-json
npx ts-node dynamic-json.check.tf.ts src/urlList/urlList-full-coverage.json
```

This will create Terraform files in `__tf_checks__/` demonstrating all implemented features.

### Inspect Generated Terraform

```bash
cd __tf_checks__
ls -la

# Expected output structure:
# - main.tf (provider configuration)
# - variables.tf (variable declarations)
# - alert-channels.tf (all alert channel resources)
# - global-env-vars.tf (account-level environment variables)
# - snippets.tf (reusable code snippets)
# - Full-Coverage-Demo/ (app-specific directory)
#   - dashboard.tf
#   - groups.tf (check groups for each tier)
#   - checks.tf (all check and monitor resources)
```

### Validate Generated Terraform

```bash
cd __tf_checks__
terraform init
terraform validate
```

## Features Demonstrated

### 1. Global Environment Variables (Lines 2-12)

**Account-level environment variables** shared across all checks:

```json
"global_environment_variables": [
  {
    "key": "GLOBAL_API_BASE_URL",
    "value": "https://api.example.com",
    "locked": true
  },
  {
    "key": "GLOBAL_SECRET_KEY",
    "value": "var:global_secret",
    "locked": true,
    "secret": true
  }
]
```

**Features**:
- `locked`: Prevents accidental modification in UI
- `secret`: Marks as sensitive (masked in UI)
- `value`: Supports Terraform variable references (`var:variable_name`)

**Generated Resource**: `checkly_environment_variable` in `global-env-vars.tf`

---

### 2. Code Snippets (Lines 13-23)

**Reusable setup/teardown scripts** referenced by ID:

```json
"snippets": [
  {
    "id": "auth_setup",
    "name": "Authentication Setup",
    "script": "/snippets/auth-setup.js"
  },
  {
    "id": "cleanup_teardown",
    "name": "Cleanup Teardown",
    "script": "/snippets/cleanup.js"
  }
]
```

**Generated Resource**: `checkly_snippet` in `snippets.tf`

**Note**: Script files are inlined as heredocs in generated Terraform

**Snippet Script Files**:
- `snippets/auth-setup.js` - Simple console.log setup script
- `snippets/cleanup.js` - Simple console.log teardown script

**Used By**:
- API Check "api-create-user" (lines 224-225)
- Browser Check "user-registration-flow" (lines 240-241)
- Multi-Step Check "complete-api-workflow" (lines 261-262)

---

### 3. Alert Channels (Lines 24-65)

**Four alert channel types** with comprehensive configurations:

#### Email Channel (Lines 25-35)
```json
{
  "id": "production_email",
  "type": "email",
  "send_degraded": true,
  "send_failure": true,
  "send_recovery": true,
  "ssl_expiry": true,
  "ssl_expiry_threshold": 14,
  "config": {
    "address": "prod-alerts@example.com"
  }
}
```

**Features**:
- SSL certificate expiry monitoring
- Granular alert type control (degraded/failure/recovery)

#### Slack Channel (Lines 36-45)
```json
{
  "id": "production_slack",
  "type": "slack",
  "config": {
    "channel": "#production-alerts",
    "url": "var:slack_webhook_url"
  }
}
```

**Features**:
- Webhook URL from Terraform variables
- Channel-specific routing

#### PagerDuty Channel (Lines 46-54)
```json
{
  "id": "production_pagerduty",
  "type": "pagerduty",
  "send_failure": true,
  "send_recovery": true,
  "config": {
    "service_key": "var:pagerduty_key",
    "account": "my-company"
  }
}
```

**Features**:
- Integration with incident management
- Service key from variables

**Generated Resources**: `checkly_alert_channel` in `alert-channels.tf`

---

### 4. Dashboard Configuration (Lines 69-94)

**Comprehensive dashboard** with all display options:

```json
"dashboard": {
  "custom_url": "full-coverage-demo",
  "header": "Full Coverage Monitoring Dashboard",
  "description": "Comprehensive monitoring dashboard...",
  "logo": "https://example.com/logo.png",
  "refresh_rate": 60,
  "width": "FULL",
  "show_header": true,
  "show_p95": true,
  "show_p99": true,
  "show_check_run_links": true,
  "expand_checks": false,
  "paginate": true,
  "pagination_rate": 60,
  "checks_per_page": 10,
  "use_tags_and_operator": false,
  "hide_tags": false,
  "is_private": false,
  "enable_incidents": true,
  "custom_css": "body { font-family: monospace; }",
  "link": "https://example.com/monitoring"
}
```

**Features**:
- Display customization (P95/P99, headers, links)
- Pagination controls
- Custom branding (logo, CSS)
- Privacy settings
- Incident management integration

**Generated Resource**: `checkly_dashboard` in `Full-Coverage-Demo/dashboard.tf`

---

### 5. Tier-Level Defaults (Production Tier, Lines 96-160)

**Group-level configurations** inherited by all checks in the tier:

#### Alert Settings (Lines 103-113)
```json
"alert_settings": {
  "escalation_type": "RUN_BASED",
  "run_based_escalation": {
    "failed_run_threshold": 2
  },
  "reminders": {
    "amount": 2,
    "interval": 15
  },
  "parallel_run_failure_threshold": {
    "enabled": true,
    "percentage": 30
  }
}
```

**Features**:
- Escalation strategies (RUN_BASED or TIME_BASED)
- Automated reminders
- Parallel run failure detection

#### Retry Strategy (Lines 114-121)
```json
"retry_strategy": {
  "type": "EXPONENTIAL",
  "base_backoff_seconds": 30,
  "max_duration_seconds": 600,
  "max_retries": 5,
  "same_region": true
}
```

**Features**:
- Multiple retry types (FIXED, LINEAR, EXPONENTIAL, SINGLE_RETRY, NO_RETRIES)
- Configurable backoff and duration
- Regional retry preferences

#### Environment Variables (Lines 122-132)
```json
"environment_variables": [
  {
    "key": "ENV",
    "value": "production",
    "locked": true
  },
  {
    "key": "API_KEY",
    "value": "var:prod_api_key",
    "locked": true,
    "secret": true
  }
]
```

**Features**:
- Tier-level variables inherited by all checks
- Variable references for sensitive data

#### API Check Defaults (Lines 133-140)
```json
"api_check_defaults": {
  "headers": {
    "X-Environment": "production",
    "X-Client": "checkly-monitoring"
  },
  "query_parameters": {
    "version": "v1"
  }
}
```

**Features**:
- Default headers for all API checks in group
- Default query parameters

**Generated Resource**: `checkly_check_group` in `Full-Coverage-Demo/groups.tf`

---

### 6. API Check (Lines 143-197)

**Two API checks** demonstrating GET and POST requests:

#### Health Check (Lines 144-181)
```json
{
  "url": "https://api.example.com/health",
  "method": "GET",
  "urlShort": "api-health",
  "frequency": 1,
  "activated": true,
  "degraded_response_time": 3000,
  "max_response_time": 10000,
  "headers": {
    "Authorization": "var:api_token",
    "Accept": "application/json"
  },
  "query_parameters": {
    "detailed": "true"
  },
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
  ],
  "ip_family": "IPv4",
  "follow_redirects": true,
  "skip_ssl": false,
  "ssl_check_domain": "api.example.com",
  "group_order": 1
}
```

**Features**:
- Response time thresholds
- Custom headers and query parameters
- **Object-based assertions** (recommended format - see Assertion Formats section below)
- Multiple assertions (status code, JSON body validation)
- SSL domain verification
- Check ordering within group
- Check-level alert settings override

#### POST Request with Authentication (Lines 182-227)
```json
{
  "url": "https://api.example.com/users",
  "method": "POST",
  "basic_auth": {
    "username": "var:api_user",
    "password": "var:api_pass"
  },
  "body": "{\"name\": \"Test User\", \"email\": \"test@example.com\"}",
  "body_type": "JSON",
  "headers": {
    "Content-Type": "application/json"
  },
  "assertions": [
    {
      "statusCode": {
        "equals": 201
      }
    }
  ],
  "retry_strategy": {
    "type": "FIXED",
    "base_backoff_seconds": 60,
    "max_retries": 3
  },
  "setup_snippet_id": "auth_setup",
  "teardown_snippet_id": "cleanup_teardown"
}
```

**Features**:
- HTTP Basic Authentication
- Request body with type specification
- Check-level retry strategy override
- **Snippet references** - Uses reusable setup/teardown scripts

**Generated Resources**: `checkly_check` (type="API") in `Full-Coverage-Demo/checks.tf`

**Generated Terraform**:
```hcl
resource "checkly_check" "api_create_user_..." {
  ...
  setup_snippet_id = checkly_snippet.snippet_auth_setup.id
  teardown_snippet_id = checkly_snippet.snippet_cleanup_teardown.id
  ...
}
```

---

### 6A. API Check Assertion Formats

The tool supports **two assertion formats** for API checks. Both generate identical Terraform HCL.

#### Object-Based Format (Recommended)

**Clearer, more structured, and easier to read/maintain:**

```json
{
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
    },
    {
      "headers": {
        "contains": "application/json",
        "property": "Content-Type"
      }
    },
    {
      "responseTime": {
        "lessThan": 1000
      }
    }
  ]
}
```

#### CLI String-Based Format (Legacy)

**Original Checkly CLI format still supported for backward compatibility:**

```json
{
  "assertions": [
    ["statusCode().lessThan(400)"],
    ["jsonBody().hasKey('status')"],
    ["jsonBody().get('status').equals('healthy')"],
    ["headers('Content-Type').contains('application/json')"],
    ["responseTime().lessThan(1000)"]
  ]
}
```

#### Supported Assertion Sources

| Source | Object Key | CLI Method | Checks |
|--------|-----------|------------|---------|
| Status Code | `statusCode` | `statusCode()` | HTTP response status |
| JSON Body | `jsonBody` | `jsonBody()` | JSON response content |
| Text Body | `textBody` | `textBody()` | Plain text response |
| Headers | `headers` | `headers('name')` | HTTP response headers |
| Response Time | `responseTime` | `responseTime()` | Request duration (ms) |

#### Supported Comparisons

| Comparison | Object Key | CLI Method | Description |
|------------|-----------|------------|-------------|
| Equals | `equals` | `equals(value)` | Exact match |
| Not Equals | `notEquals` | `notEquals(value)` | Not equal |
| Contains | `contains` | `contains(value)` | String/array contains |
| Not Contains | `notContains` | `notContains(value)` | Does not contain |
| Greater Than | `greaterThan` | `greaterThan(value)` | Numeric > |
| Greater Than or Equal | `greaterThanOrEqual` | `greaterThanOrEqual(value)` | Numeric >= |
| Less Than | `lessThan` | `lessThan(value)` | Numeric < |
| Less Than or Equal | `lessThanOrEqual` | `lessThanOrEqual(value)` | Numeric <= |
| Has Key | `hasKey` | `hasKey(key)` | JSON object has key |
| Has Value | `hasValue` | `hasValue(value)` | JSON contains value |
| Is Empty | `isEmpty` | `isEmpty()` | Empty string/array/object |
| Is Null | `isNull` | `isNull()` | Null value |
| Not Empty | `notEmpty` | `notEmpty()` | Not empty |
| Not Has Key | `notHasKey` | `notHasKey(key)` | JSON object missing key |
| Not Has Value | `notHasValue` | `notHasValue(value)` | JSON missing value |
| Not Null | `notNull` | `notNull()` | Not null |

#### Property Field (JSON Path Queries)

For `jsonBody` and `headers`, use the `property` field to specify which field to check:

```json
{
  "jsonBody": {
    "equals": "healthy",
    "property": "status"
  }
}
```

**Nested Properties**:
```json
{
  "jsonBody": {
    "greaterThan": 100,
    "property": "data.user.id"
  }
}
```

#### Generated Terraform (Both Formats Produce Same Output)

```hcl
request {
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
}
```

---

### 7. Browser Check (Lines 231-250)

**Playwright-based end-to-end test**:

```json
{
  "filePath": "/browser-scripts/user-flow.spec.ts",
  "frequency": 5,
  "activated": true,
  "urlShort": "user-registration-flow",
  "degraded_response_time": 15000,
  "max_response_time": 30000,
  "runtime_id": "2023.09",
  "setup_snippet_id": "auth_setup",
  "teardown_snippet_id": "cleanup_teardown",
  "environment_variables": [
    {
      "key": "TEST_EMAIL",
      "value": "test@example.com"
    }
  ],
  "group_order": 10
}
```

**Features**:
- **Snippet references** - Uses reusable setup/teardown scripts instead of inline scripts
- Check-specific environment variables
- Higher response time thresholds for browser checks
- Runtime version specification

**Note**: This check demonstrates using snippets instead of `local_setup_script` and `local_teardown_script` for better code reusability.

**Generated Resources**: `checkly_check` (type="BROWSER") in `Full-Coverage-Demo/checks.tf`

---

### 8. Multi-Step Check (Lines 253-265)

**Complex API workflow monitoring**:

```json
{
  "filePath": "/multi-scripts/api-workflow.spec.ts",
  "frequency": 10,
  "activated": true,
  "urlShort": "complete-api-workflow",
  "degraded_response_time": 20000,
  "max_response_time": 30000,
  "setup_snippet_id": "auth_setup",
  "teardown_snippet_id": "cleanup_teardown",
  "group_order": 20
}
```

**Features**:
- Multi-step API sequences
- Extended timeout thresholds for complex workflows
- **Snippet references** - Demonstrates snippet reusability across check types

**Generated Resources**: `checkly_check` (type="MULTI_STEP") in `Full-Coverage-Demo/checks.tf`

---

### 9. URL Monitor (Lines 242-252)

**Simple HTTP uptime monitoring**:

```json
{
  "name": "Homepage Uptime",
  "url": "https://example.com",
  "frequency": 1,
  "activated": true,
  "degraded_response_time": 2000,
  "max_response_time": 5000,
  "follow_redirects": true,
  "skip_ssl": false,
  "ip_family": "IPv4",
  "locations": ["us-east-1", "eu-west-1"]
}
```

**Features**:
- Simpler than full API checks
- Location overrides
- Redirect handling
- SSL verification control

**Generated Resources**: `checkly_url_monitor` in `Full-Coverage-Demo/checks.tf`

---

### 10. TCP Monitor (Lines 256-276)

**TCP port connectivity monitoring**:

```json
{
  "name": "Database Connection",
  "hostname": "db.example.com",
  "port": 5432,
  "frequency": 1,
  "activated": true,
  "data": "PING\\n",
  "degraded_response_time": 500,
  "max_response_time": 2000,
  "ip_family": "IPv4"
}
```

**Features**:
- Database port monitoring
- Optional data payload (e.g., PING command)
- Lower response time thresholds than HTTP
- IPv4/IPv6 selection

**Generated Resources**: `checkly_tcp_monitor` in `Full-Coverage-Demo/checks.tf`

---

### 11. DNS Monitor (Lines 280-303)

**DNS resolution and record validation**:

```json
{
  "name": "DNS A Record",
  "query": "example.com",
  "record_type": "A",
  "frequency": 5,
  "activated": true,
  "degraded_response_time": 500,
  "max_response_time": 2000,
  "protocol": "UDP"
}
```

**Supported Record Types**:
- A, AAAA (IP addresses)
- CNAME (canonical names)
- MX (mail servers)
- NS (name servers)
- TXT (text records)
- SOA, PTR, CAA

**Features**:
- Protocol selection (UDP/TCP)
- Custom name server specification
- Fast response time thresholds

**Generated Resources**: `checkly_dns_monitor` in `Full-Coverage-Demo/checks.tf`

---

### 12. Heartbeat Monitor (Lines 307-333)

**Cron job and background service monitoring**:

```json
{
  "name": "Daily Backup Job",
  "period": 1,
  "period_unit": "day",
  "grace": 30,
  "grace_unit": "minute",
  "activated": true,
  "alert_settings": {
    "escalation_type": "RUN_BASED",
    "run_based_escalation": {
      "failed_run_threshold": 1
    }
  }
}
```

**Features**:
- Flexible time units (minute, hour, day)
- Grace period before alerting
- Monitors periodic pings from cron jobs
- **Note**: Heartbeat monitors are standalone (not in check groups)

**Generated Resources**: `checkly_heartbeat_monitor` in `Full-Coverage-Demo/checks.tf`

---

### 13. Staging Tier (Lines 337-374)

**Simplified staging environment** demonstrating tier differences:

```json
"staging": {
  "alertChannel": "staging_email",
  "locations": ["us-east-1"],
  "concurrency": 100,
  "muted": false,
  "alert_settings": {
    "escalation_type": "RUN_BASED",
    "run_based_escalation": {
      "failed_run_threshold": 3
    }
  },
  "checks": [...]
}
```

**Features**:
- Different alert channel
- Fewer locations (cost optimization)
- Higher failure threshold (less sensitive)
- Simplified check configurations

---

## Configuration Hierarchy

Understanding the **precedence order** for configuration inheritance:

```
Check-level config
  ↓ (overrides)
Tier-level config (group defaults)
  ↓ (overrides)
Built-in constants
```

### Example

If a check has:
- Tier-level `degraded_response_time`: 5000ms
- Check-level `degraded_response_time`: 3000ms
- Result: **3000ms** (check-level wins)

If a check omits `degraded_response_time`:
- Tier-level specifies: Uses tier value
- Tier-level also omits: Uses `DEFAULT_DEGRADED_RESPONSE_TIME` constant (10000ms)

---

## Variable References

Throughout the file, **`var:variable_name` pattern** creates Terraform variable references:

```json
{
  "value": "var:api_token"
}
```

Generates:

```hcl
value = var.api_token
```

### Comprehensive Variable Collection

The tool scans **all configuration levels** to automatically collect variable references:

1. **Global Environment Variables** (lines 2-12)
   - `var:global_secret` → `var.global_secret`

2. **Alert Channel Configurations** (lines 24-65)
   - `var:slack_webhook_url` → `var.slack_webhook_url`
   - `var:pagerduty_key` → `var.pagerduty_key`

3. **Tier-Level Environment Variables** (lines 122-132)
   - `var:prod_api_key` → `var.prod_api_key`

4. **Tier-Level API Check Defaults** (headers, query_parameters, basic_auth)
   - Any `var:*` references in default headers/parameters

5. **Check-Level Configurations**
   - Headers: `var:api_token` → `var.api_token` (line 162)
   - Basic Auth: `var:api_user`, `var:api_pass` → `var.api_user`, `var.api_pass` (lines 204-205)
   - Environment Variables: Any check-specific variables

All collected variables are automatically declared in `variables.tf` with:
- Appropriate type (`string` for all current use cases)
- Descriptive name based on usage context
- `sensitive = true` for security-sensitive values

**Example Generated Variables**:
```hcl
variable "global_secret" {
  type        = string
  description = "Alert channel configuration value for global_secret"
  sensitive   = true
}

variable "api_token" {
  type        = string
  description = "Alert channel configuration value for api_token"
  sensitive   = true
}
```

---

## Configuration Validation

The tool validates all configurations against **Checkly Terraform provider constraints** before generating HCL files. This ensures that `terraform validate` will pass.

### Validated Constraints

#### 1. Frequency Values

**Valid Values**: `0, 1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440` minutes

**Applies To**: All check types (API, Browser, Multi-step, URL Monitor, TCP Monitor, DNS Monitor)

**Example Error**:
```
API Check "api-health": Invalid frequency 3. Must be one of: 0, 1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440
```

#### 2. Response Time Limits

**HTTP-Based Checks** (API, Browser, Multi-step, URL Monitor):
- Range: `0-30000` milliseconds
- Constraint: `degraded_response_time` must be ≤ `max_response_time`

**TCP/DNS Monitors**:
- Range: `0-5000` milliseconds
- Constraint: `degraded_response_time` must be ≤ `max_response_time`

**Example Error**:
```
Multi-Step Check "complete-api-workflow": max_response_time must be 0-30000ms, got 40000
TCP Monitor "Database Connection": degraded_response_time must be 0-5000ms, got 6000
API Check "api-health": degraded_response_time (15000) cannot exceed max_response_time (10000)
```

#### 3. Alert Settings

**Escalation Types**: `RUN_BASED` or `TIME_BASED`

**Run-Based Escalation**:
- `failed_run_threshold`: `1-5`

**Time-Based Escalation**:
- `minutes_failing_threshold`: `5, 10, 15, 30`

**Reminders** (optional):
- `amount`: `0-5`
- `interval`: `5-1440` minutes

**Parallel Run Failure Threshold** (optional):
- `percentage`: `10-100`

**Example Error**:
```
Invalid failed_run_threshold: 10. Must be 1-5
Invalid minutes_failing_threshold: 45. Must be one of: 5, 10, 15, 30
```

#### 4. Retry Strategy

**Types**: `FIXED`, `LINEAR`, `EXPONENTIAL`, `SINGLE_RETRY`, `NO_RETRIES`

**Constraints**:
- `max_retries`: `1-10`
- `base_backoff_seconds`: `1-600`
- `max_duration_seconds`: Maximum `600`
- `same_region`: Boolean

**Example Error**:
```
Invalid max_retries: 15. Must be 1-10
Invalid max_duration_seconds: 900. Cannot exceed 600
```

#### 5. SSL Expiry Settings

**Constraints**:
- `ssl_expiry`: Boolean
- `ssl_expiry_threshold`: `1-30` days

**Example Error**:
```
Invalid ssl_expiry_threshold: 60. Must be 1-30 days
```

#### 6. Environment Variables

**Constraints**:
- `key`: Required, non-empty string
- `value`: Required string
- `locked`: Optional boolean
- `secret`: Optional boolean

**Example Error**:
```
Environment variable missing required 'key' field
Environment variable 'API_KEY' missing required 'value' field
```

### How Validation Works

1. **Before Generation**: All configurations are validated before any Terraform HCL is written
2. **Clear Error Messages**: Errors specify which check/monitor failed and why
3. **Early Exit**: Tool stops on first validation error (fail fast)
4. **Context Included**: Error messages include check/monitor name for easy debugging

### Validation Benefits

- **Prevents Invalid Terraform**: Catches errors before `terraform validate`
- **Saves Time**: No need to run Terraform to discover basic constraint violations
- **Better Error Messages**: More specific than Terraform provider errors
- **Documentation**: Validation errors teach you the allowed values

---

## Best Practices Demonstrated

### 1. Environment Separation
- Production tier: High sensitivity, multiple locations, PagerDuty integration
- Staging tier: Lower sensitivity, fewer locations, email alerts

### 2. Security
- Secrets use `var:` references
- `locked: true` prevents accidental modification
- `secret: true` marks sensitive data

### 3. Alert Fatigue Prevention
- Production: Alert after 2 failed runs
- Staging: Alert after 3 failed runs
- Reminders configured to avoid spam

### 4. Performance Monitoring
- Different thresholds by check type:
  - Browser checks: 15-30 seconds
  - API checks: 3-10 seconds
  - TCP/DNS: 0.5-2 seconds

### 5. Operational Efficiency
- Tier-level defaults reduce repetition
- API check defaults for common headers
- Reusable code snippets

### 6. Comprehensive Coverage
- Multiple monitor types for different services
- DNS monitoring for infrastructure
- Heartbeat monitoring for cron jobs
- Browser checks for user flows

---

## Customizing This Example

### For Your Environment

1. **Update URLs and Endpoints**
   - Replace `example.com` with your domains
   - Update API endpoints

2. **Configure Alert Channels**
   - Add your Slack webhook URLs
   - Configure PagerDuty service keys
   - Set email addresses

3. **Adjust Locations**
   - Choose regions closest to your users
   - Consider cost vs coverage tradeoff

4. **Set Thresholds**
   - Adjust response times based on your SLAs
   - Configure frequency based on criticality

5. **Add Environment Variables**
   - Define your API keys
   - Set environment-specific values

### Removing Unused Features

To simplify, remove sections you don't need:

```json
// Remove global env vars if not needed
"global_environment_variables": [...]  // DELETE THIS

// Remove heartbeat monitors if not monitoring cron jobs
"heartbeat_monitor": [...]  // DELETE THIS

// Remove DNS monitors if not needed
"dns_monitor": [...]  // DELETE THIS
```

---

## Testing Your Modifications

After customizing:

```bash
# 1. Generate Terraform
npx ts-node dynamic-json.check.tf.ts src/urlList/urlList-full-coverage.json

# 2. Navigate to output
cd __tf_checks__

# 3. Initialize Terraform
terraform init

# 4. Validate syntax
terraform validate

# 5. See what will be created (dry run)
terraform plan

# 6. Create resources (requires credentials)
export TF_VAR_checkly_api_key="your_api_key"
export TF_VAR_checkly_account_id="your_account_id"
terraform apply
```

---

## Feature Matrix

| Feature | Demonstrated | Lines | Notes |
|---------|-------------|-------|-------|
| Global Environment Variables | ✅ | 2-12 | Account-level variables |
| Code Snippets | ✅ | 13-23 | Reusable scripts |
| Alert Channels (Email) | ✅ | 25-35 | With SSL monitoring |
| Alert Channels (Slack) | ✅ | 36-45 | Webhook integration |
| Alert Channels (PagerDuty) | ✅ | 46-54 | Incident management |
| Dashboard (Full Config) | ✅ | 69-94 | All 18 optional fields |
| Tier Alert Settings | ✅ | 103-113 | Escalation & reminders |
| Tier Retry Strategy | ✅ | 114-121 | Exponential backoff |
| Tier Environment Variables | ✅ | 122-132 | Group-level vars |
| API Check Defaults | ✅ | 133-140 | Default headers/params |
| API Check (GET) | ✅ | 144-181 | With assertions |
| API Check (POST) | ✅ | 182-206 | With basic auth & body |
| Browser Check | ✅ | 210-226 | With setup/teardown |
| Multi-Step Check | ✅ | 230-238 | API workflows |
| URL Monitor | ✅ | 242-252 | Simple uptime |
| TCP Monitor | ✅ | 256-276 | Port connectivity |
| DNS Monitor | ✅ | 280-303 | Record validation |
| Heartbeat Monitor | ✅ | 307-333 | Cron job monitoring |
| Multiple Tiers | ✅ | 96-374 | Production & Staging |

**Total**: 19 major features + 100+ configuration options demonstrated

---

## Related Documentation

- **Main README**: `../../README.md` - Overall project documentation and detailed assertion format guide
- **JSON Types**: `../types/json-types.ts` - Complete TypeScript interfaces
- **Constants**: `../config/constants.ts` - All valid values, assertion mappings, and defaults
- **Validation**: `../utils/validation.ts` - Validation function reference with all constraints
- **Assertion Parser**: `../utils/parseAssertionsObject.ts` - Object-based assertion format parser
- **Variable Resolver**: `../utils/variableResolver.ts` - Comprehensive variable collection logic
- **Checkly Terraform Docs**: `_kb/checkly_tf_docs/` - Official provider documentation

---

## Questions or Issues?

If you encounter issues with this example:

1. **Validate JSON syntax**: Use a JSON validator
2. **Check TypeScript compilation**: Run `npx tsc --noEmit`
3. **Review error messages**: The tool provides detailed validation errors
4. **Consult type definitions**: See `src/types/json-types.ts` for all available fields

This comprehensive example demonstrates the full power of the JSON to Terraform Checks Converter. Use it as a reference and starting point for building your own monitoring configurations!
