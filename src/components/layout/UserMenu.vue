<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- User Menu — Profile dropdown menu for header -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores'
import AppAvatar from '../ui/AppAvatar.vue'

interface Props {
  dashboardType?: 'admin' | 'vendor'
}

const props = withDefaults(defineProps<Props>(), {
  dashboardType: 'admin',
})

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

function goToProfile() {
  const path = props.dashboardType === 'admin' ? '/admin/profile' : '/vendor/profile'
  router.push(path)
}

function goToSettings() {
  const path = props.dashboardType === 'admin' ? '/admin/settings' : '/vendor/shop-settings'
  router.push(path)
}

async function handleLogout() {
  await authStore.logout()
}
</script>

<template>
  <Menu as="div" class="relative">
    <MenuButton
      class="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:hover:bg-gray-800"
    >
      <AppAvatar
        :src="user?.avatar"
        :name="user?.name"
        size="sm"
      />
      <div class="hidden text-left md:block">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">
          {{ user?.name || 'User' }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ user?.role || dashboardType }}
        </p>
      </div>
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
        class="absolute right-0 z-50 mt-2 w-52 origin-top-right rounded-xl border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
      >
        <!-- User info -->
        <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ user?.name }}
          </p>
          <p class="truncate text-xs text-gray-500 dark:text-gray-400">
            {{ user?.email }}
          </p>
        </div>

        <!-- Profile -->
        <MenuItem v-slot="{ active }">
          <button
            type="button"
            :class="[
              'flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200',
              active ? 'bg-gray-100 dark:bg-gray-700' : '',
            ]"
            @click="goToProfile"
          >
            <UserCircleIcon class="h-4 w-4" />
            My Profile
          </button>
        </MenuItem>

        <!-- Settings -->
        <MenuItem v-slot="{ active }">
          <button
            type="button"
            :class="[
              'flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200',
              active ? 'bg-gray-100 dark:bg-gray-700' : '',
            ]"
            @click="goToSettings"
          >
            <Cog6ToothIcon class="h-4 w-4" />
            Settings
          </button>
        </MenuItem>

        <div class="my-1 border-t border-gray-100 dark:border-gray-700" />

        <!-- Logout -->
        <MenuItem v-slot="{ active }">
          <button
            type="button"
            :class="[
              'flex w-full items-center gap-2 px-4 py-2 text-sm text-danger-600 dark:text-danger-400',
              active ? 'bg-gray-100 dark:bg-gray-700' : '',
            ]"
            @click="handleLogout"
          >
            <ArrowRightOnRectangleIcon class="h-4 w-4" />
            Sign out
          </button>
        </MenuItem>
      </MenuItems>
    </Transition>
  </Menu>
</template>
