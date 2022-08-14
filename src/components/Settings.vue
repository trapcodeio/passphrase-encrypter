<script lang="ts" setup>
import { settings, settingsVisibility } from "../stores/settings.store";

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
</script>
<template>
  <div class="info flex justify-center space-x-1">
    <span>Use this tool only if you have read:</span>
    <a
      target="_blank"
      href="https://github.com/trapcodeio/passphrase-encrypter/blob/main/README.md"
      class="inline"
      ><span class="inline-block">How It Works!</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 inline-block -mt-1 ml-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  </div>

  <div class="p-3 mt-5 mb-3">
    <h5 class="text-lg text-center uppercase text-gray-700 font-bold">Settings</h5>

    <div class="settings mt-5">
      <div v-if="settingsVisibility.numberOfWords.includes($route.name as any)">
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

      <div v-if="settingsVisibility.verifyWords.includes($route.name as any)">
        <label>Verification:</label>
        <select v-model="settings.verifyWords" class="w-32" placeholder="Verify words">
          <option :value="false">None</option>
          <!-- <option value="confirm">Confirm (Medium)</option> -->
          <option value="retype">Retype (Recommended)</option>
        </select>
      </div>

      <div v-if="settingsVisibility.encryptionMethod.includes($route.name as any)">
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

      <div v-if="settingsVisibility.showDateInPubicData.includes($route.name as any)">
        <label>Show DATE in public data.</label>
        <Toggle v-model="settings.showDateInPubicData"></Toggle>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.settings {
  @apply flex flex-wrap gap-3 border-b pb-5;

  label {
    @apply text-xs block  px-1 text-gray-600 font-medium;
  }

  input,
  select {
    @apply text-primary-900 border text-sm;
  }
}
</style>
