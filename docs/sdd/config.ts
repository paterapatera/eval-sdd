import { defineConfig } from "./schema/mod.ts";

export default defineConfig({
  schemaVersion: "0.8.0",
  tracker: "manual",
  branchPrefix: "",
  staleBranchDays: 30,
  issueIdPrefix: "GH",
  forge: { cli: "gh" },
  ui: true,
  commands: {
    format: "./vendor/bin/sail composer lint",
    check: "./vendor/bin/sail composer check:php",
    test: "./vendor/bin/sail artisan test --exclude-testsuite=Browser",
    build: "./vendor/bin/sail npm run build",
    e2e: "./vendor/bin/sail artisan test --testsuite=Browser",
  },
});
