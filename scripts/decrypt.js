/**
 * Get args from command line
 */
const [, , method, password] = process.argv;

// Get current working directory.
const cwd = process.cwd();

// if calling from current directory then print short file path
// else print full path
const thisFile = __filename.includes(cwd)
  ? __filename.replace(process.cwd() + "/", "./")
  : __filename;

// Validate Method and Password
if (!method || !password) {
  console.log("Usage:");
  console.log(`$ node "${thisFile}" <method> <password>`);
  process.exit(1);
}

/**
 * Decrypt Standalone File.
 */
const MD5 = require("crypto-js/md5");
const AES = require("crypto-js/aes");
const encUtf8 = require("crypto-js/enc-utf8");

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
  return AES.decrypt(str, key).toString(encUtf8);
}

/**
 * Generate a complex password
 */
function generateComplexPassword(password, complexKey) {
  /**
   * Complex Encryption Steps
   *  1. Split each character in password.
   *  2. Map and convert to md5 hash of each character + substring value of index.
   *  3. Join with complex key repeated to length of password.
   */

  // Encrypt each character in the pass phrase & join the encrypted characters
  return password
    .split("")
    .map((c, i) => {
      return MD5(password + password.substring(0, i)).toString();
    })
    .join(complexKey.repeat(password.length));
}

// Constant and never changes
const COMPLEX_ENCRYPTION_KEY = "|!@#$%^&*(MPPE)|";

try {
  let data = aesDecrypt(
    encryptedData.value,
    method === "complex"
      ? generateComplexPassword(password, COMPLEX_ENCRYPTION_KEY)
      : password
  );

  // parse to object
  data = JSON.parse(data);

  // Parse Date
  if (data.date) {
    data.date = new Date(data.date);
    data.date = data.date.toDateString() + " - " + data.date.toLocaleTimeString();
  }

  console.dir(data, { depth: null });
} catch (e) {
  console.log("Cannot decrypt data using the password provided!");
}
