<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { ILoadingButton } from "revue-components/vues/component-types";
import { ordinalSuffixOf } from "../functions/string";
import { aesEncrypt } from "../functions/crypto";
import { settings } from "../stores/settings.store";
import { isDev } from "../functions/env";
import Settings from "../components/Settings.vue";

/**
 * The password
 */
const passPhrase = ref("1234567");

/**
 * The name of this encryption method.
 */
const passName = ref("ledger");

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
     *  1. Encrypt each character in the pass phrase using the passphrase + substring value of the current index position.
     *  2. Join the encrypted characters.
     *  3. Encrypt the json string using the joined characters as the key.
     */

    // Encrypt each character in the pass phrase & join the encrypted characters
    const encryptedPassPhrase = passPhrase.value
      .split("")
      .map((c, i) => {
        return aesEncrypt(c, passPhrase.value + passPhrase.value.substring(0, i));
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

      <Settings />

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
              class="bg-primary-700 mt-4 text-white px-5 py-1.5 text-lg tracking-wide font-medium rounded-sm shadow-sm capitalize flex space-x-1"
              message="Encrypting"
            >
              <span> {{ settings.encryptionMethod }} Encrypt</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
      <div class="col-span-1 bg-gray-800 rounded-lg">
        <div class="flex justify-between mt-3 mb-2 text-sm text-gray-300 px-3">
          <h5>
            Name: <b class="text-primary-500">{{ passName || "UN_NAMED" }}</b>
          </h5>
          <small class="text-xs font-mono">
            {{
              encryptedValue
                ? encryptedValue.date.toDateString() +
                  " " +
                  encryptedValue.date.toLocaleTimeString()
                : ""
            }}
          </small>
        </div>
        <hr class="border-gray-700" />
      </div>
      <div class="col-span-1">
        <div v-if="encryptedValue" class="buttons-menu">
          <button class="bg-gray-700 hover:bg-gray-800 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
              />
            </svg>
            <span>Copy</span>
          </button>
          <button class="bg-teal-700 hover:bg-teal-800 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>

            <span>Text File</span>
          </button>
          <button class="bg-blue-700 hover:bg-blue-800 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Image File</span>
          </button>
        </div>
        <Debug header="Encrypted Data" :data="encryptedValue"></Debug>
      </div>
    </div>

    <div class="mt-5" v-if="isDev">
      <Debug header="Raw Data" :data="encryptedData()" />
    </div>
  </div>
</template>

<style lang="scss">
.buttons-menu {
  @apply flex flex-row gap-2 justify-end;

  button {
    @apply text-sm rounded-sm px-2 py-0.5 flex space-x-0.5;
  }
}
</style>
