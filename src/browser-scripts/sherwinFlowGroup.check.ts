import * as path from "path";
import { CheckGroup } from "@checkly/cli/constructs";
import { smsChannel, emailChannel } from "../alert-channels";
const alertChannels = [smsChannel, emailChannel];
import { checklyGroupMethods } from "../checkGroupCreation";

// We can define multiple checks in a single *.check.js file.
const group = new CheckGroup("sherwin-flow-check-group", {
  name: "Sherwin User Flows",
  activated: true,
  muted: false,
  runtimeId: "2022.10",
  locations: ["us-east-1", "us-west-1"],
  tags: ["critical", "CLI", "userflows"],
  environmentVariables: [],
  apiCheckDefaults: {},
  concurrency: 100,
  alertChannels,
  browserChecks: {
    testMatch: "e2e-sherwin-flows/*.spec.ts",
  },
});

// Declaring variables for use with checklyGroupMethods
const directoryPath = path.join(__dirname);
const directoryFolderArray = directoryPath.split("/");
const directoryFolderName = directoryFolderArray[directoryFolderArray.length - 1];
// obtain file name without ending
const filePath = path.basename(__filename).split(".");
const checkGroupFileName = filePath[0];
let arrayOfFileNames: Array<string> = [];

checklyGroupMethods.createBrowserCheckFromList(
  group,
  checkGroupFileName,
  directoryPath,
  arrayOfFileNames,
  directoryFolderName
);
