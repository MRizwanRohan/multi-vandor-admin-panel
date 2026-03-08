<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Search Command — ⌘K Command palette search -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { MagnifyingGlassIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import {
  HomeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ShoppingCartIcon,
  Cog6ToothIcon,
  FolderIcon,
  TagIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
} from '@heroicons/vue/24/outline'
import { searchService } from '@/services/search.service'
import type { AdminSearchResults, VendorSearchResults } from '@/types/search'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: typeof HomeIcon
  to: string
  group: string
}

interface Props {
  dashboardType?: 'admin' | 'vendor'
}

const props = withDefaults(defineProps<Props>(), {
  dashboardType: 'admin',
})

const router = useRouter()
const isOpen = ref(false)
const query = ref('')

// ─── API search state ─────────────────────────────────────────────────────
const isLoading = ref(false)
const apiResults = ref<AdminSearchResults | VendorSearchResults | null>(null)
const totalApiResults = ref(0)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function runSearch(q: string) {
  if (q.length < 2) {
    apiResults.value = null
    totalApiResults.value = 0
    return
  }
  isLoading.value = true
  try {
    if (props.dashboardType === 'admin') {
      const { results, meta } = await searchService.adminSearch(q, 'all', 5)
      apiResults.value = results
      totalApiResults.value = meta.total_results
    } else {
      const { results, meta } = await searchService.vendorSearch(q, 'all', 5)
      apiResults.value = results
      totalApiResults.value = meta.total_results
    }
  } catch {
    apiResults.value = null
    totalApiResults.value = 0
  } finally {
    isLoading.value = false
  }
}

watch(query, newVal => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (newVal.length < 2) {
    apiResults.value = null
    totalApiResults.value = 0
    return
  }
  debounceTimer = setTimeout(() => runSearch(newVal), 300)
})

// ─── Quick navigation commands ────────────────────────────────────────────
const commands = computed<CommandItem[]>(() => {
  const prefix = `/${props.dashboardType}`
  const base: CommandItem[] = [
    { id: 'dashboard', label: 'Dashboard', description: 'Go to dashboard', icon: HomeIcon, to: `${prefix}/dashboard`, group: 'Quick Nav' },
    { id: 'products', label: 'Products', description: 'Manage products', icon: ShoppingBagIcon, to: `${prefix}/products`, group: 'Quick Nav' },
    { id: 'orders', label: 'Orders', description: 'View orders', icon: ShoppingCartIcon, to: `${prefix}/orders`, group: 'Quick Nav' },
  ]

  if (props.dashboardType === 'admin') {
    base.push(
      { id: 'categories', label: 'Categories', description: 'Manage categories', icon: FolderIcon, to: '/admin/categories', group: 'Quick Nav' },
      { id: 'vendors', label: 'Vendors', description: 'Manage vendors', icon: BuildingStorefrontIcon, to: '/admin/vendors', group: 'Quick Nav' },
      { id: 'customers', label: 'Customers', description: 'View customers', icon: UsersIcon, to: '/admin/customers', group: 'Quick Nav' },
      { id: 'coupons', label: 'Coupons', description: 'Manage coupons', icon: TagIcon, to: '/admin/coupons', group: 'Quick Nav' },
      { id: 'analytics', label: 'Analytics', description: 'View analytics', icon: ChartBarIcon, to: '/admin/analytics', group: 'Quick Nav' },
      { id: 'settings', label: 'Settings', description: 'System settings', icon: Cog6ToothIcon, to: '/admin/settings', group: 'Quick Nav' },
    )
  } else {
    base.push(
      { id: 'analytics', label: 'Analytics', description: 'Store analytics', icon: ChartBarIcon, to: '/vendor/analytics', group: 'Quick Nav' },
      { id: 'earnings', label: 'Earnings', description: 'View earnings', icon: ChartBarIcon, to: '/vendor/earnings', group: 'Quick Nav' },
      { id: 'shop-settings', label: 'Shop Settings', description: 'Edit shop', icon: Cog6ToothIcon, to: '/vendor/shop-settings', group: 'Quick Nav' },
    )
  }

  return base
})

