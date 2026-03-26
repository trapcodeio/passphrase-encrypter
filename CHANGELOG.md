# Changelog

## [2.0.0] - 2026-03-26

### Security Overhaul

The entire encryption pipeline has been replaced. **This is a breaking change for encryption** — all new encryptions use the v2 format. Decryption remains backward compatible with v1 blobs.

### Changed

- **Key Derivation:** Replaced MD5-based `EVP_BytesToKey` (crypto-js default) with **Argon2id** — a memory-hard KDF that resists GPU/ASIC brute-force attacks. Parameters: time=2, memory=2048 KiB, parallelism=1, producing a 256-bit key.
- **Cipher:** Replaced **AES-CBC** (unauthenticated, via crypto-js) with **AES-256-GCM** (via Web Crypto API). GCM provides authenticated encryption — any tampering with the ciphertext causes decryption to fail, eliminating padding oracle attacks.
- **Salt & IV:** Every encryption now generates a cryptographically random **16-byte salt** and **12-byte IV** using `crypto.getRandomValues()`. Previously, salt handling was weak/implicit via crypto-js internals.
- **Blob Format:** Encrypted output is now an opaque binary blob packed as `[version byte][salt][IV][ciphertext + GCM auth tag]`, then base64-encoded. No algorithm names or parameters are visible in the exported file — the password is the only secret.
- **Node.js Decrypt Script:** Updated to support both v2 (Argon2id + AES-256-GCM) and v1 (crypto-js) formats with auto-detection.
- **XSS Fix:** Replaced `v-html` usage with `v-text` in templates to prevent potential cross-site scripting.

### Removed

- **"Simple" and "Complex" encryption modes:** There is now a single strong encryption mode. Users no longer choose between methods — every encryption uses Argon2id + AES-256-GCM.
- **`generateComplexPassword` for new encryptions:** The MD5-chain password derivation used in "Complex" mode is no longer used for encrypting. The code is retained solely for decrypting legacy v1 blobs.

### Added

- **Automatic v1 migration:** The decrypt interface auto-detects v1 blobs (both "Simple" and "Complex" modes) and decrypts them using the legacy crypto-js code. Users can then re-encrypt with v2 to upgrade their data.
- **`argon2-browser` dependency:** WASM build of the reference Argon2 implementation for in-browser key derivation.
- **Comprehensive test suite:** 18 tests covering v2 encrypt/decrypt, v1 legacy decryption (both simple and complex), tamper detection, unicode handling, and full v1-to-v2 migration round-trips.

### Migration Guide

If you have files encrypted with v1 (the old "Simple" or "Complex" methods):

1. Go to the **Decrypt** page
2. Paste your old encrypted data
3. Enter your password — the app auto-detects v1 format and decrypts it
4. Copy the decrypted words
5. Go to the **Encrypt** page
6. Re-enter the words and encrypt with a new password

Your data is now protected with Argon2id + AES-256-GCM.

### Why This Matters

| | v1 (old) | v2 (new) |
|---|---|---|
| KDF | MD5 / EVP_BytesToKey | Argon2id (memory-hard) |
| Cipher | AES-CBC (crypto-js) | AES-256-GCM (Web Crypto API) |
| Authentication | None | Built-in (GCM tag) |
| Salt | Weak/implicit | 16-byte random per encryption |
| Tamper detection | No | Yes — any modification fails decryption |
| Brute-force resistance | Seconds | Computationally expensive |
