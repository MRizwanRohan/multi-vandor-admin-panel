<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Mobile Nav — Bottom navigation for mobile screens -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  HomeIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  Bars3Icon,
} from '@heroicons/vue/24/outline'

interface NavItem {
  label: string
  to: string
  icon: typeof HomeIcon
}

interface Props {
  dashboardType?: 'admin' | 'vendor'
}

interface Emits {
  (e: 'openMenu'): void
}

const props = withDefaults(defineProps<Props>(), {
  dashboardType: 'admin',
})

const emit = defineEmits<Emits>()
const route = useRoute()

const navItems = computed<NavItem[]>(() => {
  const prefix = `/${props.dashboardType}`
  return [
    { label: 'Home', to: `${prefix}/dashboard`, icon: HomeIcon },
    { label: 'Products', to: `${prefix}/products`, icon: ShoppingBagIcon },
    { label: 'Orders', to: `${prefix}/orders`, icon: ShoppingCartIcon },
    {
      label: props.dashboardType === 'admin' ? 'Analytics' : 'Earnings',
      to: props.dashboardType === 'admin' ? '/admin/analytics' : '/vendor/earnings',
      icon: ChartBarIcon,
    },
  ]
})

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-lg dark:border-gray-700 dark:bg-gray-800/95 lg:hidden"
  >
    <div class="flex items-center justify-around">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[10px] font-medium transition-colors',
          isActive(item.to)
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
        ]"
      >
        <component
          :is="item.icon"
          :class="[
            'h-5 w-5',
            isActive(item.to) ? 'text-primary-600 dark:text-primary-400' : '',
          ]"
        />
        {{ item.label }}
      </RouterLink>

      <!-- More menu -->
      <button
        type="button"
        class="flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[10px] font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        @click="emit('openMenu')"
      >
        <Bars3Icon class="h-5 w-5" />
        More
      </button>
    </div>
  </nav>
</template>
