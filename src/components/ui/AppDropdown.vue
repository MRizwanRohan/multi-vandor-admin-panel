<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App Dropdown — General purpose dropdown menu -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { type Component } from 'vue'

export interface DropdownItem {
  label: string
  icon?: Component
  action?: () => void
  to?: string
  disabled?: boolean
  danger?: boolean
  divider?: boolean
}

interface Props {
  items: DropdownItem[]
  label?: string
  align?: 'left' | 'right'
  width?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  align: 'right',
  width: 'md',
})

const widthClasses: Record<string, string> = {
  sm: 'w-40',
  md: 'w-48',
  lg: 'w-56',
}
</script>

<template>
  <Menu as="div" class="relative inline-block text-left">
    <!-- Trigger -->
    <MenuButton
      class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
    >
      <slot name="trigger">
        {{ label }}
        <ChevronDownIcon class="h-4 w-4" />
      </slot>
    </MenuButton>

    <!-- Menu items -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <MenuItems
        :class="[
          'absolute z-50 mt-2 origin-top-right rounded-lg border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-gray-700 dark:bg-gray-800',
          widthClasses[width],
          align === 'right' ? 'right-0' : 'left-0',
        ]"
      >
        <template v-for="(item, index) in items" :key="index">
          <!-- Divider -->
          <div
            v-if="item.divider"
            class="my-1 border-t border-gray-100 dark:border-gray-700"
          />

          <!-- Menu item -->
          <MenuItem
            v-else
            v-slot="{ active }"
            :disabled="item.disabled"
          >
            <component
              :is="item.to ? 'router-link' : 'button'"
              :to="item.to"
              type="button"
              :class="[
                'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                active ? 'bg-gray-100 dark:bg-gray-700' : '',
                item.danger
                  ? 'text-danger-600 dark:text-danger-400'
                  : 'text-gray-700 dark:text-gray-200',
                item.disabled ? 'cursor-not-allowed opacity-50' : '',
              ]"
              @click="item.action?.()"
            >
              <component
                v-if="item.icon"
                :is="item.icon"
                class="h-4 w-4 shrink-0"
              />
              {{ item.label }}
            </component>
          </MenuItem>
        </template>
      </MenuItems>
    </Transition>
  </Menu>
</template>
