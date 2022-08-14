/**
 * This file builds the "bundle.min.js" file that is injected into
 * the vite config file.
 */
const fs = require("fs");
const { EOL } = require("os");
const es = require("esbuild");
const zlib = require("zlib");

// Bundled files
const bundledFiles = [];

// Get main decrypt file
let content = fs.readFileSync(__dirname + "/decrypt.js").toString("utf8");

// find injection point
content = content.split("// ===== injection =====");

// Inject encrypted data placeholder into main file
content[1] = 'const encryptedData = "{{encryptedData}}";';

// join contents using the current os EOL
content = content.join(EOL);

// make path to bundled converted file.
const convertedFile = __dirname + "/decrypt.min.js";

// Write to converted file
fs.writeFileSync(convertedFile, content);

// Build the converted file
es.buildSync({
  entryPoints: [convertedFile],
  format: "cjs",
  outfile: convertedFile,
  allowOverwrite: true,
  //   target: "es6",
  bundle: true,
  legalComments: "none",
  minify: true
});

// add to bundled files
bundledFiles.push(getGzippedSize(convertedFile));

// Log Bundled Files
console.table(bundledFiles);

/**
 * ===================================================
 * ==================== FUNCTIONS ====================
 * ===================================================
 */

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
function humanFileSize(bytes, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

  return bytes.toFixed(dp) + " " + units[u];
}

/**
 * Get gzip size of file
 */
function getGzippedSize(file) {
  const stats = fs.statSync(file);
  const gzip = zlib.gzipSync(fs.readFileSync(file));
  const gzipSize = gzip.length;

  return {
    file: file.replace(__dirname + "/", ""),
    size: humanFileSize(stats.size),
    gzip: humanFileSize(gzipSize)
  };
}
