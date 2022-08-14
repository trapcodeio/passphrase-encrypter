import { defineConfig } from "vite";
import fs from "fs";
import path from "path";
import vue from "@vitejs/plugin-vue";
import { qrcode } from "vite-plugin-qrcode";

// Provide Js decrypt file
process.env.VITE_JS_DECRYPT_FILE = fs.readFileSync(
  path.join(__dirname, "./scripts/decrypt.min.js"),
  "utf8"
);

// https://vitejs.dev/config/
export default defineConfig({
  // base: "./",
  plugins: [qrcode(), vue()]
});
