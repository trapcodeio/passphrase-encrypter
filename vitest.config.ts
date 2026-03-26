import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    setupFiles: ["./src/test-setup.ts"]
  },
  resolve: {
    alias: {
      // Replace argon2-browser's bundled WASM version with our Node.js-compatible mock
      "argon2-browser/dist/argon2-bundled.min.js": path.resolve(
        __dirname,
        "src/test-argon2-shim.ts"
      )
    }
  }
});
