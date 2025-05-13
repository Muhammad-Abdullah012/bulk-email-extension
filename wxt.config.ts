import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  entrypointsDir: "entrypoints",
  manifest: {
    permissions: ["tabs", "storage"],
    web_accessible_resources: [
      {
        resources: ["/outlook.json"],
        matches: ["https://outlook.live.com/*"],
      },
    ],
  },
});
