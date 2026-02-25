<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Search Command — ⌘K Command palette search -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import {
  HomeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ShoppingCartIcon,
  Cog6ToothIcon,
  FolderIcon,
  TagIcon,
  ChartBarIcon,
} from '@heroicons/vue/24/outline'

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

// Define quick navigation commands
const commands = computed<CommandItem[]>(() => {
  const prefix = `/${props.dashboardType}`
  const base: CommandItem[] = [
    { id: 'dashboard', label: 'Dashboard', description: 'Go to dashboard', icon: HomeIcon, to: `${prefix}/dashboard`, group: 'Navigation' },
    { id: 'products', label: 'Products', description: 'Manage products', icon: ShoppingBagIcon, to: `${prefix}/products`, group: 'Navigation' },
    { id: 'orders', label: 'Orders', description: 'View orders', icon: ShoppingCartIcon, to: `${prefix}/orders`, group: 'Navigation' },
  ]

  if (props.dashboardType === 'admin') {
    base.push(
      { id: 'categories', label: 'Categories', description: 'Manage categories', icon: FolderIcon, to: '/admin/categories', group: 'Navigation' },
      { id: 'vendors', label: 'Vendors', description: 'Manage vendors', icon: UsersIcon, to: '/admin/vendors', group: 'Navigation' },
      { id: 'customers', label: 'Customers', description: 'View customers', icon: UsersIcon, to: '/admin/customers', group: 'Navigation' },
      { id: 'coupons', label: 'Coupons', description: 'Manage coupons', icon: TagIcon, to: '/admin/coupons', group: 'Navigation' },
      { id: 'analytics', label: 'Analytics', description: 'View analytics', icon: ChartBarIcon, to: '/admin/analytics', group: 'Navigation' },
      { id: 'settings', label: 'Settings', description: 'System settings', icon: Cog6ToothIcon, to: '/admin/settings', group: 'Settings' },
    )
  } else {
    base.push(
      { id: 'analytics', label: 'Analytics', description: 'Store analytics', icon: ChartBarIcon, to: '/vendor/analytics', group: 'Navigation' },
      { id: 'earnings', label: 'Earnings', description: 'View earnings', icon: ChartBarIcon, to: '/vendor/earnings', group: 'Navigation' },
      { id: 'shop-settings', label: 'Shop Settings', description: 'Edit shop', icon: Cog6ToothIcon, to: '/vendor/shop-settings', group: 'Settings' },
    )
  }

  return base
})

// Filtered commands based on query
const filteredCommands = computed(() => {
  if (!query.value) return commands.value
  const q = query.value.toLowerCase()
  return commands.value.filter(
    c =>
      c.label.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
  )
})

// Group filtered commands
const groupedCommands = computed(() => {
  const groups: Record<string, CommandItem[]> = {}
  for (const cmd of filteredCommands.value) {
    if (!groups[cmd.group]) groups[cmd.group] = []
    groups[cmd.group]!.push(cmd)
  }
  return groups
})

function open() {
  isOpen.value = true
  query.value = ''
}

function close() {
  isOpen.value = false
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
})

// Reset query when closed
watch(isOpen, val => {
  if (!val) query.value = ''
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
              />
              <kbd class="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-gray-600">
                ESC
              </kbd>
            </div>

            <!-- Results -->
            <div class="max-h-80 overflow-y-auto py-2">
              <template v-if="filteredCommands.length === 0">
                <div class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No results found for "{{ query }}"
                </div>
              </template>

              <template v-for="(items, group) in groupedCommands" :key="group">
                <div class="px-4 py-1.5 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  {{ group }}
                </div>
                <button
                  v-for="cmd in items"
                  :key="cmd.id"
                  type="button"
                  class="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  @click="selectCommand(cmd)"
                >
                  <component :is="cmd.icon" class="h-5 w-5 shrink-0 text-gray-400" />
                  <div class="flex-1 text-left">
                    <p class="font-medium">{{ cmd.label }}</p>
                    <p v-if="cmd.description" class="text-xs text-gray-500 dark:text-gray-400">
                      {{ cmd.description }}
                    </p>
                  </div>
                </button>
              </template>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
