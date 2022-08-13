import { reactive } from "vue";
import { ifDev } from "../functions/env";

export const settings = reactive({
  /**
   * Number of words in the pass phrase.
   */
  numberOfWords: ifDev(3, 12)!,

  /**
   * Set verification mode.
   */
  verifyWords: ifDev<false | "retype" | "confirm">(false, false)!,

  /**
   * Encryption type.
   */
  encryptionMethod: ifDev<"simple" | "complex">("simple", "simple")!,

  /**
   * Add Date in Image
   */
  showDateInPubicData: ifDev(true, false)!
});

export const settingsVisibility = reactive<
  Record<keyof typeof settings, ("encrypt" | "decrypt")[]>
>({
  numberOfWords: ["encrypt"],
  verifyWords: ["encrypt"],
  encryptionMethod: ["encrypt", "decrypt"],
  showDateInPubicData: ["encrypt"]
});