// Filtered commands based on query (only show when no API results or short query)
const filteredCommands = computed(() => {
  if (!query.value) return commands.value
  const q = query.value.toLowerCase()
  return commands.value.filter(
    c =>
      c.label.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
  )
})

// Grouped static commands
const groupedCommands = computed(() => {
  const groups: Record<string, CommandItem[]> = {}
  for (const cmd of filteredCommands.value) {
    if (!groups[cmd.group]) groups[cmd.group] = []
    groups[cmd.group]!.push(cmd)
  }
  return groups
})

// Whether we have any API results to show
const hasApiResults = computed(() => {
  if (!apiResults.value) return false
  return Object.values(apiResults.value).some(arr => Array.isArray(arr) && arr.length > 0)
})

// Admin-only typed results
const adminResults = computed(() =>
  props.dashboardType === 'admin' ? (apiResults.value as AdminSearchResults | null) : null,
)
const vendorResults = computed(() =>
  props.dashboardType === 'vendor' ? (apiResults.value as VendorSearchResults | null) : null,
)

// ─── Actions ──────────────────────────────────────────────────────────────
function open() {
  isOpen.value = true
  query.value = ''
}

function close() {
  isOpen.value = false
}

function navigate(url: string) {
  router.push(url)
  close()
}

function selectCommand(cmd: CommandItem) {
  router.push(cmd.to)
  close()
}

// Global keyboard shortcut
function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    open()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (debounceTimer) clearTimeout(debounceTimer)
})

// Reset state when closed
watch(isOpen, val => {
  if (!val) {
    query.value = ''
    apiResults.value = null
    totalApiResults.value = 0
  }
})

defineExpose({ open })
</script>

