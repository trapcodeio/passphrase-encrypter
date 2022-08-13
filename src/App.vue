<script setup lang="ts">
import { isDev } from "./functions/env";
</script>
<template>
  <div class="max-w-4xl mx-auto py-10">
    <h2 class="text-2xl font-bold text-center">
      <span class="text-gray-700">Mnemonic</span>
      <span class="text-primary-700 mx-2">Pass Phrase</span>
      <span class="text-gray-700">Encrypter</span>
      <sup class="text-primary-700 font-bold text-sm ml-2">(Open Source)</sup>
    </h2>

    <Menu class="my-5 lg:my-10" />

    <router-view v-if="isDev"></router-view>
    <router-view v-else v-slot="{ Component, route }">
      <keep-alive>
        <component :is="Component" :key="route.name" />
      </keep-alive>
    </router-view>
  </div>
</template>
