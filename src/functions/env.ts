// Set isDev value
export const isDev = import.meta.env.DEV;

/** @legacy Used only for decrypting v1 blobs encrypted with "complex" mode. */
export const COMPLEX_ENCRYPTION_KEY = "|!@#$%^&*(MPPE)|";

/**
 * If Development mode is enabled, show the dev values.
 * @param yes - value to show if dev
 * @param no - value to show if production
 * @returns
 */
export function ifDev<T = any>(yes: T, no?: T) {
  return isDev ? yes : no;
}
