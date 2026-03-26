<script setup lang="ts">
import type { ILoadingButton } from "revue-components/vues/component-types";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import Settings from "../components/Settings.vue";
import { decrypt, isLegacyBlob } from "../functions/crypto";
import { ifDev } from "../functions/env";
import { ordinalSuffixOf } from "../functions/string";
import { settings } from "../stores/settings.store";
import { migrationData } from "../stores/migration.store";
import { EncryptedData, EncryptedJson } from "../types";

const router = useRouter();

/**
 * Encrypt Data String
 */
const encryptedValue = ref<string>();

/**
 * Decrypted Data
 */
const decryptedData = ref<EncryptedData>();

/**
 * Whether the decrypted data came from a v1 (legacy) blob
 */
const wasV1Blob = ref(false);

/**
 * The password
 */
const passPhrase = ref(ifDev("1234567", "")!);
const passPhraseIsVisible = ref(false);

const encryptedValueJson = computed<EncryptedJson | undefined>(() => {
  if (!encryptedValue.value) return undefined;
  if (encryptedValue.value.length === 0) return undefined;

  try {
    const data = JSON.parse(encryptedValue.value);
    if (!data.value) return undefined;
    return data;
  } catch (e) {
    return undefined;
  }
});

function pasteFromClipboard() {
  const clipboard = navigator.clipboard;
  if (clipboard) {
    clipboard.readText().then((text) => {
      if (text) encryptedValue.value = text;
    });
  }
}

async function decryptWords(btn: ILoadingButton) {
  if (!encryptedValueJson.value) return btn.stopLoading();

  const password = passPhrase.value;
  if (!password) return btn.stopLoading();

  const context = encryptedValueJson.value.value;

  try {
    // Detect if this is a v1 blob before decrypting
    wasV1Blob.value = isLegacyBlob(context);

    const result = await decrypt(context, password);
    let data = JSON.parse(result) as EncryptedData;
    if (data.date) data.date = new Date(data.date);

    decryptedData.value = data;
  } catch (e: any) {
    alert("Cannot decrypt data using the provided password!");
  } finally {
    btn.stopLoading();
  }
}

function done() {
  decryptedData.value = undefined;
  passPhrase.value = "";
  encryptedValue.value = "";
  wasV1Blob.value = false;
}

/**
 * Migrate v1 data to v2 by passing decrypted data to the encrypt page.
 */
function migrateToV2() {
  if (!decryptedData.value) return;
  migrationData.value = decryptedData.value;
  done();
  router.push({ name: "encrypt" });
}
</script>

<template>
  <div class="app-content">
    <Settings />

    <div v-if="decryptedData" class="mt-8 p-3">
      <div class="text-center space-x-2">
        <h3 class="text-xl text-primary-700 text-center uppercase inline-block">
          {{ settings.numberOfWords }}
          {{ settings.numberOfWords > 1 ? "words" : "word" }} pass phrase
        </h3>
      </div>

      <div class="flex gap-2 flex-wrap mt-5 justify-center mb-10">
        <div v-for="(v, i) of Object.values(decryptedData.words)">
          <label class="block text-sm text-gray-500 px-1">{{ i + 1 }}.</label>
          <input
            :value="v"
            readonly
            type="text"
            :placeholder="`${ordinalSuffixOf(i + 1)} Word`"
          />
        </div>
      </div>

      <!-- V1 Migration Banner -->
      <div
        v-if="wasV1Blob"
        class="bg-yellow-900/50 border border-yellow-600 rounded-md p-4 mb-6 mx-auto max-w-lg text-center"
      >
        <p class="text-yellow-200 text-sm mb-3">
          This file uses the old encryption format (v1) which is less secure.
          <br />
          Upgrade to v2 for stronger encryption (Argon2id + AES-256-GCM).
        </p>
        <button
          @click.prevent="migrateToV2"
          class="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-1.5 text-sm font-medium tracking-wide rounded-sm shadow-sm"
        >
          Migrate to v2
        </button>
      </div>

      <div class="text-center">
        <button
          @click.prevent="done"
          class="bg-gray-700 hover:bg-primary-700 mt-0.5 text-white px-5 py-1.5 text-xl tracking-wide rounded-sm shadow-sm"
          message="Encrypting"
        >
          Done
        </button>
      </div>
    </div>

    <div v-else class="p-3">
      <div class="flex justify-between mb-1">
        <label class="text-primary-700 text-sm font-medium block"
          >Enter Encrypted Data:</label
        >

        <div class="buttons-menu">
          <button
            @click.prevent="pasteFromClipboard"
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
            <span>Paste</span>
          </button>
          <button
            @click.prevent="encryptedValue = ''"
            class="bg-red-700 hover:bg-red-800 text-white"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span>Clear</span>
          </button>
        </div>
      </div>
      <div>
        <textarea
          v-model="encryptedValue"
          spellcheck="false"
          class="w-full text-sm"
          :class="{
            'text-red-700 border-red-700':
              encryptedValue && encryptedValueJson === undefined,
            'text-green-700 border-green-700':
              encryptedValue && encryptedValueJson !== undefined
          }"
          rows="7"
          :placeholder="
            JSON.stringify(
              {
                name: 'Optional Name',
                date: new Date(),
                value: 'Encrypted Value'
              },
              null,
              2
            )
          "
        ></textarea>
      </div>

      <div class="flex flex-wrap gap-2 justify-center mt-5">
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
            :click="decryptWords"
            :disabled="encryptedValueJson === undefined"
            class="bg-primary-700 mt-4 disabled:bg-gray-800 disabled:opacity-50 text-white px-5 py-1.5 text-lg tracking-wide font-medium rounded-sm shadow-sm capitalize flex space-x-1 mx-auto"
            message="Decrypting"
          >
            <span>Decrypt</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"
              />
            </svg>
          </LoadingButton>
        </div>
      </div>
    </div>
  </div>
</template>
