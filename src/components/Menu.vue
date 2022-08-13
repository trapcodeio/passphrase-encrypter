<script setup lang="ts">
const tabs = [
  { name: "Encrypt", route: "encrypt" },
  { name: "Decrypt", route: "decrypt" }
  //   { name: "Team Members", href: "#", current: false },
  //   { name: "Billing", href: "#", current: false }
];
</script>

<template>
  <div class="max-w-xs mx-auto">
    <nav
      class="relative z-0 rounded-md shadow flex divide-x divide-gray-200"
      aria-label="Tabs"
    >
      <router-link
        v-for="(tab, tabIdx) in tabs"
        :key="tab.name"
        :to="{ name: tab.route }"
        :class="[
          tab.route === $route.name
            ? 'text-primary-700'
            : 'text-gray-500 hover:text-primary-700',
          tabIdx === 0 ? 'rounded-l-md' : '',
          tabIdx === tabs.length - 1 ? 'rounded-r-md' : '',
          'group relative min-w-0 flex-1 overflow-hidden bg-gray-50 py-3 text-sm font-medium text-center hover:bg-gray-100 focus:z-10'
        ]"
        :aria-current="tab.route === $route.name ? 'page' : undefined"
      >
        <span>{{ tab.name }}</span>
        <span
          aria-hidden="true"
          :class="[
            tab.route === $route.name ? 'bg-primary-500' : 'bg-transparent',
            'absolute inset-x-0 bottom-0 h-0.5'
          ]"
        />
      </router-link>
    </nav>
  </div>
</template>
