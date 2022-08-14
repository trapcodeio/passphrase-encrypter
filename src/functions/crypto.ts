// import { MD5, AES, enc } from "crypto-js";
import MD5 from "crypto-js/md5";
import AES from "crypto-js/aes";
import encUtf8 from "crypto-js/enc-utf8";

/**
 * Hash a string using MD5
 * @param str - String to be hashed
 * @returns
 */
export function md5(str: string) {
  return MD5(str).toString();
}

/**
 * Encrypt a string using AES
 */
export function aesEncrypt(str: string, key: string) {
  return AES.encrypt(str, key).toString();
}

/**
 * AES decrypt a string
 * @param str - String to encrypt
 * @param key - Key to use for encryption
 * @returns string
 */
export function aesDecrypt(str: string, key: string) {
  return AES.decrypt(str, key).toString(encUtf8);
}

/**
 * Generate a complex password
 */
export function generateComplexPassword(password: string, complexKey: string) {
  /**
   * Complex Encryption Steps
   *  1. Split each character in password.
   *  2. Map and convert to md5 hash of each character + substring value of index.
   *  3. Join with complex key repeated to length of password.
   */

  return password
    .split("")
    .map((c, i) => {
      return md5(password + password.substring(0, i));
    })
    .join(complexKey.repeat(password.length));
}

/**
 * Hash a string multiple times.
 * @param str - String to hash
 * @returns string
 */
export function loopMd5(str: string) {
  const times = Number(import.meta.env.VITE_APP_MD5_LOOP_COUNT || 10);

  let hash = str;
  for (let i = 0; i < times; i++) hash = md5(hash);

  return hash;
}
