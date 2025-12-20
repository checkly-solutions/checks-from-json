/**
 * Entry point for the JSON to Terraform Checks Converter
 * Reads urlList.json and generates Terraform HCL files for Checkly resources
 *
 * Usage: cd tf-checks-from-json && npx ts-node dynamic-json.check.tf.ts
 */

import fs from 'fs';
import path from 'path';
import { UrlListConfig, CheckCategory } from './src/types/json-types';
import { sanitizeResourceId } from './src/utils/sanitizeResourceId';
import { initOutputDir, ensureDir, writeHCL } from './src/utils/fileUtils';
import { generateBoilerplate } from './src/generators/generateBoilerplate';
import { generateAlertChannels } from './src/generators/generateAlertChannels';
import { generateGroup } from './src/generators/generateGroup';
import { generateAPICheck } from './src/generators/generateAPICheck';
import { generateBrowserCheck } from './src/generators/generateBrowserCheck';
import { generateMultiStepCheck } from './src/generators/generateMultiStepCheck';
import { generateDashboard } from './src/generators/generateDashboard';
import { TIER_ORDER } from './src/config/constants';

/**
 * Main entry point
 */
function main(): void {
  console.log('🚀 Starting JSON to Terraform Checks Converter...\n');

  // Define paths
  const outputDir = path.join(__dirname, '__tf_checks__');
  const jsonPath = path.join(
    __dirname,
    'src/urlList/urlList.json'
  );

  // Initialize output directory (clean and recreate)
  console.log('📁 Initializing output directory...');
  initOutputDir(outputDir);

  // Generate boilerplate files (terraform.tf, variables.tf, provider.tf)
  console.log('📝 Generating boilerplate files...');
  generateBoilerplate(outputDir);

  // Generate alert channels
  console.log('🔔 Generating alert channels...');
  generateAlertChannels(outputDir);

  // Read JSON data
  console.log('📖 Reading urlList.json...');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON file not found: ${jsonPath}`);
  }

  const data = fs.readFileSync(jsonPath, 'utf-8');
  const apps: UrlListConfig[] = JSON.parse(data);

  console.log(`   Found ${apps.length} application(s)\n`);

  // Process each app
  apps.forEach((app, appIndex) => {
    console.log(`📦 Processing app ${appIndex + 1}/${apps.length}: ${app.appName}`);

    // Create app directory
    const sanitizedAppName = sanitizeResourceId(app.appName);
    const appDir = path.join(outputDir, sanitizedAppName);
    ensureDir(appDir);

    // Generate dashboard
    console.log(`   ├─ Generating dashboard...`);
    const dashboardHCL = generateDashboard(app.appName);
    const dashboardPath = path.join(appDir, 'dashboard.tf');
    writeHCL(dashboardPath, dashboardHCL);

    // Arrays to collect HCL for groups and checks
    const groupsHCL: string[] = [];
    const checksHCL: string[] = [];

    // Process tiers in order (app4, app3, app2, app1)
    TIER_ORDER.forEach((tier) => {
      const tierChecks = app[tier as keyof UrlListConfig] as CheckCategory[];

      if (tierChecks && tierChecks.length >= 1) {
        console.log(`   ├─ Processing tier: ${tier}`);

        // Generate group for this tier
        const groupHCL = generateGroup(app.appName, tier);
        groupsHCL.push(groupHCL);

        // Get the group resource ID for reference
        const groupResourceId = sanitizeResourceId(`${app.appName}_${tier}_group`);

        // Strategy pattern: map check type to generator function
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
        };

        // Process each check category in the tier
        tierChecks.forEach((checkCategory: CheckCategory) => {
          Object.keys(checkCategory).forEach((checkType) => {
            const checks = checkCategory[checkType as keyof CheckCategory];

            if (Array.isArray(checks) && checks.length > 0) {
              console.log(`   │  ├─ Generating ${checks.length} ${checkType}(s)`);

              checks.forEach((check) => {
                const generator = checkCreators[checkType];
                if (generator) {
                  try {
                    const checkHCL = generator(app, tier, check, groupResourceId);
                    checksHCL.push(checkHCL);
                  } catch (error) {
                    console.error(
                      `   │  │  ⚠️  Error generating ${checkType} "${check.urlShort}": ${error}`
                    );
                  }
                } else {
                  console.warn(
                    `   │  │  ⚠️  Unknown check type: ${checkType}`
                  );
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
  console.log('   5. terraform plan\n');
}

// Run the main function
try {
  main();
} catch (error) {
  console.error('\n❌ Error:', error);
  process.exit(1);
}
