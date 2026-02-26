<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App Header — Top navigation header component -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { useAuthStore, useUIStore } from '@/stores'
import {
  Bars3Icon,
  MoonIcon,
  SunIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/vue/24/outline'
import { useRouter } from 'vue-router'
import NotificationDropdown from './NotificationDropdown.vue'

interface Props {
  dashboardType: 'admin' | 'vendor'
}

interface Emits {
  (e: 'toggleSidebar'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

// Toggle theme
function toggleTheme() {
  if (uiStore.isDark) {
    uiStore.setTheme('light')
  } else {
    uiStore.setTheme('dark')
  }
}

// Logout
async function handleLogout() {
  await authStore.logout()
}

// Navigate to profile
function goToProfile() {
  const path = props.dashboardType === 'admin' ? '/admin/profile' : '/vendor/profile'
  router.push(path)
}

// Navigate to settings
function goToSettings() {
  const path = props.dashboardType === 'admin' ? '/admin/settings' : '/vendor/shop-settings'
  router.push(path)
}
</script>

<template>
  <header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
    <!-- Left side -->
    <div class="flex items-center">
      <!-- Mobile menu button -->
      <button
        class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-700"
        @click="emit('toggleSidebar')"
      >
        <Bars3Icon class="h-6 w-6" />
      </button>

      <!-- Search (optional) -->
      <div class="ml-4 hidden sm:block">
        <div class="relative">
          <input
            type="search"
            placeholder="Search..."
            class="w-64 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pl-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Right side -->
    <div class="flex items-center space-x-2">
      <!-- Theme toggle -->
      <button
        class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        @click="toggleTheme"
        :title="uiStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <MoonIcon v-if="!uiStore.isDark" class="h-5 w-5" />
        <SunIcon v-else class="h-5 w-5" />
      </button>

      <!-- Notifications (dynamic component) -->
      <NotificationDropdown />

      <!-- User menu -->
      <Menu as="div" class="relative">
        <MenuButton class="flex items-center rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
            <span class="text-sm font-semibold">
              {{ authStore.user?.full_name?.charAt(0)?.toUpperCase() || 'U' }}
            </span>
          </div>
          <span class="ml-2 hidden text-sm font-medium text-gray-700 sm:block dark:text-gray-300">
            {{ authStore.user?.full_name || 'User' }}
          </span>
          <svg class="ml-2 hidden h-4 w-4 text-gray-400 sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </MenuButton>

        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <MenuItems
            class="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700"
          >
            <div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ authStore.user?.full_name || 'User' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ authStore.user?.email }}
              </p>
            </div>

            <div class="py-1">
              <MenuItem v-slot="{ active }">
                <button
                  class="flex w-full items-center px-4 py-2 text-sm"
                  :class="active ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-700 dark:text-gray-300'"
                  @click="goToProfile"
                >
                  <UserCircleIcon class="mr-3 h-5 w-5 text-gray-400" />
                  Profile
                </button>
              </MenuItem>

              <MenuItem v-slot="{ active }">
                <button
                  class="flex w-full items-center px-4 py-2 text-sm"
                  :class="active ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-700 dark:text-gray-300'"
                  @click="goToSettings"
                >
                  <Cog6ToothIcon class="mr-3 h-5 w-5 text-gray-400" />
                  Settings
                </button>
              </MenuItem>
            </div>

            <div class="border-t border-gray-200 py-1 dark:border-gray-700">
              <MenuItem v-slot="{ active }">
                <button
                  class="flex w-full items-center px-4 py-2 text-sm"
                  :class="active ? 'bg-gray-100 text-danger-600 dark:bg-gray-700' : 'text-danger-600'"
                  @click="handleLogout"
                >
                  <ArrowRightOnRectangleIcon class="mr-3 h-5 w-5" />
                  Logout
                </button>
              </MenuItem>
            </div>
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  </header>
</template>
