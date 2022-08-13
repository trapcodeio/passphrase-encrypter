import type { settings } from "./stores/settings.store";

export interface EncryptedData {
  name?: string;
  date?: Date;
  settings: Pick<settings, "numberOfWords" | "encryptionMethod">;
  words: Record<string, string>;
}

export interface EncryptedJson {
  name?: string;
  date?: Date;
  value: string;
}
