import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [
          storybookTest({
            configDir: fileURLToPath(
              new URL("./example/storybook", import.meta.url),
            ),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            provider: playwright({ launchOptions: { channel: "chrome" } }),
            instances: [{ browser: "chromium" }],
            headless: true,
          },
        },
      },
    ],
  },
});
