<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { ILoadingButton } from "revue-components/vues/component-types";
import { ordinalSuffixOf } from "../functions/string";
import { aesEncrypt, md5 } from "../functions/crypto";
import { settings } from "../stores/settings.store";
import { COMPLEX_ENCRYPTION_KEY, ifDev, isDev } from "../functions/env";
import Settings from "../components/Settings.vue";
import { useQRCode } from "@vueuse/integrations/useQRCode";
import html2canvas from "html2canvas";
import LoadingButton from "../../node_modules/revue-components/vues/LoadingButton.vue";
import { useClipboard } from "@vueuse/core";
import { EncryptedData, EncryptedJson } from "../types";

const { copy, copied } = useClipboard();

const langFiles = {
  nodeJs: import.meta.env.VITE_JS_DECRYPT_FILE
};

/**
 * The password
 */
const passPhrase = ref(ifDev("1234567", "")!);
const passPhraseIsVisible = ref(false);

/**
 * The name of this encryption method.
 */
const passName = ref(ifDev("ledger", "")!);

/**
 * Input model for all inputs
 */
const inputValues = reactive<string[]>(ifDev(["force", "smith", "brave"], [])!);

/**
 * Input model for all retype confirmation inputs
 */
const retypeValues = reactive<string[]>([]);

/**
 * Will be set to true to show the verification section
 */
const isVerifyingWords = ref(false);

/**
 * Input error for all input boxes
 */
const inputErrors = reactive<string[]>([]);

/**
 * Encrypted data
 */
const encryptedValue = ref<EncryptedJson>();

const encryptedValueQrCode = useQRCode(() =>
  encryptedValue.value ? JSON.stringify(encryptedValue.value) : "QR_CODE_EMPTY"
);

/**
 * Timeout for realtime inputs validation
 */
let timeout: NodeJS.Timeout | null = null;

const retypeVerificationIsValid = computed(() => {
  if (isVerifyingWords.value && settings.verifyWords === "retype") {
    if (inputValues.length !== retypeValues.length) return false;

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
  if (inputErrors.length !== 0) return false;
  if (inputValues.length !== settings.numberOfWords) return false;
  if (settings.verifyWords === "retype")
    return isVerifyingWords.value && retypeVerificationIsValid.value;

  return true;
});

// Watch settings.showDateInPubicData
watch(settings, () => {
  // reset encrypted value if showDateInPubicData is changed
  if (encryptedValue.value) encryptedValue.value = undefined;
  validateWordsRealTime();
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
  validateWordsRealTime();
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
 * Validates words in realtime.
 * @param time
 */
function validateWordsRealTime(time = 400) {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => validateWords(true), time);
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
function encryptedData(): EncryptedData {
  const { encryptionMethod, numberOfWords } = settings;
  return {
    name: passName.value,
    date: settings.showDateInPubicData ? new Date() : undefined,
    settings: { encryptionMethod, numberOfWords },
    // convert inputValues to object to make it easier to read.
    words: convertInputValuesToObject()
  };
}

/**
 * Convert words to Object
 * with index starting from 1
 */
function convertInputValuesToObject() {
  const obj: Record<string, string> = {};

  for (const index in inputValues) {
    obj[Number(index) + 1] = inputValues[index];
  }

  return obj;
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
        return md5(passPhrase.value + passPhrase.value.substring(0, i));
      })
      .join(COMPLEX_ENCRYPTION_KEY.repeat(passPhrase.value.length));

    // Encrypt the json string using the joined characters as the key
    encryptedValue.value = {
      name: e.name,
      date: e.date,
      value: aesEncrypt(eJson, encryptedPassPhrase)
    };
  }

  btn.stopLoading();
}

/**
 * Copy encrypted data to clipboard.
 */
function copyEncryptedValue() {
  if (encryptedValue.value) {
    copy(JSON.stringify(encryptedValue.value));
  }
}

/**
 * Download encrypted data as qr code.
 */
const downloading = ref(false);
function downloadImage(btn: ILoadingButton) {
  downloading.value = true;
  setTimeout(() => {
    html2canvas(document.querySelector("#card")!, {})
      .then((canvas) => {
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.target = "_blank";
        a.download = `${passName.value || new Date().toDateString()}.png`;
        a.click();
      })
      .finally(() => {
        downloading.value = false;
        btn.stopLoading();
      });
  }, 1000);
}

/**
 * Download encrypted data as json.
 */
function downloadJson(btn: ILoadingButton) {
  downloading.value = true;
  setTimeout(() => {
    const a = document.createElement("a");
    a.href = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(encryptedValue.value)
    )}`;
    a.target = "_blank";
    a.download = `${passName.value || new Date().toDateString()}.json`;
    a.click();

    downloading.value = false;
    btn.stopLoading();
  }, 1000);
}

/**
 * Download encrypted data as nodejs script.
 */
function downloadNodeJsScript(btn: ILoadingButton) {
  downloading.value = true;
  setTimeout(() => {
    const a = document.createElement("a");
    a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(
      langFiles.nodeJs.replace(
        '"{{encryptedData}}"',
        JSON.stringify(encryptedValue.value)
      )
    )}`;
    a.target = "_blank";
    a.download = `${passName.value || new Date().toDateString()}.js`;
    a.click();

    downloading.value = false;
    btn.stopLoading();
  }, 1000);
}
</script>

