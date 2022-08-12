<script lang="ts" setup>
import { settings } from "../stores/settings.store";

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
        <select v-model="settings.verifyWords" class="w-32" placeholder="Verify words">
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
</template>
<style scoped lang="scss">
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
