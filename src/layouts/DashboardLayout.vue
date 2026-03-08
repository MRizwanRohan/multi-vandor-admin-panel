<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Dashboard Layout — Main layout with sidebar and header -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore, useBreadcrumbStore } from '@/stores'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppBreadcrumb from '@/components/layout/AppBreadcrumb.vue'
import PageLoader from '@/components/ui/PageLoader.vue'
import AppTour from '@/components/ui/AppTour.vue'

const route = useRoute()
const uiStore = useUIStore()
const breadcrumbStore = useBreadcrumbStore()

// Determine which dashboard we're in
const dashboardType = computed(() => {
  if (route.path.startsWith('/admin')) return 'admin'
  if (route.path.startsWith('/vendor')) return 'vendor'
  return 'admin'
})

// Page title from breadcrumb store
const pageTitle = computed(() => breadcrumbStore.pageTitle)
const pageDescription = computed(() => breadcrumbStore.pageDescription)

// Watch route changes to close mobile sidebar
watch(
  () => route.path,
  () => {
    uiStore.closeMobileSidebar()
  }
)
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Mobile sidebar backdrop -->
    <Transition name="fade">
      <div
        v-if="uiStore.sidebarMobileOpen"
        class="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
        @click="uiStore.closeMobileSidebar"
      />
    </Transition>

    <!-- Sidebar -->
    <AppSidebar
      :dashboard-type="dashboardType"
      :collapsed="uiStore.sidebarCollapsed"
      :mobile-open="uiStore.sidebarMobileOpen"
      @toggle="uiStore.toggleSidebar"
      @close-mobile="uiStore.closeMobileSidebar"
    />

    <!-- Main content area -->
    <div
      class="flex flex-col transition-all duration-300 lg:ml-64"
      :class="{ 'lg:ml-20': uiStore.sidebarCollapsed }"
    >
      <!-- Header -->
      <AppHeader
        :dashboard-type="dashboardType"
        @toggle-sidebar="uiStore.openMobileSidebar"
      />

      <!-- Page content -->
      <main class="flex-1 p-4 lg:p-6">
        <!-- Breadcrumb -->
        <AppBreadcrumb v-if="breadcrumbStore.hasItems" class="mb-4" />

        <!-- Page header -->
        <div v-if="pageTitle" class="mb-6">
          <h1 class="page-title">{{ pageTitle }}</h1>
          <p v-if="pageDescription" class="page-description">
            {{ pageDescription }}
          </p>
        </div>

        <!-- Page loading overlay -->
        <PageLoader v-if="uiStore.isPageLoading" />

        <!-- Router view with transitions for nested routes -->
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>

      <!-- Footer -->
      <footer class="border-t border-gray-200 bg-white px-4 py-3 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        <p>&copy; {{ new Date().getFullYear() }} MVE Dashboard. All rights reserved.</p>
      </footer>
    </div>

    <!-- Guided Tour overlay (global, works on every admin page) -->
    <AppTour />
  </div>
</template>
