import { describe, it, expect } from "vitest";
import { encrypt, decrypt, isLegacyBlob } from "./crypto";

// ============================================================
// Test Data
// ============================================================

const TEST_PASSWORD = "MyStr0ngP@ssw0rd!";
const TEST_PLAINTEXT = JSON.stringify({
  name: "test-wallet",
  date: "2024-01-01T00:00:00.000Z",
  settings: { numberOfWords: 3 },
  words: { "1": "force", "2": "smith", "3": "brave" }
});

// Known v1 blob encrypted with "simple" mode, password "1234567"
const V1_SIMPLE_BLOB =
  "U2FsdGVkX19OMXnOV9MK6/6UieQzZ2qiTMwbQ46lNIteHe5A3avTwtPGl803Ofeni2Nfw5ABl+NJ8DWR3+XMGo73ww4hCcctWfMahlds6oT14PVTCiSAhNWR54M5MKim0zqMKzu13bBnfkx8RUlJI/2oz+DbKDN2aoiGVXVolS9BMwhKUvA3v4FMq1hUu2tk";
const V1_SIMPLE_PASSWORD = "1234567";

// Known v1 blob encrypted with "complex" mode (from the decrypt.js sample)
const V1_COMPLEX_BLOB =
  "U2FsdGVkX1+bHiU54zCH40UwGC1cSUmORHbPRJzdxI4aN//2xf5q2fCL4/6YXT/SpKfs/rY9mJ+E4JsCKJlm8nWWMa7TnTTmLMU1K++vcDtz8Mx1qgpWPsy20DSKqKfJLenLpD6ZSsfLTP3fDz+6sgchoYbK/Bt1HhMYXVyBSSR3gTTjBA8WsWUaWZaWVdy2mXGdQAUAtJ2qq1CKF2lheJW0cv5dRlxldlONbBAFLkQ=";
const V1_COMPLEX_PASSWORD = "1234567";

// ============================================================
// V2 Encrypt/Decrypt Tests
// ============================================================

