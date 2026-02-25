<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Settings — Container page with tabs (router-based) -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import {
  Cog6ToothIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  TruckIcon,
  EnvelopeIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const breadcrumbStore = useBreadcrumbStore()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Settings', [
    { label: 'Settings' },
  ], 'Configure your marketplace settings')
})

// Tab configuration with router paths
const tabs = [
  { id: 'general', label: 'General', icon: Cog6ToothIcon, path: '/admin/settings/general' },
  { id: 'payment', label: 'Payment', icon: BanknotesIcon, path: '/admin/settings/payment' },
  { id: 'shipping', label: 'Shipping', icon: TruckIcon, path: '/admin/settings/shipping' },
  { id: 'email', label: 'Email', icon: EnvelopeIcon, path: '/admin/settings/email' },
  { id: 'commission', label: 'Commission', icon: CurrencyDollarIcon, path: '/admin/settings/commission' },
]

// Active tab based on route
const activeTab = computed(() => {
  const path = route.path
  return tabs.find(tab => path.includes(tab.id))?.id || 'general'
})

</script>

<template>
  <div class="mx-auto max-w-4xl">
    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex space-x-8">
        <router-link
          v-for="tab in tabs"
          :key="tab.id"
          :to="tab.path"
          class="flex items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium transition-colors"
          :class="[
            activeTab === tab.id
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          ]"
        >
          <component :is="tab.icon" class="h-5 w-5" />
          {{ tab.label }}
        </router-link>
      </nav>
    </div>

    <!-- Child route content -->
    <router-view />
  </div>
</template>
