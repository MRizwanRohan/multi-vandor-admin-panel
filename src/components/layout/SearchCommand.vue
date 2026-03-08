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
  <!-- Trigger button (for external use) -->
  <button
    type="button"
    class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
    @click="open"
  >
    <MagnifyingGlassIcon class="h-4 w-4" />
    <span class="hidden sm:inline">Search...</span>
    <kbd class="ml-2 hidden rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-gray-600 sm:inline">
      ⌘K
    </kbd>
  </button>

  <!-- Command palette dialog -->
  <TransitionRoot :show="isOpen" as="template">
    <Dialog class="relative z-[100]" @close="close">
      <!-- Backdrop -->
      <TransitionChild
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20">
        <TransitionChild
          enter="ease-out duration-200"
          enter-from="opacity-0 scale-95"
          enter-to="opacity-100 scale-100"
          leave="ease-in duration-150"
          leave-from="opacity-100 scale-100"
          leave-to="opacity-0 scale-95"
        >
          <DialogPanel
            class="mx-auto max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800"
          >
            <!-- Search input -->
            <div class="flex items-center border-b border-gray-200 px-4 dark:border-gray-700">
              <MagnifyingGlassIcon class="h-5 w-5 shrink-0 text-gray-400" />
              <input
                v-model="query"
                type="text"
                class="h-12 w-full border-0 bg-transparent px-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 dark:text-white"
                placeholder="Type a command or search..."
                autofocus
              />
              <kbd class="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-gray-600">
                ESC
              </kbd>
            </div>

            <!-- Results pane -->
            <div class="max-h-[480px] overflow-y-auto">

              <!-- Loading skeleton -->
              <div v-if="isLoading" class="space-y-1 px-2 py-2">
                <div class="flex items-center gap-3 px-2 py-2">
                  <div class="h-5 w-5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div class="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div class="flex items-center gap-3 px-2 py-2">
                  <div class="h-5 w-5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div class="h-4 w-56 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div class="flex items-center gap-3 px-2 py-2">
                  <div class="h-5 w-5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div class="h-4 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>

              <template v-else>
                <!-- ── API Results ───────────────────────────── -->
                <template v-if="hasApiResults">

                  <!-- Products -->
                  <template v-if="adminResults?.products?.length || vendorResults?.products?.length">
                    <div class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Products
                    </div>
                    <button
                      v-for="item in (adminResults?.products ?? vendorResults?.products ?? [])"
                      :key="`product-${item.id}`"
                      type="button"
                      class="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      @click="navigate(item.url)"
                    >
                      <ShoppingBagIcon class="h-4 w-4 shrink-0 text-gray-400" />
                      <div class="min-w-0 flex-1 text-left">
                        <p class="truncate font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {{ item.sku ? `SKU: ${item.sku}` : '' }}
                          <span v-if="item.sku && item.category"> · </span>
                          {{ item.category }}
                        </p>
                      </div>
                      <span class="shrink-0 text-xs text-gray-400">${{ item.price }}</span>
                    </button>
                  </template>

                  <!-- Orders -->
                  <template v-if="adminResults?.orders?.length || vendorResults?.orders?.length">
                    <div class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Orders
                    </div>
                    <button
                      v-for="item in (adminResults?.orders ?? vendorResults?.orders ?? [])"
                      :key="`order-${item.id}`"
                      type="button"
                      class="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      @click="navigate(item.url)"
                    >
                      <ShoppingCartIcon class="h-4 w-4 shrink-0 text-gray-400" />
                      <div class="min-w-0 flex-1 text-left">
                        <p class="truncate font-medium text-gray-900 dark:text-white">{{ item.order_number }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {{ item.customer ?? '' }}
                          <span v-if="item.customer"> · </span>
                          <span :class="item.status === 'completed' ? 'text-green-500' : 'text-orange-400'">{{ item.status }}</span>
                        </p>
                      </div>
                      <span class="shrink-0 text-xs text-gray-400">${{ item.total_amount }}</span>
                    </button>
                  </template>

                  <!-- Customers (admin only) -->
                  <template v-if="adminResults?.customers?.length">
                    <div class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Customers
                    </div>
                    <button
                      v-for="item in adminResults.customers"
                      :key="`customer-${item.id}`"
                      type="button"
                      class="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      @click="navigate(item.url)"
                    >
                      <UsersIcon class="h-4 w-4 shrink-0 text-gray-400" />
                      <div class="min-w-0 flex-1 text-left">
                        <p class="truncate font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
                        <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ item.email }}</p>
                      </div>
                    </button>
                  </template>

                  <!-- Vendors (admin only) -->
                  <template v-if="adminResults?.vendors?.length">
                    <div class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Vendors
                    </div>
                    <button
                      v-for="item in adminResults.vendors"
                      :key="`vendor-${item.id}`"
                      type="button"
                      class="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      @click="navigate(item.url)"
                    >
                      <BuildingStorefrontIcon class="h-4 w-4 shrink-0 text-gray-400" />
                      <div class="min-w-0 flex-1 text-left">
                        <p class="truncate font-medium text-gray-900 dark:text-white">{{ item.store_name }}</p>
                        <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ item.email }}</p>
                      </div>
                    </button>
                  </template>

                  <!-- Categories (admin only) -->
                  <template v-if="adminResults?.categories?.length">
                    <div class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Categories
                    </div>
                    <button
                      v-for="item in adminResults.categories"
                      :key="`category-${item.id}`"
                      type="button"
                      class="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      @click="navigate(item.url)"
                    >
                      <FolderIcon class="h-4 w-4 shrink-0 text-gray-400" />
                      <div class="min-w-0 flex-1 text-left">
                        <p class="truncate font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
                        <p v-if="item.parent" class="text-xs text-gray-500 dark:text-gray-400">in {{ item.parent }}</p>
                      </div>
                      <span class="shrink-0 text-xs text-gray-400">{{ item.product_count }} products</span>
                    </button>
                  </template>

                  <!-- Brands (admin only) -->
                  <template v-if="adminResults?.brands?.length">
                    <div class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Brands
                    </div>
                    <button
                      v-for="item in adminResults.brands"
                      :key="`brand-${item.id}`"
                      type="button"
                      class="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      @click="navigate(item.url)"
                    >
                      <TagIcon class="h-4 w-4 shrink-0 text-gray-400" />
                      <div class="min-w-0 flex-1 text-left">
                        <p class="truncate font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.products_count }} products</p>
                      </div>
                    </button>
                  </template>

                </template>

                <!-- No API results (query >= 2 but nothing found) -->
                <template v-else-if="query.length >= 2 && !isLoading">
                  <div class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    No results found for <span class="font-medium">"{{ query }}"</span>
                  </div>
                </template>

                <!-- ── Quick Nav (always shown below results / when idle) ───── -->
                <template v-if="filteredCommands.length > 0">
                  <div v-if="hasApiResults" class="mx-4 my-1 border-t border-gray-100 dark:border-gray-700" />
                  <template v-for="(items, group) in groupedCommands" :key="group">
                    <div class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {{ group }}
                    </div>
                    <button
                      v-for="cmd in items"
                      :key="cmd.id"
                      type="button"
                      class="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      @click="selectCommand(cmd)"
                    >
                      <component :is="cmd.icon" class="h-4 w-4 shrink-0 text-gray-400" />
                      <div class="flex-1 text-left">
                        <p class="font-medium">{{ cmd.label }}</p>
                        <p v-if="cmd.description" class="text-xs text-gray-500 dark:text-gray-400">
                          {{ cmd.description }}
                        </p>
                      </div>
                      <ArrowTopRightOnSquareIcon class="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                    </button>
                  </template>
                </template>

                <!-- Empty state when nothing to show -->
                <template v-if="!hasApiResults && filteredCommands.length === 0">
                  <div class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No results found for <span class="font-medium">"{{ query }}"</span>
                  </div>
                </template>

              </template>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between border-t border-gray-200 px-4 py-2 text-[11px] text-gray-400 dark:border-gray-700">
              <span>
                <kbd class="rounded border border-gray-200 px-1 py-0.5 text-[10px] dark:border-gray-600">↵</kbd> to select
                &nbsp;
                <kbd class="rounded border border-gray-200 px-1 py-0.5 text-[10px] dark:border-gray-600">ESC</kbd> to close
              </span>
              <span v-if="totalApiResults > 0">{{ totalApiResults }} result{{ totalApiResults !== 1 ? 's' : '' }}</span>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
