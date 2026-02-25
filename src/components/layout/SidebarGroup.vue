<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Sidebar Group — Grouped navigation items with collapsible header -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

interface Props {
  label: string
  collapsible?: boolean
  defaultOpen?: boolean
  collapsed?: boolean // sidebar collapsed state
}

const props = withDefaults(defineProps<Props>(), {
  collapsible: true,
  defaultOpen: true,
  collapsed: false,
})

const isOpen = ref(props.defaultOpen)

function toggle() {
  if (props.collapsible && !props.collapsed) {
    isOpen.value = !isOpen.value
  }
}

const showContent = computed(() => {
  if (props.collapsed) return true // always show icons when sidebar collapsed
  return isOpen.value
})
</script>

<template>
  <div class="mt-2">
    <!-- Group header -->
    <button
      v-if="!collapsed"
      type="button"
      :class="[
        'flex w-full items-center justify-between px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500',
        collapsible ? 'cursor-pointer hover:text-gray-500 dark:hover:text-gray-400' : 'cursor-default',
      ]"
      @click="toggle"
    >
      <span>{{ label }}</span>
      <ChevronDownIcon
        v-if="collapsible"
        :class="[
          'h-3.5 w-3.5 transition-transform duration-200',
          isOpen ? 'rotate-0' : '-rotate-90',
        ]"
      />
    </button>

    <!-- Group items -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[500px] opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="max-h-[500px] opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-show="showContent" class="overflow-hidden">
        <slot />
      </div>
    </Transition>
  </div>
</template>
