<template>
  <button
    @click.prevent="toggle"
    :class="{
      'bg-primary-600': enabled,
      'bg-gray-700': !enabled
    }"
    type="button"
    class="toggle"
    role="switch"
    aria-checked="false"
  >
    <span v-if="title" class="sr-only">{{ title }}</span>
    <!-- Enabled: "translate-x-5", Not Enabled: "translate-x-0" -->
    <span
      aria-hidden="true"
      class="toggler"
      :class="{
        'translate-x-5': enabled,
        'translate-x-0': !enabled
      }"
    ></span>
  </button>
</template>

<script lang="ts" setup>
import { computed } from "vue";
const emit = defineEmits(["update:modelValue", "onToggle"]);

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String }
});

const enabled = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
    emit("onToggle", value);
  }
});

function toggle() {
  enabled.value = !enabled.value;
}
</script>

<style scoped>
.toggle {
  @apply relative
  inline-flex
  flex-shrink-0
  h-6
  w-11
  border-2
  rounded-full
  cursor-pointer
  transition-colors
  ease-in-out
  duration-200;
}

.toggler {
  @apply pointer-events-none
  inline-block
  h-5
  w-5
  rounded-full
  bg-white
  shadow
  transform
  ring-0
  transition
  ease-in-out
  duration-200;
}
</style>
