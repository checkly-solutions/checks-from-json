/**
 * Entry point for the JSON to Terraform Checks Converter
 * Reads JSON configuration and generates Terraform HCL files for Checkly resources
 *
 * Usage:
 *   npx ts-node dynamic-json.check.tf.ts                    # Uses default: src/urlList/urlList.json
 *   npx ts-node dynamic-json.check.tf.ts my-config.json     # Uses custom JSON file
 *   npx ts-node dynamic-json.check.tf.ts ../other-dir/config.json
 */

import fs from 'fs';
import path from 'path';
import { RootConfig, UrlListConfig, CheckCategory } from './src/types/json-types';
import { sanitizeResourceId } from './src/utils/sanitizeResourceId';
import { initOutputDir, ensureDir, writeHCL } from './src/utils/fileUtils';
import { generateBoilerplate } from './src/generators/generateBoilerplate';
import { generateAlertChannels } from './src/generators/generateAlertChannels';
import { generateGroup } from './src/generators/generateGroup';
import { generateAPICheck } from './src/generators/generateAPICheck';
import { generateBrowserCheck } from './src/generators/generateBrowserCheck';
import { generateMultiStepCheck } from './src/generators/generateMultiStepCheck';
import { generateDashboard } from './src/generators/generateDashboard';
import { generateUrlMonitor } from './src/generators/generateUrlMonitor';
import { generateTcpMonitor } from './src/generators/generateTcpMonitor';
import { generateDnsMonitor } from './src/generators/generateDnsMonitor';
import { generateHeartbeatMonitor } from './src/generators/generateHeartbeatMonitor';
import { generateSnippets } from './src/generators/generateSnippets';
import { generateGlobalEnvVars } from './src/generators/generateGlobalEnvVars';
import { validateAlertChannels } from './src/utils/validation';
import { collectVariableReferences } from './src/utils/variableResolver';

/**
 * Main entry point
 *
 * Usage:
 *   npx ts-node dynamic-json.check.tf.ts                    # Uses default: src/urlList/urlList.json
 *   npx ts-node dynamic-json.check.tf.ts my-config.json     # Uses custom JSON file
 */