describe("V2 Encryption (Argon2id + AES-256-GCM)", () => {
  it("should encrypt and produce a non-empty base64 string", async () => {
    const encrypted = await encrypt(TEST_PLAINTEXT, TEST_PASSWORD);
    expect(encrypted).toBeTruthy();
    expect(typeof encrypted).toBe("string");
    expect(encrypted.length).toBeGreaterThan(0);
  });

  it("should not be detected as a legacy blob", async () => {
    const encrypted = await encrypt(TEST_PLAINTEXT, TEST_PASSWORD);
    expect(isLegacyBlob(encrypted)).toBe(false);
  });

  it("should decrypt back to original plaintext", async () => {
    const encrypted = await encrypt(TEST_PLAINTEXT, TEST_PASSWORD);
    const decrypted = await decrypt(encrypted, TEST_PASSWORD);
    expect(decrypted).toBe(TEST_PLAINTEXT);
  });

  it("should produce different ciphertext each time (random salt/IV)", async () => {
    const encrypted1 = await encrypt(TEST_PLAINTEXT, TEST_PASSWORD);
    const encrypted2 = await encrypt(TEST_PLAINTEXT, TEST_PASSWORD);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("should fail to decrypt with wrong password", async () => {
    const encrypted = await encrypt(TEST_PLAINTEXT, TEST_PASSWORD);
    await expect(decrypt(encrypted, "wrong-password")).rejects.toThrow();
  });

  it("should fail to decrypt tampered ciphertext", async () => {
    const encrypted = await encrypt(TEST_PLAINTEXT, TEST_PASSWORD);

    // Tamper with a character near the end (the ciphertext portion)
    const chars = encrypted.split("");
    const idx = chars.length - 5;
    chars[idx] = chars[idx] === "A" ? "B" : "A";
    const tampered = chars.join("");

    await expect(decrypt(tampered, TEST_PASSWORD)).rejects.toThrow();
  });

  it("should handle empty string plaintext", async () => {
    const encrypted = await encrypt("", TEST_PASSWORD);
    const decrypted = await decrypt(encrypted, TEST_PASSWORD);
    expect(decrypted).toBe("");
  });

  it("should handle unicode plaintext", async () => {
    const unicode = '{"word": "caf\u00e9 \ud83d\udd12"}';
    const encrypted = await encrypt(unicode, TEST_PASSWORD);
    const decrypted = await decrypt(encrypted, TEST_PASSWORD);
    expect(decrypted).toBe(unicode);
  });

  it("should handle long passwords", async () => {
    const longPass = "a".repeat(200);
    const encrypted = await encrypt(TEST_PLAINTEXT, longPass);
    const decrypted = await decrypt(encrypted, longPass);
    expect(decrypted).toBe(TEST_PLAINTEXT);
  });
});

// ============================================================
// V1 Legacy Migration Tests
// ============================================================

describe("V1 Legacy Blob Detection", () => {
  it("should detect v1 simple blob as legacy", () => {
    expect(isLegacyBlob(V1_SIMPLE_BLOB)).toBe(true);
  });

  it("should detect v1 complex blob as legacy", () => {
    expect(isLegacyBlob(V1_COMPLEX_BLOB)).toBe(true);
  });

  it("should not detect v2 blob as legacy", async () => {
    const v2 = await encrypt("test", "pass");
    expect(isLegacyBlob(v2)).toBe(false);
  });
});

describe("V1 Legacy Decryption (Simple Mode)", () => {
  it("should decrypt a v1 simple blob with correct password", async () => {
    const decrypted = await decrypt(V1_SIMPLE_BLOB, V1_SIMPLE_PASSWORD);
    const data = JSON.parse(decrypted);
    expect(data).toHaveProperty("words");
    expect(data).toHaveProperty("name");
  });

  it("should fail to decrypt a v1 simple blob with wrong password", async () => {
    await expect(decrypt(V1_SIMPLE_BLOB, "wrong")).rejects.toThrow();
  });
});

describe("V1 Legacy Decryption (Complex Mode)", () => {
  it("should decrypt a v1 complex blob with correct password", async () => {
    const decrypted = await decrypt(V1_COMPLEX_BLOB, V1_COMPLEX_PASSWORD);
    const data = JSON.parse(decrypted);
    expect(data).toHaveProperty("words");
    expect(data).toHaveProperty("name");
  });

  it("should fail to decrypt a v1 complex blob with wrong password", async () => {
    await expect(decrypt(V1_COMPLEX_BLOB, "wrong")).rejects.toThrow();
  });
});

// ============================================================
// Migration Round-Trip Tests
// ============================================================

describe("V1 → V2 Migration Round-Trip", () => {
  it("should decrypt v1 simple blob and re-encrypt as v2, then decrypt v2", async () => {
    // Step 1: Decrypt v1
    const decrypted = await decrypt(V1_SIMPLE_BLOB, V1_SIMPLE_PASSWORD);
    const data = JSON.parse(decrypted);
    expect(data.words).toBeDefined();

    // Step 2: Re-encrypt with v2
    const newPassword = "NewSecurePassword123!";
    const v2Encrypted = await encrypt(decrypted, newPassword);

    // Step 3: Verify it's v2 format
    expect(isLegacyBlob(v2Encrypted)).toBe(false);

    // Step 4: Decrypt v2
    const reDecrypted = await decrypt(v2Encrypted, newPassword);
    expect(reDecrypted).toBe(decrypted);
  });

  it("should decrypt v1 complex blob and re-encrypt as v2, then decrypt v2", async () => {
    // Step 1: Decrypt v1
    const decrypted = await decrypt(V1_COMPLEX_BLOB, V1_COMPLEX_PASSWORD);
    const data = JSON.parse(decrypted);
    expect(data.words).toBeDefined();

    // Step 2: Re-encrypt with v2
    const newPassword = "AnotherSecurePass456!";
    const v2Encrypted = await encrypt(decrypted, newPassword);

    // Step 3: Verify it's v2 format
    expect(isLegacyBlob(v2Encrypted)).toBe(false);

    // Step 4: Decrypt v2
    const reDecrypted = await decrypt(v2Encrypted, newPassword);
    expect(reDecrypted).toBe(decrypted);
  });
});
