<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- App Sidebar — Navigation sidebar component -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores'
import { useLocale } from '@/composables'
import {
  HomeIcon,
  ShoppingBagIcon,
  FolderIcon,
  TagIcon,
  UsersIcon,
  ShoppingCartIcon,
  StarIcon,
  TicketIcon,
  BanknotesIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CubeIcon,
  WalletIcon,
  BuildingStorefrontIcon,
  XMarkIcon,
  DocumentChartBarIcon,
  ServerIcon,
  TruckIcon,
  MegaphoneIcon,
  QuestionMarkCircleIcon,
  GlobeAltIcon,
  ChevronDownIcon,
  IdentificationIcon,
  BoltIcon,
  PhotoIcon,
  EnvelopeIcon,
} from '@heroicons/vue/24/outline'

interface NavItem {
  name: string
  to: string
  icon: Component
  children?: { name: string; to: string }[]
}

interface Props {
  dashboardType: 'admin' | 'vendor'
  collapsed: boolean
  mobileOpen: boolean
}

interface Emits {
  (e: 'toggle'): void
  (e: 'closeMobile'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const route = useRoute()
const authStore = useAuthStore()
const { locale, setLocale } = useLocale()

// Expanded menu groups
const expandedGroups = ref<Set<string>>(new Set())

// Toggle language
function toggleLanguage() {
  const nextLocale = locale.value === 'en' ? 'bn' : 'en'
  setLocale(nextLocale)
}

// Toggle group expansion
function toggleGroup(name: string) {
  if (expandedGroups.value.has(name)) {
    expandedGroups.value.delete(name)
  } else {
    expandedGroups.value.add(name)
  }
}

// Admin navigation items
const adminNavItems: NavItem[] = [
  {
    name: 'Dashboard',
    to: '/admin/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Products',
    to: '/admin/products',
    icon: ShoppingBagIcon,
  },
  {
    name: 'Categories',
    to: '/admin/categories',
    icon: FolderIcon,
    children: [
      { name: 'All Categories', to: '/admin/categories' },
      { name: 'Pending Approval', to: '/admin/categories/pending' },
    ],
  },
  {
    name: 'Attribute Templates',
    to: '/admin/attribute-templates',
    icon: TagIcon,
  },
  {
    name: 'Vendors',
    to: '/admin/vendors',
    icon: BuildingStorefrontIcon,
  },
  {
    name: 'Orders',
    to: '/admin/orders',
    icon: ShoppingCartIcon,
  },
  {
    name: 'Customers',
    to: '/admin/customers',
    icon: UsersIcon,
  },
  {
    name: 'Inventory',
    to: '/admin/inventory',
    icon: CubeIcon,
    children: [
      { name: 'Overview', to: '/admin/inventory' },
      { name: 'Stock Alerts', to: '/admin/inventory/alerts' },
      { name: 'Movements', to: '/admin/inventory/movements' },
      { name: 'Reservations', to: '/admin/inventory/reservations' },
    ],
  },
  {
    name: 'Reviews',
    to: '/admin/reviews',
    icon: StarIcon,
  },
  {
    name: 'Marketing',
    to: '/admin/coupons',
    icon: MegaphoneIcon,
    children: [
      { name: 'Coupons', to: '/admin/coupons' },
      { name: 'Flash Sales', to: '/admin/flash-sales' },
      { name: 'Banners', to: '/admin/banners' },
      { name: 'Newsletter', to: '/admin/newsletter' },
    ],
  },
  {
    name: 'Payments',
    to: '/admin/payments',
    icon: CreditCardIcon,
    children: [
      { name: 'Transactions', to: '/admin/payments' },
      { name: 'Refunds', to: '/admin/payments/refunds' },
      { name: 'Webhooks', to: '/admin/payments/webhooks' },
    ],
  },
  {
    name: 'Commissions',
    to: '/admin/commissions',
    icon: BanknotesIcon,
  },
  {
    name: 'Payouts',
    to: '/admin/payouts',
    icon: BanknotesIcon,
  },
  {
    name: 'Shipping',
    to: '/admin/shipping',
    icon: TruckIcon,
    children: [
      { name: 'Shipping Zones', to: '/admin/shipping/zones' },
      { name: 'Shipping Methods', to: '/admin/shipping/methods' },
    ],
  },
  {
    name: 'Reports',
    to: '/admin/reports',
    icon: DocumentChartBarIcon,
    children: [
      { name: 'Sales Report', to: '/admin/reports/sales' },
      { name: 'Vendor Report', to: '/admin/reports/vendors' },
      { name: 'Product Report', to: '/admin/reports/products' },
    ],
  },
  {
    name: 'System',
    to: '/admin/system',
    icon: ServerIcon,
    children: [
      { name: 'Activity Log', to: '/admin/system/activity' },
      { name: 'System Health', to: '/admin/system/health' },
    ],
  },
  {
    name: 'Settings',
    to: '/admin/settings',
    icon: Cog6ToothIcon,
  },
]

// Vendor navigation items
const vendorNavItems: NavItem[] = [
  {
    name: 'Dashboard',
    to: '/vendor/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'My Products',
    to: '/vendor/products',
    icon: ShoppingBagIcon,
  },
  {
    name: 'Categories',
    to: '/vendor/categories',
    icon: FolderIcon,
    children: [
      { name: 'Browse Categories', to: '/vendor/categories' },
      { name: 'My Categories', to: '/vendor/categories/my' },
      { name: 'Suggest Category', to: '/vendor/categories/suggest' },
    ],
  },
  {
    name: 'Orders',
    to: '/vendor/orders',
    icon: ShoppingCartIcon,
  },
  {
    name: 'Inventory',
    to: '/vendor/inventory',
    icon: CubeIcon,
  },
  {
    name: 'Shipping',
    to: '/vendor/shipping',
    icon: TruckIcon,
    children: [
      { name: 'Shipping Settings', to: '/vendor/shipping' },
      { name: 'Shipments', to: '/vendor/shipments' },
    ],
  },
  {
    name: 'Analytics',
    to: '/vendor/analytics',
    icon: ChartBarIcon,
  },
  {
    name: 'Earnings',
    to: '/vendor/earnings',
    icon: WalletIcon,
  },
  {
    name: 'Payouts',
    to: '/vendor/payouts',
    icon: CreditCardIcon,
  },
  {
    name: 'Reviews',
    to: '/vendor/reviews',
    icon: StarIcon,
  },
  {
    name: 'Coupons',
    to: '/vendor/coupons',
    icon: TicketIcon,
  },
  {
    name: 'Promotions',
    to: '/vendor/promotions',
    icon: MegaphoneIcon,
  },
  {
    name: 'Reports',
    to: '/vendor/reports',
    icon: DocumentChartBarIcon,
  },
  {
    name: 'Shop Settings',
    to: '/vendor/settings/shop',
    icon: BuildingStorefrontIcon,
  },
  {
    name: 'Bank Details',
    to: '/vendor/settings/bank-details',
    icon: BanknotesIcon,
  },
  {
    name: 'NID Verification',
    to: '/vendor/settings/nid',
    icon: IdentificationIcon,
  },
  {
    name: 'Help & Support',
    to: '/vendor/support',
    icon: QuestionMarkCircleIcon,
  },
]

// Get navigation items based on dashboard type
const navigationItems = computed(() => {
  return props.dashboardType === 'admin' ? adminNavItems : vendorNavItems
})

// Check if route is active
function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}

// Check if group is expanded or has active child
function isGroupExpanded(item: NavItem): boolean {
  if (!item.children) return false
  return expandedGroups.value.has(item.name) || item.children.some(child => isActive(child.to))
}
</script>

<template>
  <!-- Sidebar -->
  <aside
    class="fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-lg transition-all duration-300 dark:bg-gray-800"
    :class="[
      collapsed ? 'w-20' : 'w-64',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <!-- Logo area -->
    <div class="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
      <RouterLink
        to="/"
        class="flex items-center space-x-3"
        :class="{ 'justify-center': collapsed }"
      >
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600">
          <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <span
          v-if="!collapsed"
          class="text-lg font-bold text-gray-900 dark:text-white"
        >
          MVE
        </span>
      </RouterLink>

