/**
 * Decrypt Standalone File.
 */
const { MD5, AES, enc } = require("crypto-js");

/**
 * Inject Encrypted data
 */
// ===== injection =====
const encryptedData = {
  name: "ledger",
  date: "2022-08-12T22:34:31.081Z",
  value:
    "U2FsdGVkX1+bHiU54zCH40UwGC1cSUmORHbPRJzdxI4aN//2xf5q2fCL4/6YXT/SpKfs/rY9mJ+E4JsCKJlm8nWWMa7TnTTmLMU1K++vcDtz8Mx1qgpWPsy20DSKqKfJLenLpD6ZSsfLTP3fDz+6sgchoYbK/Bt1HhMYXVyBSSR3gTTjBA8WsWUaWZaWVdy2mXGdQAUAtJ2qq1CKF2lheJW0cv5dRlxldlONbBAFLkQ="
};
// ===== injection =====

/**
 * Encrypt a string using AES
 */
function aesEncrypt(str, key) {
  return AES.encrypt(str, key).toString();
}

/**
 * AES decrypt a string
 * @param str - String to encrypt
 * @param key - Key to use for encryption
 * @returns string
 */
function aesDecrypt(str, key) {
  return AES.decrypt(str, key).toString(enc.Utf8);
}

/**
 * Get args from command line
 */
const [, , method, password] = process.argv;

// Validate Method and Password
if (!method || !password) {
  console.log("Usage: node decrypt.js <method> <password>");
  process.exit(1);
}

console.log("Decrypting...");

if (method === "simple") {
  try {
    // Decrypt data
    let data = aesDecrypt(encryptedData.value, password);
    data = JSON.parse(data);

    if (data.date) {
      data.date = new Date(data.date);
      data.date = data.date.toDateString() + " - " + data.date.toLocaleTimeString();
    }

    console.dir(data, { depth: null });
  } catch (e) {
    console.log(e.message);
    console.log("Cannot decrypt data using the provided password!");
  }
} else if (method === "complex") {
  try {
    // Generate hashed password
    const encryptedPassPhrase = password
      .split("")
      .map((c, i) => {
        return MD5(password + password.substring(0, i)).toString();
      })
      .join("|!@#$%^&*(MPPE)|".repeat(password.length));

    let data = aesDecrypt(encryptedData.value, encryptedPassPhrase);
    data = JSON.parse(data);

    if (data.date) {
      data.date = new Date(data.date);
      data.date = data.date.toDateString() + " - " + data.date.toLocaleTimeString();
    }

    console.dir(data, { depth: null });
  } catch (e) {
    console.log(e.message);
    console.log("Cannot decrypt data using the provided password!");
  }
}
