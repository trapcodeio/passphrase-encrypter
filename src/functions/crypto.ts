import argon2 from "argon2-browser/dist/argon2-bundled.min.js";
import MD5 from "crypto-js/md5";
import AES from "crypto-js/aes";
import encUtf8 from "crypto-js/enc-utf8";
import { COMPLEX_ENCRYPTION_KEY } from "./env";

// ============================================================
// V2 Encryption: Argon2id + AES-256-GCM (Web Crypto API)
// ============================================================

/** Blob version byte for v2 format */
const V2_VERSION_BYTE = 0x02;

/** Argon2id parameters */
const ARGON2_TIME = 2;
const ARGON2_MEM = 2048; // KiB
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LEN = 32; // 256 bits for AES-256

/** Salt and IV sizes */
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Derive a 256-bit key from password using Argon2id,
 * then import it as an AES-GCM CryptoKey.
 */
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const result = await argon2.hash({
    pass: password,
    salt,
    time: ARGON2_TIME,
    mem: ARGON2_MEM,
    parallelism: ARGON2_PARALLELISM,
    hashLen: ARGON2_HASH_LEN,
    type: argon2.ArgonType.Argon2id
  });

  return crypto.subtle.importKey(
    "raw",
    result.hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plaintext using Argon2id + AES-256-GCM.
 * Returns a base64 string containing:
 *   [version: 1 byte][salt: 16 bytes][iv: 12 bytes][ciphertext + GCM tag]
 */
export async function encrypt(
  plaintext: string,
  password: string
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    encoded
  );

  // Build binary blob: [version][salt][iv][ciphertext+tag]
  const blob = new Uint8Array(
    1 + SALT_LENGTH + IV_LENGTH + ciphertext.byteLength
  );
  blob[0] = V2_VERSION_BYTE;
  blob.set(salt, 1);
  blob.set(iv, 1 + SALT_LENGTH);
  blob.set(new Uint8Array(ciphertext), 1 + SALT_LENGTH + IV_LENGTH);

  return uint8ToBase64(blob);
}

/**
 * Decrypt a base64 value. Auto-detects v1 (crypto-js) vs v2 (Argon2id + AES-GCM).
 * For v1 blobs, tries complex password derivation first, then simple.
 */
export async function decrypt(
  base64Value: string,
  password: string
): Promise<string> {
  if (isLegacyBlob(base64Value)) {
    return legacyDecryptAuto(base64Value, password);
  }

  return decryptV2(base64Value, password);
}

/**
 * Decrypt a v2 blob (Argon2id + AES-256-GCM).
 */
async function decryptV2(
  base64Value: string,
  password: string
): Promise<string> {
  const blob = base64ToUint8(base64Value);

  if (blob[0] !== V2_VERSION_BYTE) {
    throw new Error("Unknown blob version");
  }

  const salt = blob.slice(1, 1 + SALT_LENGTH);
  const iv = blob.slice(1 + SALT_LENGTH, 1 + SALT_LENGTH + IV_LENGTH);
  const ciphertext = blob.slice(1 + SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Check if a base64 value is a v1 (crypto-js) blob.
 * crypto-js always prepends "Salted__" which encodes to "U2FsdGVk".
 */
export function isLegacyBlob(base64Value: string): boolean {
  return base64Value.startsWith("U2FsdGVk");
}

// ============================================================
// V1 Legacy: crypto-js (kept for backward compatibility)
// ============================================================

/** @legacy Hash a string using MD5 */
function md5(str: string) {
  return MD5(str).toString();
}

/** @legacy Decrypt using crypto-js AES */
function legacyAesDecrypt(str: string, key: string) {
  return AES.decrypt(str, key).toString(encUtf8);
}

/** @legacy Generate complex password using MD5 + COMPLEX_ENCRYPTION_KEY */
function legacyGenerateComplexPassword(password: string) {
  return password
    .split("")
    .map((c, i) => {
      return md5(password + password.substring(0, i));
    })
    .join(COMPLEX_ENCRYPTION_KEY.repeat(password.length));
}

/**
 * @legacy Auto-decrypt a v1 blob by trying complex mode first, then simple.
 */
function legacyDecryptAuto(base64Value: string, password: string): string {
  // Try complex mode first
  try {
    const complexPassword = legacyGenerateComplexPassword(password);
    const result = legacyAesDecrypt(base64Value, complexPassword);
    // Verify it's valid JSON (if it decrypts to garbage, JSON.parse will throw)
    JSON.parse(result);
    return result;
  } catch {
    // Complex failed, try simple
  }

  // Try simple mode (raw password)
  try {
    const result = legacyAesDecrypt(base64Value, password);
    JSON.parse(result);
    return result;
  } catch {
    throw new Error("Cannot decrypt data using the provided password!");
  }
}

// ============================================================
// Helpers
// ============================================================

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