<template>
  <div class="app-content">
    <Settings />

    <div class="mt-8 p-3">
      <div class="text-center space-x-2">
        <h3 class="text-xl text-primary-700 text-center uppercase inline-block">
          {{
            isVerifyingWords
              ? `Verify (${settings.numberOfWords})`
              : settings.numberOfWords
          }}
          {{ settings.numberOfWords > 1 ? "words" : "word" }} pass phrase
        </h3>

        <button
          v-if="isVerifyingWords"
          @click="toggleVerifyingWords"
          class="text-sm inline-block"
        >
          (cancel)
        </button>
      </div>

      <div class="flex gap-2 flex-wrap mt-5 justify-center mb-10">
        <template
          v-for="(v, i) of '*'.repeat(settings.numberOfWords).split('')"
          :key="v + i"
        >
          <div>
            <label class="block text-sm text-gray-500 px-1">{{ i + 1 }}.</label>
            <input
              @keyup="(e) => onInputValuesChange(e, i)"
              :value="isVerifyingWords ? retypeValues[i] : inputValues[i]"
              type="text"
              class="w-36 md:w-auto"
              :placeholder="`${ordinalSuffixOf(i + 1)} Word`"
            />
            <p
              class="text-red-600 text-xs font-medium px-1"
              v-show="inputErrors[i]"
              v-html="inputErrors[i]"
            ></p>
          </div>
        </template>
      </div>

      <p v-if="!settings.verifyWords" class="my-8 text-center text-sm text-gray-500">
        Note: Words <b class="text-primary-800">Verification</b> is not enabled. Make sure
        you <b class="text-primary-800">cross check</b> your words one by one.
      </p>

      <div class="flex flex-row gap-x-2 justify-center my-5" v-if="settings.verifyWords">
        <template v-if="settings.verifyWords === 'retype'">
          <div
            v-if="isVerifyingWords && retypeVerificationIsValid"
            class="flex space-x-2"
          >
            <h2 class="block text-green-700">Verified Successfully!</h2>
          </div>
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
          <input
            v-model="passPhrase"
            :type="passPhraseIsVisible ? 'text' : 'password'"
            placeholder="Encryption Password"
          />
        </div>
        <div class="flex-initial px-2 mt-6">
          <button @click.prevent="passPhraseIsVisible = !passPhraseIsVisible">
            <svg
              v-if="!passPhraseIsVisible"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>

            <svg
              v-else
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
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          </button>
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

  <div v-if="encryptedValue" class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
    <div
      id="card"
      :class="[downloading ? '' : 'rounded-lg']"
      class="col-span-1 bg-gray-800"
    >
      <div class="flex justify-between mt-3 mb-2 text-sm text-gray-300 px-3">
        <h5>
          Name: <b class="text-primary-500">{{ passName || "UN_NAMED" }}</b>
        </h5>
        <small v-if="settings.showDateInPubicData" class="text-xs font-mono">
          {{
            encryptedValue && encryptedValue.date
              ? encryptedValue.date.toDateString() +
                " " +
                encryptedValue.date.toLocaleTimeString()
              : ""
          }}
        </small>
      </div>
      <hr class="border-gray-700" />

      <div class="flex justify-around my-5">
        <img
          :src="encryptedValueQrCode"
          class="w-[150px] h-[150px] shadow-lg shadow-primary-500"
        />
      </div>
    </div>
    <div class="col-span-1">
      <div class="buttons-menu">
        <button
          @click.prevent="copyEncryptedValue"
          class="bg-gray-700 hover:bg-gray-800 text-white"
        >
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
          <span>{{ copied ? "Copied!" : "Copy" }}</span>
        </button>
        <LoadingButton
          :click="downloadJson"
          message="Downloading"
          class="bg-white hover:bg-gray-200 text-black border border-gray-500"
        >
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
        </LoadingButton>
        <LoadingButton
          class="bg-blue-700 hover:bg-blue-800 text-white"
          message="Downloading"
          :click="downloadImage"
        >
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
        </LoadingButton>

        <LoadingButton
          class="bg-green-700 hover:bg-green-800 text-white"
          message="Downloading"
          :click="downloadNodeJsScript"
        >
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
          <span>NodeJs Script</span>
        </LoadingButton>
      </div>
      <Debug :force-show="true" header="Encrypted Data" :data="encryptedValue"></Debug>
    </div>
  </div>

  <div class="mt-5" v-if="isDev">
    <Debug
      header="Raw Data"
      :data="{ encryptedValue: encryptedValue ? encryptedValue : null }"
    />
  </div>
</template>
