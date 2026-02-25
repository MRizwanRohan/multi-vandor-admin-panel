<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App Accordion — Collapsible sections -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

export interface AccordionItem {
  key: string
  title: string
  content?: string
  defaultOpen?: boolean
}

interface Props {
  items: AccordionItem[]
  multiple?: boolean
  bordered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  bordered: true,
})

// Track open items for single-mode
const openKey = ref<string | null>(
  props.items.find(i => i.defaultOpen)?.key ?? null
)

function isOpen(key: string) {
  return openKey.value === key
}

function toggle(key: string) {
  if (!props.multiple) {
    openKey.value = openKey.value === key ? null : key
  }
}

const containerClasses = computed(() => [
  'divide-y divide-gray-200 dark:divide-gray-700',
  props.bordered
    ? 'rounded-lg border border-gray-200 dark:border-gray-700'
    : '',
])
</script>

<template>
  <div :class="containerClasses">
    <template v-if="multiple">
      <!-- Multiple mode: each is independent -->
      <Disclosure
        v-for="item in items"
        :key="item.key"
        v-slot="{ open }"
        :default-open="item.defaultOpen"
        as="div"
      >
        <DisclosureButton
          class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-white dark:hover:bg-gray-800"
        >
          <span>{{ item.title }}</span>
          <ChevronDownIcon
            :class="[
              'h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400',
              open ? 'rotate-180' : '',
            ]"
          />
        </DisclosureButton>
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-96 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="max-h-96 opacity-100"
          leave-to-class="max-h-0 opacity-0"
        >
          <DisclosurePanel class="overflow-hidden px-4 pb-3 text-sm text-gray-600 dark:text-gray-400">
            <slot :name="item.key" :item="item">
              {{ item.content }}
            </slot>
          </DisclosurePanel>
        </Transition>
      </Disclosure>
    </template>

    <template v-else>
      <!-- Single mode: only one open at a time -->
      <div v-for="item in items" :key="item.key">
        <button
          type="button"
          class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-white dark:hover:bg-gray-800"
          @click="toggle(item.key)"
        >
          <span>{{ item.title }}</span>
          <ChevronDownIcon
            :class="[
              'h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400',
              isOpen(item.key) ? 'rotate-180' : '',
            ]"
          />
        </button>
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-96 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="max-h-96 opacity-100"
          leave-to-class="max-h-0 opacity-0"
        >
          <div
            v-show="isOpen(item.key)"
            class="overflow-hidden px-4 pb-3 text-sm text-gray-600 dark:text-gray-400"
          >
            <slot :name="item.key" :item="item">
              {{ item.content }}
            </slot>
          </div>
        </Transition>
      </div>
    </template>
  </div>
</template>
