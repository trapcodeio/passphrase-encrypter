<script setup lang="ts">
import { computed, ref } from "vue";
import Settings from "../components/Settings.vue";
import { ifDev } from "../functions/env";
import { settings } from "../stores/settings.store";

const encryptedValue = ref<string>();

/**
 * The password
 */
const passPhrase = ref(ifDev("1234567", "")!);

const encryptedValueJson = computed(() => {
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

function decryptWords() {}
</script>

<template>
  <div class="app-content">
    <Settings />

    <div class="p-3">
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
          <input v-model="passPhrase" type="text" placeholder="Encryption Password" />
        </div>
        <div>
          <LoadingButton
            :click="decryptWords"
            :disabled="encryptedValueJson === undefined"
            class="bg-primary-700 mt-4 disabled:bg-gray-800 disabled:opacity-50 text-white px-5 py-1.5 text-lg tracking-wide font-medium rounded-sm shadow-sm capitalize flex space-x-1 mx-auto"
            message="Decrypting"
          >
            <span> {{ settings.encryptionMethod }} Decrypt</span>
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

  <div class="mt-5">
    <Debug :data="{ encryptedValueJson }" />
  </div>
</template>