function main(): void {
  console.log('🚀 Starting JSON to Terraform Checks Converter...\n');

  // Define paths
  const outputDir = path.join(__dirname, '__tf_checks__');

  // Get JSON file path from command line argument or use default
  const defaultJsonPath = path.join(__dirname, 'src/urlList/urlList.json');
  const customJsonPath = process.argv[2];
  const jsonPath = customJsonPath
    ? path.resolve(customJsonPath)  // Resolve relative/absolute path
    : defaultJsonPath;

  // Initialize output directory (clean and recreate)
  console.log('📁 Initializing output directory...');
  initOutputDir(outputDir);

  // Read JSON data
  const jsonFileName = path.basename(jsonPath);
  console.log(`📖 Reading ${jsonFileName}...`);
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON file not found: ${jsonPath}`);
  }

  const data = fs.readFileSync(jsonPath, 'utf-8');
  const rootConfig: RootConfig = JSON.parse(data);

  // Validate structure
  if (!rootConfig.alertChannels || !rootConfig.apps) {
    throw new Error(
      'Invalid JSON structure. Expected object with "alertChannels" and "apps" properties.\n' +
      'Example: { "alertChannels": [...], "apps": [...] }'
    );
  }

  const alertChannelDefs = rootConfig.alertChannels;
  const apps = rootConfig.apps;

  console.log(`   Found ${apps.length} application(s) and ${alertChannelDefs.length} alert channel(s)\n`);

  // Validate alert channels
  console.log('✅ Validating alert channel definitions...');
  validateAlertChannels(alertChannelDefs, apps);
  console.log('   All alert channels validated successfully');

  // Note: Additional validation functions are available in src/utils/validation.ts:
  // - validateAlertSettings() - validate alert settings configurations
  // - validateRetryStrategy() - validate retry strategy configurations
  // - validateResponseTimes() - validate response time thresholds
  // - validateFrequency() - validate frequency values
  // - validateEnvironmentVariables() - validate environment variable configurations
  // These can be called by generators or added here for comprehensive validation
  console.log('');

  // Collect variable references
  console.log('🔍 Collecting variable references...');
  const variableRefs = collectVariableReferences(alertChannelDefs);
  console.log(`   Found ${variableRefs.size} variable reference(s)\n`);

  // Generate boilerplate files with dynamic variables
  console.log('📝 Generating boilerplate files...');
  generateBoilerplate(outputDir, variableRefs);

  // Generate alert channels
  console.log('🔔 Generating alert channels...');
  generateAlertChannels(outputDir, alertChannelDefs);

  // Generate global environment variables (if any)
  if (rootConfig.global_environment_variables && rootConfig.global_environment_variables.length > 0) {
    console.log(`🌍 Generating ${rootConfig.global_environment_variables.length} global environment variable(s)...`);
    const globalEnvVarsHCL = generateGlobalEnvVars(rootConfig.global_environment_variables);
    const globalEnvVarsPath = path.join(outputDir, 'global-env-vars.tf');
    writeHCL(globalEnvVarsPath, globalEnvVarsHCL);
  }

  // Generate snippets (if any)
  if (rootConfig.snippets && rootConfig.snippets.length > 0) {
    console.log(`📝 Generating ${rootConfig.snippets.length} code snippet(s)...`);
    const snippetsHCL = generateSnippets(rootConfig.snippets);
    const snippetsPath = path.join(outputDir, 'snippets.tf');
    writeHCL(snippetsPath, snippetsHCL);
  }

  // Process each app
  apps.forEach((app, appIndex) => {
    console.log(`📦 Processing app ${appIndex + 1}/${apps.length}: ${app.appName}`);

    // Create app directory
    const sanitizedAppName = sanitizeResourceId(app.appName);
    const appDir = path.join(outputDir, sanitizedAppName);
    ensureDir(appDir);

    // Generate dashboard
    console.log(`   ├─ Generating dashboard...`);
    const dashboardHCL = generateDashboard(app.appName, app.dashboard);
    const dashboardPath = path.join(appDir, 'dashboard.tf');
    writeHCL(dashboardPath, dashboardHCL);

    // Arrays to collect HCL for groups and checks
    const groupsHCL: string[] = [];
    const checksHCL: string[] = [];

    // Process tiers dynamically (order doesn't matter)
    Object.entries(app.tiers).forEach(([tierName, tierDef]) => {
      if (tierDef.checks && tierDef.checks.length >= 1) {
        console.log(`   ├─ Processing tier: ${tierName}`);

        // Generate group for this tier with its configuration
        const groupHCL = generateGroup(app.appName, tierName, tierDef);
        groupsHCL.push(groupHCL);

        // Get the group resource ID for reference
        const groupResourceId = sanitizeResourceId(`${app.appName}_${tierName}_group`);

        // Strategy pattern: map check type to generator function
        // Note: heartbeat_monitor is handled separately as it doesn't belong to a group
        const checkCreators: {
          [key: string]: (
            app: UrlListConfig,
            tier: string,
            check: any,
            groupResourceId: string
          ) => string;
        } = {
          browser_check: generateBrowserCheck,
          api_check: generateAPICheck,
          multi_check: generateMultiStepCheck,
          url_monitor: generateUrlMonitor,
          tcp_monitor: generateTcpMonitor,
          dns_monitor: generateDnsMonitor,
        };

        // Process each check category in the tier
        tierDef.checks.forEach((checkCategory: CheckCategory) => {
          Object.keys(checkCategory).forEach((checkType) => {
            const checks = checkCategory[checkType as keyof CheckCategory];

            if (Array.isArray(checks) && checks.length > 0) {
              console.log(`   │  ├─ Generating ${checks.length} ${checkType}(s)`);

              checks.forEach((check) => {
                // Special handling for heartbeat monitors (they don't belong to groups)
                if (checkType === 'heartbeat_monitor') {
                  try {
                    const checkHCL = generateHeartbeatMonitor(app, tierName, check as any);
                    checksHCL.push(checkHCL);
                  } catch (error) {
                    const checkName = (check as any).name ?? 'unknown';
                    console.error(
                      `   │  │  ⚠️  Error generating heartbeat_monitor "${checkName}": ${error}`
                    );
                  }
                } else {
                  const generator = checkCreators[checkType];
                  if (generator) {
                    try {
                      const checkHCL = generator(app, tierName, check, groupResourceId);
                      checksHCL.push(checkHCL);
                    } catch (error) {
                      const checkName = (check as any).urlShort ?? (check as any).name ?? 'unknown';
                      console.error(
                        `   │  │  ⚠️  Error generating ${checkType} "${checkName}": ${error}`
                      );
                    }
                  } else {
                    console.warn(
                      `   │  │  ⚠️  Unknown check type: ${checkType}`
                    );
                  }
                }
              });
            }
          });
        });
      }
    });

    // Write groups.tf
    if (groupsHCL.length > 0) {
      console.log(`   ├─ Writing groups.tf (${groupsHCL.length} groups)`);
      const groupsPath = path.join(appDir, 'groups.tf');
      writeHCL(groupsPath, groupsHCL.join('\n\n'));
    }

    // Write checks.tf
    if (checksHCL.length > 0) {
      console.log(`   ├─ Writing checks.tf (${checksHCL.length} checks)`);
      const checksPath = path.join(appDir, 'checks.tf');
      writeHCL(checksPath, checksHCL.join('\n\n'));
    }

    console.log(`   └─ ✅ Completed ${app.appName}\n`);
  });

  console.log('✨ Success! Terraform files generated in:', outputDir);
  console.log('\n📋 Next steps:');
  console.log('   1. cd __tf_checks__');
  console.log('   2. terraform init');
  console.log('   3. terraform validate');
  console.log('   4. Set credentials: export TF_VAR_checkly_api_key="..." TF_VAR_checkly_account_id="..."');
  console.log('   5. terraform plan');
  console.log('\n💡 Tip: See src/urlList/README-FULL-COVERAGE.md for comprehensive configuration examples\n');
}

// Run the main function
try {
  main();
} catch (error) {
  console.error('\n❌ Error:', error);
  process.exit(1);
}
