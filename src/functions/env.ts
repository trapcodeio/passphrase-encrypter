import { ref } from "vue";

// Set isDev value
export const isDev = import.meta.env.DEV;

// If disabled all results will be set to production values.
let showDevValues = ref(true);

// Turn off dev values
export function turnOffDevValues() {
  showDevValues.value = false;
}

/**
 * If Development mode is enabled, show the dev values.
 * @param yes - value to show if dev
 * @param no - value to show if production
 * @returns
 */
export function ifDev<T = any>(yes: T, no?: T) {
  return isDev && showDevValues.value ? yes : no;
}

export function ifDevRun<T = any>(fn: () => T) {
  if (isDev) return fn();
}

export function ifProdRun<T = any>(fn: () => T) {
  if (!isDev) return fn();
}
