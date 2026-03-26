import { ref } from "vue";
import type { EncryptedData } from "../types";

/**
 * Holds decrypted data from a v1 blob that the user wants to migrate to v2.
 * Set by Decrypt page, consumed by Encrypt page, then cleared.
 */
export const migrationData = ref<EncryptedData>();

/**
 * Clear migration data after it has been consumed.
 */
export function clearMigrationData() {
  migrationData.value = undefined;
}
