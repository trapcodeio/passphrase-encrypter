<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { ILoadingButton } from "revue-components/vues/component-types";
import { ordinalSuffixOf } from "../functions/string";
import { aesEncrypt } from "../functions/crypto";

const settings = reactive({
  /**
   * Number of words in the pass phrase.
   */
  numberOfWords: 3,

  /**
   * Set verification mode.
   */
  verifyWords: "retype" as false | "retype" | "confirm",

  /**
   * Encryption type.
   */
  encryptionMethod: "complex" as "simple" | "complex"
});

/**
 * The password
 */
const passPhrase = ref("1234567");

/**
 * The name of this encryption method.
 */
const passName = ref("");

/**
 * Input model for all inputs
 */
const inputValues = reactive<string[]>(["force", "smith", "brave"]);

/**
 * Input model for all retype confirmation inputs
 */
const retypeValues = reactive<string[]>(["force", "smith", "brave"]);

/**
 * Will be set to true to show the verification section
 */
const isVerifyingWords = ref(true);

/**
 * Input error for all input boxes
 */
const inputErrors = reactive<string[]>([]);

/**
 * Encrypted data
 */
const encryptedValue = ref<{
  name: string;
  date: Date;
  value: string;
}>();

/**
 * Timeout for realtime inputs validation
 */
let timeout: NodeJS.Timeout | null = null;

const retypeVerificationIsValid = computed(() => {
  if (isVerifyingWords.value && settings.verifyWords === "retype") {
    return inputValues.every((value, index) => {
      return value === retypeValues[index];
    });
  }

  return true;
});

/**
 * Computed property to check if all validations is passed before Encrypting
 */
const canEncrypt = computed(() => {
  if (inputErrors.length > 0) return false;

  return retypeVerificationIsValid.value;
});

/**
 * Function to be called when any of the input values changes.
 */
function onInputValuesChange(e: KeyboardEvent, i: number) {
  if (!e) return;
  let v = (e.target as any).value;

  // set to empty string if not a string
  if (typeof v !== "string") v = "";

  v = v.trim();

  // if is verifying words, set the retype value to the same value
  if (isVerifyingWords.value) {
    retypeValues[i] = v;
  } else {
    inputValues[i] = v;
  }

  // validate all inputs
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => validateWords(true), 400);
}

// On Number of words settings change, update settings
function onNumberOfWordsSettingsKeyUp(e: KeyboardEvent) {
  if (!e) return;

  let v = Number((e.target as any).value);

  // set min to 1
  if (!v || v < 1) v = 1;
  // set max to 50
  else if (v > 50) v = 50;

  // change value if v is different
  if (v !== settings.numberOfWords) {
    settings.numberOfWords = v;
  }
}

/**
 * Validate words in the pass phrase.
 * @param checkRequired - When set to true, empty inputs are allowed.
 */
function validateWords(checkRequired = false) {
  // Reset errors
  inputErrors.length = 0;

  // Loop Through Inputs
  for (const index in "*".repeat(settings.numberOfWords).split("")) {
    // get word from input using index
    let word = inputValues[index];

    // If word is empty and not from watch, add error
    if (!word) {
      if (!checkRequired) inputErrors[index] = "Required!";
      continue;
    }

    word = word.trim();

    // check length
    if (word.length < 1) {
      inputErrors[index] = "Too short!";
      continue;
    }

    // check it is lowercased
    if (word !== word.toLowerCase()) {
      inputErrors[index] = "Must be lowercase!";
      continue;
    }

    // check if it is a word
    if (!/^[a-zA-Z]+$/.test(word)) {
      inputErrors[index] = "Not a word!";
      continue;
    }

    // if is verifying words, check if the retype value is the same as the input value
    if (isVerifyingWords.value && settings.verifyWords === "retype") {
      const retypeValue = retypeValues[index];
      if (retypeValue && retypeValue.length && word !== retypeValue) {
        inputErrors[index] = "Not correct!";
        continue;
      }
    }
  }

  return inputErrors.length === 0;
}

/**
 * Toggle isVerifyingWords function
 * validates on each toggle
 */
function toggleVerifyingWords() {
  isVerifyingWords.value = !isVerifyingWords.value;
  validateWords(true);
}

/**
 * Get encrypted data.
 */
function encryptedData() {
  const { encryptionMethod, numberOfWords } = settings;
  return {
    name: passName.value,
    date: new Date(),
    settings: { encryptionMethod, numberOfWords },
    words: inputValues
  };
}

/**
 * Validate Inputs, and if valid, generate pass phrase.
 * @param btn - The button current button instance
 */
function encryptWords(btn: ILoadingButton) {
  if (!passPhrase.value) {
    return btn.stopLoading(() => alert("Please enter a pass phrase"));
  }

  const isValid = validateWords();
  if (!isValid) return btn.stopLoading();

  const e = encryptedData();
  const eJson = JSON.stringify(e);

  if (settings.encryptionMethod === "simple") {
    encryptedValue.value = {
      name: e.name,
      date: e.date,
      value: aesEncrypt(eJson, passPhrase.value)
    };
  } else {
    /**
     * Complex Encryption Steps
     *  1. Encrypt each character in the pass phrase.
     *  2. Join the encrypted characters.
     *  3. Encrypt the json string using the joined characters as the key.
     */

    // Encrypt each character in the pass phrase & join the encrypted characters
    const encryptedPassPhrase = passPhrase.value
      .split("")
      .map((c) => {
        return aesEncrypt(c, passPhrase.value);
      })
      .join("");

    // Encrypt the json string using the joined characters as the key

    encryptedValue.value = {
      name: e.name,
      date: e.date,
      value: aesEncrypt(eJson, encryptedPassPhrase)
    };
  }

  btn.stopLoading();
}
</script>

