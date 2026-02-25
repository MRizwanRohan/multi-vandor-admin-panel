<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Language Switcher — Toggle between available locales -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref } from 'vue'
import { useLocale } from '@/composables'
import { LanguageIcon, CheckIcon } from '@heroicons/vue/24/outline'

const { locale, availableLocales, currentLocale, setLocale } = useLocale()

// Dropdown state
const isOpen = ref(false)

function selectLocale(code: string) {
  setLocale(code)
  isOpen.value = false
}

// Close on click outside
function closeDropdown() {
  isOpen.value = false
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
      @click="isOpen = !isOpen"
    >
      <LanguageIcon class="h-5 w-5" />
      <span class="hidden sm:inline">{{ currentLocale?.nativeName || 'Language' }}</span>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10"
      >
        <button
          v-for="loc in availableLocales"
          :key="loc.code"
          type="button"
          class="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          @click="selectLocale(loc.code)"
        >
          <span>{{ loc.nativeName }}</span>
          <CheckIcon
            v-if="locale === loc.code"
            class="h-4 w-4 text-primary-500"
          />
        </button>
      </div>
    </Transition>

    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="closeDropdown"
    />
  </div>
</template>
