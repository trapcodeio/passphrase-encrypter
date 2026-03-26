import { webcrypto } from "crypto";

// Polyfill crypto.subtle for Node.js test environment
if (!globalThis.crypto?.subtle) {
  // @ts-ignore
  globalThis.crypto = webcrypto as Crypto;
}