<template>
  <div class="container mx-auto py-10">
    <h2 class="text-3xl font-bold text-center">
      <span class="text-gray-700">Mnemonic</span>
      <span class="text-primary-700 mx-2">Pass Phrase</span>
      <span class="text-gray-700">Encrypter</span>
    </h2>

    <div class="app-content">
      <div class="info">
        Use this tool only if you understand: <a href="#">How It Works!</a>
      </div>

      <div class="p-3 mt-5 mb-3">
        <h5 class="text-lg text-center uppercase text-gray-700 font-bold">Settings</h5>

        <div class="settings">
          <div>
            <label>Number of words:</label>
            <input
              @keyup="onNumberOfWordsSettingsKeyUp"
              :value="settings.numberOfWords"
              type="number"
              min="1"
              max="50"
              class="w-32"
              placeholder="Number of words"
            />
          </div>

          <div>
            <label>Verification:</label>
            <select
              v-model="settings.verifyWords"
              class="w-32"
              placeholder="Verify words"
            >
              <option :value="false">None</option>
              <option value="confirm">Confirm (Medium)</option>
              <option value="retype">Retype (Recommended)</option>
            </select>
          </div>

          <div>
            <label>Encryption Method:</label>
            <select
              v-model="settings.encryptionMethod"
              class="w-32"
              placeholder="Encryption Method"
            >
              <option value="simple">Simple</option>
              <option value="complex">Complex</option>
            </select>
          </div>
        </div>
      </div>

      <div class="mt-8 p-3">
        <h3 class="text-xl text-primary-700 text-center uppercase">
          {{
            isVerifyingWords
              ? `Verify (${settings.numberOfWords})`
              : settings.numberOfWords
          }}
          {{ settings.numberOfWords > 1 ? "words" : "word" }} pass phrase
        </h3>

        <div class="flex gap-2 flex-wrap mt-5 justify-center mb-10">
          <div v-for="(v, i) of '*'.repeat(settings.numberOfWords).split('')">
            <label class="block text-sm text-gray-500 px-1">{{ i + 1 }}.</label>
            <input
              @keyup="(e) => onInputValuesChange(e, i)"
              :value="isVerifyingWords ? retypeValues[i] : inputValues[i]"
              type="text"
              :placeholder="`${ordinalSuffixOf(i + 1)} Word`"
            />
            <p
              class="text-red-600 text-xs font-medium px-1"
              v-show="inputErrors[i]"
              v-html="inputErrors[i]"
            ></p>
          </div>
        </div>

        <p v-if="!settings.verifyWords" class="my-8 text-center text-sm text-gray-500">
          Note: Words <b class="text-primary-800">Verification</b> is not enabled. Make
          sure you <b class="text-primary-800">cross check</b> your words one by one.
        </p>

        <div
          class="flex flex-row gap-x-2 justify-center my-5"
          v-if="settings.verifyWords"
        >
          <template v-if="settings.verifyWords === 'retype'">
            <h2 v-if="retypeVerificationIsValid" class="block text-green-700">
              Verified Successfully!
            </h2>
            <button
              v-else
              @click.fa-prevent="toggleVerifyingWords"
              :class="[isVerifyingWords ? 'bg-gray-700' : 'bg-primary-700']"
              class="mt-0.5 text-white px-5 py-1.5 text-xl tracking-wide rounded-sm shadow-sm"
              message="Encrypting"
            >
              {{ isVerifyingWords ? "Cancel Verification" : "Verify Words" }}
            </button>
          </template>
        </div>

        <div class="flex flex-wrap gap-2 justify-center" v-if="canEncrypt">
          <div class="flex-initial">
            <label class="px-1 text-xs block">Name (Optional)</label>
            <input v-model="passName" type="text" placeholder="Name (optional)" />
          </div>
          <div class="flex-initial">
            <label class="px-1 text-xs block">Encryption Password</label>
            <input v-model="passPhrase" type="text" placeholder="Encryption Password" />
          </div>
          <div>
            <LoadingButton
              :click="encryptWords"
              class="bg-primary-700 mt-4 text-white px-5 py-1.5 text-xl tracking-wide font-medium rounded-sm shadow-sm"
              message="Encrypting"
              >Encrypt</LoadingButton
            >
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="col-span-1">
        <Debug header="Raw Data" :data="encryptedData()"></Debug>
      </div>
      <div class="col-span-1">
        <Debug header="Encrypted Data" :data="encryptedValue"></Debug>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.settings {
  @apply flex gap-x-3 border-b pb-5;

  label {
    @apply text-xs block  px-1 text-gray-600 font-medium;
  }

  input,
  select {
    @apply text-primary-900 border text-sm;
  }
}
</style>
