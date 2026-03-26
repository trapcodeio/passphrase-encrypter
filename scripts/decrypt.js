const { createInterface } = require("readline");
const { webcrypto } = require("crypto");
const { argon2id } = require("hash-wasm");

/**
 * Decrypt Standalone File.
 * Supports both v2 (Argon2id + AES-256-GCM) and v1 (crypto-js) blobs.
 */

// Legacy v1 dependencies (kept for backward compatibility)
const MD5 = require("crypto-js/md5");
const AES = require("crypto-js/aes");
const encUtf8 = require("crypto-js/enc-utf8");

// Legacy constant for v1 "complex" mode
const COMPLEX_ENCRYPTION_KEY = "|!@#$%^&*(MPPE)|";

/**
 * Inject Encrypted data
 */
// ===== injection =====
const encryptedData = {
  name: "ledger",
  date: "2022-08-12T22:34:31.081Z",
  value:
    "U2FsdGVkX1+bHiU54zCH40UwGC1cSUmORHbPRJzdxI4aN//2xf5q2fCL4/6YXT/SpKfs/rY9mJ+E4JsCKJlm8nWWMa7TnTTmLMU1K++vcDtz8Mx1qgpWPsy20DSKqKfJLenLpD6ZSsfLTP3fDz+6sgchoYbK/Bt1HhMYXVyBSSR3gTTjBA8WsWUaWZaWVdy2mXGdQAUAtJ2qq1CKF2lheJW0cv5dRlxldlONbBAFLkQ=",
};

// ===== injection =====

// ============================================================
// V2 Decryption: Argon2id + AES-256-GCM
// ============================================================

const V2_VERSION_BYTE = 0x02;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ARGON2_TIME = 2;
const ARGON2_MEM = 2048;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LEN = 32;

function base64ToUint8(base64) {
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

function isLegacyBlob(base64Value) {
  return base64Value.startsWith("U2FsdGVk");
}

async function decryptV2(base64Value, password) {
  const blob = base64ToUint8(base64Value);

  if (blob[0] !== V2_VERSION_BYTE) {
    throw new Error("Unknown blob version");
  }

  const salt = blob.slice(1, 1 + SALT_LENGTH);
  const iv = blob.slice(1 + SALT_LENGTH, 1 + SALT_LENGTH + IV_LENGTH);
  const ciphertext = blob.slice(1 + SALT_LENGTH + IV_LENGTH);

  const derivedKey = await argon2id({
    password,
    salt,
    parallelism: ARGON2_PARALLELISM,
    iterations: ARGON2_TIME,
    memorySize: ARGON2_MEM,
    hashLength: ARGON2_HASH_LEN,
    outputType: "binary",
  });

  const key = await webcrypto.subtle.importKey(
    "raw",
    derivedKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decrypted = await webcrypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// ============================================================
// V1 Legacy Decryption: crypto-js
// ============================================================

function legacyAesDecrypt(str, key) {
  return AES.decrypt(str, key).toString(encUtf8);
}

function legacyGenerateComplexPassword(password) {
  return password
    .split("")
    .map((c, i) => {
      return MD5(password + password.substring(0, i)).toString();
    })
    .join(COMPLEX_ENCRYPTION_KEY.repeat(password.length));
}

function legacyDecryptAuto(base64Value, password) {
  // Try complex first
  try {
    const complexPassword = legacyGenerateComplexPassword(password);
    const result = legacyAesDecrypt(base64Value, complexPassword);
    JSON.parse(result);
    return result;
  } catch {}

  // Try simple
  try {
    const result = legacyAesDecrypt(base64Value, password);
    JSON.parse(result);
    return result;
  } catch {
    throw new Error("Cannot decrypt data using the provided password!");
  }
}

// ============================================================
// Main
// ============================================================

function askQuestion(question) {
  return new Promise((resolve) => {
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question(question, (name) => {
      readline.close();
      resolve(name);
    });
  });
}

async function Main() {
  const password = await askQuestion("Password: ");

  try {
    let raw;

    if (isLegacyBlob(encryptedData.value)) {
      raw = legacyDecryptAuto(encryptedData.value, password);
    } else {
      raw = await decryptV2(encryptedData.value, password);
    }

    const data = JSON.parse(raw);

    if (data.date) {
      const d = new Date(data.date);
      data.date = d.toDateString() + " - " + d.toLocaleTimeString();
    }

    const { words, ...rest } = data;
    console.dir(rest, { depth: null });
    console.table(words);
  } catch (e) {
    console.log("Cannot decrypt data using the password provided!");
  }
}

Main().catch(console.error);