<template>
  <!-- ── Trigger bar ─────────────────────────────────────────────────── -->
  <button
    type="button"
    class="group flex w-72 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-400 shadow-sm ring-1 ring-transparent transition-all duration-150 hover:border-primary-300 hover:bg-white hover:text-gray-500 hover:ring-primary-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-500 dark:hover:border-primary-600 dark:hover:bg-gray-800"
    @click="open"
  >
    <MagnifyingGlassIcon class="h-4 w-4 shrink-0 transition-colors group-hover:text-primary-500" />
    <span class="flex-1 text-left">Search anything...</span>
    <span class="flex items-center gap-0.5">
      <kbd class="flex h-5 items-center rounded bg-gray-200 px-1.5 font-sans text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">⌘</kbd>
      <kbd class="flex h-5 items-center rounded bg-gray-200 px-1.5 font-sans text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">K</kbd>
    </span>
  </button>

  <!-- ── Command palette dialog ──────────────────────────────────────── -->
  <TransitionRoot :show="isOpen" as="template">
    <Dialog class="relative z-[100]" @close="close">
      <!-- Backdrop -->
      <TransitionChild
        enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100"
        leave="ease-in duration-150"  leave-from="opacity-100" leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 flex items-start justify-center p-4 pt-[10vh]">
        <TransitionChild
          enter="ease-out duration-200" enter-from="opacity-0 translate-y-2 scale-95" enter-to="opacity-100 translate-y-0 scale-100"
          leave="ease-in duration-150"  leave-from="opacity-100 translate-y-0 scale-100" leave-to="opacity-0 translate-y-2 scale-95"
        >
          <DialogPanel class="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] dark:border-gray-700 dark:bg-gray-900">

            <!-- Search header -->
            <div class="flex items-center gap-3 border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <MagnifyingGlassIcon class="h-4 w-4 text-primary-500" />
              </div>
              <input
                v-model="query"
                type="text"
                class="h-8 w-full border-0 bg-transparent text-[15px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-white dark:placeholder-gray-500"
                placeholder="Search products, orders, customers…"
                autofocus
              />
              <div class="flex shrink-0 items-center gap-2">
                <span v-if="isLoading" class="h-4 w-4 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600" />
                <kbd
                  class="flex h-6 cursor-pointer items-center rounded-md border border-gray-200 bg-gray-100 px-1.5 text-[10px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  @click="close"
                >ESC</kbd>
              </div>
            </div>

            <!-- Results pane -->
            <div class="max-h-[520px] overflow-y-auto overscroll-contain py-2">

              <!-- Loading skeleton -->
              <div v-if="isLoading" class="space-y-1 px-3 py-2">
                <div v-for="i in 4" :key="i" class="flex items-center gap-3 rounded-lg px-3 py-2.5">
                  <div class="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                  <div class="flex-1 space-y-1.5">
                    <div class="h-3 w-3/5 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
                    <div class="h-2.5 w-2/5 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
                  </div>
                </div>
              </div>

              <template v-else>

                <!-- ──────────── API Results ──────────── -->
                <template v-if="hasApiResults">

                  <!-- Products -->
                  <template v-if="adminResults?.products?.length || vendorResults?.products?.length">
                    <div class="mb-1 flex items-center gap-2 px-5 pt-3 pb-1">
                      <span class="flex h-4 w-4 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/40">
                        <ShoppingBagIcon class="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                      </span>
                      <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Products</span>
                    </div>
                    <div class="px-3">
                      <button
                        v-for="item in (adminResults?.products ?? vendorResults?.products ?? [])"
                        :key="`product-${item.id}`"
                        type="button"
                        class="group/item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        @click="navigate(item.url)"
                      >
                        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                          <ShoppingBagIcon class="h-4 w-4" />
                        </div>
                        <div class="min-w-0 flex-1 text-left">
                          <p class="truncate text-[13px] font-semibold text-gray-800 dark:text-gray-100">{{ item.name }}</p>
                          <p class="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                            <span v-if="item.sku">SKU {{ item.sku }}</span>
                            <span v-if="item.sku && item.category" class="mx-1">·</span>
                            <span v-if="item.category">{{ item.category }}</span>
                          </p>
                        </div>
                        <div class="shrink-0 text-right">
                          <span class="text-[12px] font-semibold text-gray-700 dark:text-gray-300">${{ item.price }}</span>
                          <div class="mt-0.5 flex justify-end">
                            <span :class="item.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'"
                              class="rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                              {{ item.is_active ? 'Active' : 'Inactive' }}
                            </span>
                          </div>
                        </div>
                      </button>
                    </div>
                  </template>

                  <!-- Orders -->
                  <template v-if="adminResults?.orders?.length || vendorResults?.orders?.length">
                    <div class="mb-1 flex items-center gap-2 px-5 pt-3 pb-1">
                      <span class="flex h-4 w-4 items-center justify-center rounded bg-amber-100 dark:bg-amber-900/40">
                        <ShoppingCartIcon class="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" />
                      </span>
                      <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Orders</span>
                    </div>
                    <div class="px-3">
                      <button
                        v-for="item in (adminResults?.orders ?? vendorResults?.orders ?? [])"
                        :key="`order-${item.id}`"
                        type="button"
                        class="group/item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all hover:bg-amber-50 dark:hover:bg-amber-950/20"
                        @click="navigate(item.url)"
                      >
                        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                          <ShoppingCartIcon class="h-4 w-4" />
                        </div>
                        <div class="min-w-0 flex-1 text-left">
                          <p class="truncate text-[13px] font-semibold text-gray-800 dark:text-gray-100">{{ item.order_number }}</p>
                          <p class="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">{{ item.customer ?? 'Unknown customer' }}</p>
                        </div>
                        <div class="shrink-0 text-right">
                          <span class="text-[12px] font-semibold text-gray-700 dark:text-gray-300">${{ item.total_amount }}</span>
                          <div class="mt-0.5 flex justify-end">
                            <span :class="{
                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': item.status === 'completed' || item.status === 'delivered',
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': item.status === 'processing',
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': item.status === 'pending',
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': item.status === 'cancelled',
                              'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400': !['completed','delivered','processing','pending','cancelled'].includes(item.status),
                            }" class="rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize">{{ item.status }}</span>
                          </div>
                        </div>
                      </button>
                    </div>
                  </template>

                  <!-- Customers (admin only) -->
                  <template v-if="adminResults?.customers?.length">
                    <div class="mb-1 flex items-center gap-2 px-5 pt-3 pb-1">
                      <span class="flex h-4 w-4 items-center justify-center rounded bg-purple-100 dark:bg-purple-900/40">
                        <UsersIcon class="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" />
                      </span>
                      <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Customers</span>
                    </div>
                    <div class="px-3">
                      <button
                        v-for="item in adminResults.customers"
                        :key="`customer-${item.id}`"
                        type="button"
                        class="group/item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all hover:bg-purple-50 dark:hover:bg-purple-950/20"
                        @click="navigate(item.url)"
                      >
                        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 text-[11px] font-bold">
                          {{ item.name.charAt(0).toUpperCase() }}
                        </div>
                        <div class="min-w-0 flex-1 text-left">
                          <p class="truncate text-[13px] font-semibold text-gray-800 dark:text-gray-100">{{ item.name }}</p>
                          <p class="truncate text-[11px] text-gray-400 dark:text-gray-500">{{ item.email }}</p>
                        </div>
                        <span v-if="item.phone" class="shrink-0 text-[11px] text-gray-400">{{ item.phone }}</span>
                      </button>
                    </div>
                  </template>

                  <!-- Vendors (admin only) -->
                  <template v-if="adminResults?.vendors?.length">
                    <div class="mb-1 flex items-center gap-2 px-5 pt-3 pb-1">
                      <span class="flex h-4 w-4 items-center justify-center rounded bg-emerald-100 dark:bg-emerald-900/40">
                        <BuildingStorefrontIcon class="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                      </span>
                      <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Vendors</span>
                    </div>
                    <div class="px-3">
                      <button
                        v-for="item in adminResults.vendors"
                        :key="`vendor-${item.id}`"
                        type="button"
                        class="group/item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                        @click="navigate(item.url)"
                      >
                        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 text-[11px] font-bold">
                          {{ item.store_name.charAt(0).toUpperCase() }}
                        </div>
                        <div class="min-w-0 flex-1 text-left">
                          <p class="truncate text-[13px] font-semibold text-gray-800 dark:text-gray-100">{{ item.store_name }}</p>
                          <p class="truncate text-[11px] text-gray-400 dark:text-gray-500">{{ item.email }}</p>
                        </div>
                        <span v-if="item.total_sales" class="shrink-0 text-[12px] font-semibold text-gray-600 dark:text-gray-400">${{ item.total_sales }}</span>
                      </button>
                    </div>
                  </template>

                  <!-- Categories (admin only) -->
                  <template v-if="adminResults?.categories?.length">
                    <div class="mb-1 flex items-center gap-2 px-5 pt-3 pb-1">
                      <span class="flex h-4 w-4 items-center justify-center rounded bg-orange-100 dark:bg-orange-900/40">
                        <FolderIcon class="h-2.5 w-2.5 text-orange-600 dark:text-orange-400" />
                      </span>
                      <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Categories</span>
                    </div>
                    <div class="px-3">
                      <button
                        v-for="item in adminResults.categories"
                        :key="`category-${item.id}`"
                        type="button"
                        class="group/item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all hover:bg-orange-50 dark:hover:bg-orange-950/20"
                        @click="navigate(item.url)"
                      >
                        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
                          <FolderIcon class="h-4 w-4" />
                        </div>
                        <div class="min-w-0 flex-1 text-left">
                          <p class="truncate text-[13px] font-semibold text-gray-800 dark:text-gray-100">{{ item.name }}</p>
                          <p v-if="item.parent" class="text-[11px] text-gray-400 dark:text-gray-500">in {{ item.parent }}</p>
                        </div>
                        <span class="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">{{ item.product_count }}</span>
                      </button>
                    </div>
                  </template>

                  <!-- Brands (admin only) -->
                  <template v-if="adminResults?.brands?.length">
                    <div class="mb-1 flex items-center gap-2 px-5 pt-3 pb-1">
                      <span class="flex h-4 w-4 items-center justify-center rounded bg-rose-100 dark:bg-rose-900/40">
                        <TagIcon class="h-2.5 w-2.5 text-rose-600 dark:text-rose-400" />
                      </span>
                      <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Brands</span>
                    </div>
                    <div class="px-3">
                      <button
                        v-for="item in adminResults.brands"
                        :key="`brand-${item.id}`"
                        type="button"
                        class="group/item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        @click="navigate(item.url)"
                      >
                        <div class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-rose-100 dark:bg-rose-900/40">
                          <img v-if="item.logo" :src="item.logo" :alt="item.name" class="h-full w-full object-cover" />
                          <TagIcon v-else class="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div class="min-w-0 flex-1 text-left">
                          <p class="truncate text-[13px] font-semibold text-gray-800 dark:text-gray-100">{{ item.name }}</p>
                          <p class="text-[11px] text-gray-400 dark:text-gray-500">{{ item.products_count }} products</p>
                        </div>
                      </button>
                    </div>
                  </template>

                </template>

                <!-- No API results -->
                <template v-else-if="query.length >= 2 && !isLoading">
                  <div class="flex flex-col items-center justify-center px-4 py-10 text-center">
                    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                    </div>
                    <p class="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">No results for <span class="text-gray-900 dark:text-white">"{{ query }}"</span></p>
                    <p class="mt-1 text-xs text-gray-400">Try different keywords or check the spelling</p>
                  </div>
                </template>

                <!-- ──────────── Quick Nav ──────────── -->
                <template v-if="filteredCommands.length > 0">
                  <div v-if="hasApiResults" class="mx-5 my-3 border-t border-gray-100 dark:border-gray-800" />
                  <template v-for="(items, group) in groupedCommands" :key="group">
                    <div class="mb-1 flex items-center gap-2 px-5 pt-2 pb-1">
                      <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{{ group }}</span>
                    </div>
                    <div class="px-3">
                      <button
                        v-for="cmd in items"
                        :key="cmd.id"
                        type="button"
                        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-all hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        @click="selectCommand(cmd)"
                      >
                        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          <component :is="cmd.icon" class="h-4 w-4" />
                        </div>
                        <div class="flex-1 text-left">
                          <p class="text-[13px] font-semibold">{{ cmd.label }}</p>
                          <p v-if="cmd.description" class="text-[11px] text-gray-400 dark:text-gray-500">{{ cmd.description }}</p>
                        </div>
                        <ArrowTopRightOnSquareIcon class="h-3.5 w-3.5 shrink-0 text-gray-300 opacity-0 transition-opacity group-hover/item:opacity-100 dark:text-gray-600" />
                      </button>
                    </div>
                  </template>
                </template>

                <!-- Empty state when nothing matches -->
                <template v-if="!hasApiResults && filteredCommands.length === 0">
                  <div class="flex flex-col items-center justify-center px-4 py-10 text-center">
                    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                    </div>
                    <p class="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">No results for <span class="text-gray-900 dark:text-white">"{{ query }}"</span></p>
                    <p class="mt-1 text-xs text-gray-400">Try different keywords or check the spelling</p>
                  </div>
                </template>

              </template>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between border-t border-gray-100 bg-gray-50/80 px-5 py-2.5 dark:border-gray-800 dark:bg-gray-800/50">
              <div class="flex items-center gap-3 text-[11px] text-gray-400">
                <span class="flex items-center gap-1">
                  <kbd class="rounded border border-gray-200 bg-white px-1.5 py-0.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">↵</kbd>
                  <span>select</span>
                </span>
                <span class="flex items-center gap-1">
                  <kbd class="rounded border border-gray-200 bg-white px-1.5 py-0.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">ESC</kbd>
                  <span>close</span>
                </span>
              </div>
              <span v-if="totalApiResults > 0" class="text-[11px] font-medium text-primary-500">
                {{ totalApiResults }} result{{ totalApiResults !== 1 ? 's' : '' }}
              </span>
              <span v-else-if="query.length === 0" class="text-[11px] text-gray-400">
                Powered by global search
              </span>
            </div>

          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