      <!-- Mobile close button -->
      <button
        class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-700"
        @click="emit('closeMobile')"
      >
        <XMarkIcon class="h-5 w-5" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto p-4">
      <ul class="space-y-1">
        <li v-for="item in navigationItems" :key="item.to">
          <!-- Item with children (expandable) -->
          <template v-if="item.children && item.children.length > 0">
            <button
              class="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              :class="[
                isActive(item.to)
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                collapsed ? 'justify-center' : '',
              ]"
              :title="collapsed ? item.name : undefined"
              @click="toggleGroup(item.name)"
            >
              <component
                :is="item.icon"
                class="h-5 w-5 shrink-0"
                :class="[
                  isActive(item.to)
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400',
                  collapsed ? '' : 'mr-3',
                ]"
              />
              <span v-if="!collapsed" class="flex-1 text-left">{{ item.name }}</span>
              <ChevronDownIcon
                v-if="!collapsed"
                class="h-4 w-4 transition-transform"
                :class="{ 'rotate-180': isGroupExpanded(item) }"
              />
            </button>
            
            <!-- Children -->
            <ul
              v-if="!collapsed && isGroupExpanded(item)"
              class="ml-8 mt-1 space-y-1"
            >
              <li v-for="child in item.children" :key="child.to">
                <RouterLink
                  :to="child.to"
                  class="block rounded-lg px-3 py-2 text-sm transition-colors"
                  :class="[
                    route.path === child.to
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700',
                  ]"
                >
                  {{ child.name }}
                </RouterLink>
              </li>
            </ul>
          </template>

          <!-- Item without children -->
          <template v-else>
            <RouterLink
              :to="item.to"
              class="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              :class="[
                isActive(item.to)
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                collapsed ? 'justify-center' : '',
              ]"
              :title="collapsed ? item.name : undefined"
            >
              <component
                :is="item.icon"
                class="h-5 w-5 shrink-0"
                :class="[
                  isActive(item.to)
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400',
                  collapsed ? '' : 'mr-3',
                ]"
              />
              <span v-if="!collapsed">{{ item.name }}</span>
            </RouterLink>
          </template>
        </li>
      </ul>
    </nav>

    <!-- Language Toggle -->
    <div v-if="!collapsed" class="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
      <button
        class="flex w-full items-center rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        @click="toggleLanguage"
      >
        <GlobeAltIcon class="mr-3 h-5 w-5 text-gray-400" />
        <span>{{ locale === 'en' ? 'বাংলা' : 'English' }}</span>
      </button>
    </div>

    <!-- User info -->
    <div class="border-t border-gray-200 p-4 dark:border-gray-700">
      <div
        class="flex items-center"
        :class="{ 'justify-center': collapsed }"
      >
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
          <span class="text-sm font-semibold">
            {{ authStore.user?.full_name?.charAt(0)?.toUpperCase() || 'U' }}
          </span>
        </div>
        <div v-if="!collapsed" class="ml-3 min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
            {{ authStore.user?.full_name || 'User' }}
          </p>
          <p class="truncate text-xs text-gray-500 dark:text-gray-400">
            {{ dashboardType === 'admin' ? 'Administrator' : 'Vendor' }}
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>
