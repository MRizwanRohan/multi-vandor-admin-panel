<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- System Health — Server health dashboard                           -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { healthService } from '@/services'
import type { HealthDashboard, ServiceHealth, HealthIncident, MetricsChartData } from '@/types/health'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatCard from '@/components/ui/StatCard.vue'
import AppProgressBar from '@/components/ui/AppProgressBar.vue'
import DataTable from '@/components/data/DataTable.vue'
import LineChart from '@/components/charts/LineChart.vue'
import {
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'
import { useToast } from '@/composables'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const isLoading = ref(true)
const isRefreshing = ref(false)
let refreshInterval: ReturnType<typeof setInterval> | null = null

// Data from API
const dashboard = ref<HealthDashboard | null>(null)
const cpuChartData = ref<MetricsChartData | null>(null)
const memoryChartData = ref<MetricsChartData | null>(null)

// Computed stats
const stats = computed(() => {
  if (!dashboard.value) return []
  const m = dashboard.value.metrics
  const s = dashboard.value.summary

  return [
    {
      title: 'Uptime',
      value: `${dashboard.value.uptime.percentage.toFixed(2)}%`,
      icon: ClockIcon,
      change: 0,
      trend: 'up' as const,
      changeLabel: dashboard.value.uptime.formatted,
      color: 'success' as const,
    },
    {
      title: 'CPU Usage',
      value: `${Math.round(m.cpu)}%`,
      icon: CpuChipIcon,
      change: 0,
      trend: 'down' as const,
      changeLabel: 'current',
      color: m.cpu > 80 ? ('danger' as const) : m.cpu > 60 ? ('warning' as const) : ('primary' as const),
    },
    {
      title: 'Memory Usage',
      value: `${Math.round(m.memory)}%`,
      icon: ServerIcon,
      change: 0,
      trend: 'up' as const,
      changeLabel: `${formatBytes(m.memory_used)} / ${formatBytes(m.memory_total)}`,
      color: m.memory > 80 ? ('danger' as const) : m.memory > 60 ? ('warning' as const) : ('primary' as const),
    },
    {
      title: 'Services',
      value: `${s.operational}/${s.total_services}`,
      icon: CircleStackIcon,
      change: s.degraded + s.down,
      trend: s.degraded + s.down > 0 ? ('down' as const) : ('up' as const),
      changeLabel: s.degraded + s.down > 0 ? `${s.degraded + s.down} issues` : 'all healthy',
      color: s.down > 0 ? ('danger' as const) : s.degraded > 0 ? ('warning' as const) : ('success' as const),
    },
  ]
})

// Resource utilization
const resources = computed(() => {
  if (!dashboard.value) return []
  const m = dashboard.value.metrics
  const items = [
    { name: 'CPU', used: m.cpu, total: 100, unit: '%', status: m.cpu > 80 ? 'danger' : m.cpu > 60 ? 'warning' : 'healthy' },
    { name: 'Memory', used: m.memory_used, total: m.memory_total, unit: 'B', status: m.memory > 80 ? 'danger' : m.memory > 60 ? 'warning' : 'healthy' },
    { name: 'Disk', used: m.disk_used, total: m.disk_total, unit: 'B', status: m.disk > 80 ? 'danger' : m.disk > 60 ? 'warning' : 'healthy' },
  ]
  // Only show swap if there's actually swap configured
  if (m.swap_total > 0) {
    items.push({ name: 'Swap', used: m.swap_used, total: m.swap_total, unit: 'B', status: m.swap > 80 ? 'danger' : m.swap > 60 ? 'warning' : 'healthy' })
  }
  return items
})

// Services
const services = computed<ServiceHealth[]>(() => dashboard.value?.services ?? [])

// Incidents
const activeIncidents = computed<HealthIncident[]>(() => dashboard.value?.active_incidents ?? [])
const recentIncidents = computed<HealthIncident[]>(() => dashboard.value?.recent_incidents ?? [])

// Chart data
const perfLabels = computed(() => cpuChartData.value?.points?.map(p => formatTime(p.timestamp)) ?? [])
const perfDatasets = computed(() => {
  const datasets = []
  if (cpuChartData.value?.points?.length) {
    datasets.push({
      label: 'CPU %',
      data: cpuChartData.value.points.map(p => p.value),
      fill: false,
    })
  }
  if (memoryChartData.value?.points?.length) {
    datasets.push({
      label: 'Memory %',
      data: memoryChartData.value.points.map(p => p.value),
      fill: false,
    })
  }
  return datasets
})

const serviceColumns = [
  { key: 'name', label: 'Service' },
  { key: 'status', label: 'Status' },
  { key: 'uptime', label: 'Uptime' },
  { key: 'response_time', label: 'Response Time', align: 'right' as const },
]

// Helpers
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatResourceValue(used: number, unit: string): string {
  if (unit === 'B') return formatBytes(used)
  return `${used}${unit}`
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function getStatusIcon(status: string) {
  if (status === 'operational') return CheckCircleIcon
  if (status === 'degraded') return ExclamationTriangleIcon
  return XCircleIcon
}

function getStatusColor(status: string): string {
  if (status === 'operational') return 'text-success-500'
  if (status === 'degraded') return 'text-warning-500'
  return 'text-danger-500'
}

function getStatusBg(status: string): string {
  if (status === 'operational') return 'bg-success-50 dark:bg-success-900/20'
  if (status === 'degraded') return 'bg-warning-50 dark:bg-warning-900/20'
  return 'bg-danger-50 dark:bg-danger-900/20'
}

function getProgressColor(percent: number): 'primary' | 'success' | 'warning' | 'danger' {
  if (percent < 50) return 'success'
  if (percent < 75) return 'warning'
  return 'danger'
}

function getSeverityClasses(severity: string): string {
  if (severity === 'critical') return 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
  if (severity === 'warning') return 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
  return 'bg-info-50 text-info-700 dark:bg-info-900/30 dark:text-info-400'
}

// Data loading
async function loadDashboard() {
  try {
    dashboard.value = await healthService.getDashboard()
  } catch (error) {
    console.error('Failed to load health dashboard:', error)
    toast.error('Failed to load health data')
  }
}

async function loadCharts() {
  try {
    const [cpu, memory] = await Promise.all([
      healthService.getMetricsChart({ metric: 'cpu', hours: 24, interval: '1 hour' }),
      healthService.getMetricsChart({ metric: 'memory', hours: 24, interval: '1 hour' }),
    ])
    cpuChartData.value = cpu
    memoryChartData.value = memory
  } catch (error) {
    console.error('Failed to load metrics charts:', error)
  }
}

async function loadAll() {
  isLoading.value = true
  await Promise.all([loadDashboard(), loadCharts()])
  isLoading.value = false
}

async function refresh() {
  isRefreshing.value = true
  await loadDashboard()
  isRefreshing.value = false
  toast.success('Health data refreshed')
}

async function runHealthCheck() {
  try {
    isRefreshing.value = true
    const result = await healthService.runHealthCheck()
    toast.success(`Health check completed: ${result.services_checked} services checked`)
    await loadDashboard()
  } catch (error) {
    console.error('Failed to run health check:', error)
    toast.error('Failed to run health check')
  } finally {
    isRefreshing.value = false
  }
}

onMounted(() => {
  breadcrumbStore.setPageInfo('System Health', [
    { label: 'System' },
    { label: 'Health' },
  ], 'Server health monitoring and service status')

  loadAll()

  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(() => {
    loadDashboard()
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">System Health</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Real-time server health and service status</p>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          :disabled="isRefreshing"
          @click="runHealthCheck"
          class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          Run Check
        </button>
        <button
          type="button"
          :disabled="isRefreshing"
          @click="refresh"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <ArrowPathIcon :class="['h-4 w-4', isRefreshing && 'animate-spin']" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <ArrowPathIcon class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <template v-else-if="dashboard">
      <!-- Stats with improved gradient cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Uptime Card -->
        <div class="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm ring-1 ring-emerald-100 transition-all hover:shadow-md dark:from-emerald-900/20 dark:to-teal-900/20 dark:ring-emerald-800/30">
          <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-100/50 blur-2xl transition-all group-hover:scale-150 dark:bg-emerald-800/20" />
          <div class="relative flex items-start justify-between">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-emerald-700 dark:text-emerald-400">Uptime</p>
              <p class="mt-1.5 text-3xl font-bold text-gray-900 dark:text-white">{{ dashboard.uptime.percentage.toFixed(2) }}%</p>
              <p class="mt-1 text-sm text-emerald-600 dark:text-emerald-500">{{ dashboard.uptime.formatted }}</p>
            </div>
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 dark:bg-emerald-500/20 dark:ring-emerald-500/30">
              <ClockIcon class="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <!-- CPU Usage Card -->
        <div class="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm ring-1 ring-blue-100 transition-all hover:shadow-md dark:from-blue-900/20 dark:to-indigo-900/20 dark:ring-blue-800/30">
          <div class="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-100/50 blur-2xl transition-all group-hover:scale-150 dark:bg-blue-800/20" />
          <div class="relative flex items-start justify-between">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-blue-700 dark:text-blue-400">CPU Usage</p>
              <p class="mt-1.5 text-3xl font-bold text-gray-900 dark:text-white">{{ Math.round(dashboard.metrics.cpu) }}%</p>
              <p class="mt-1 text-sm text-blue-600 dark:text-blue-500">{{ dashboard.metrics.cpu.toFixed(2) }}% current</p>
            </div>
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20 dark:bg-blue-500/20 dark:ring-blue-500/30">
              <CpuChipIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <!-- Memory Usage Card -->
        <div 
          class="group relative overflow-hidden rounded-xl p-5 shadow-sm transition-all hover:shadow-md"
          :class="dashboard.metrics.memory > 80 
            ? 'bg-gradient-to-br from-rose-50 to-red-50 ring-1 ring-rose-100 dark:from-rose-900/20 dark:to-red-900/20 dark:ring-rose-800/30'
            : dashboard.metrics.memory > 60
              ? 'bg-gradient-to-br from-amber-50 to-orange-50 ring-1 ring-amber-100 dark:from-amber-900/20 dark:to-orange-900/20 dark:ring-amber-800/30'
              : 'bg-gradient-to-br from-violet-50 to-purple-50 ring-1 ring-violet-100 dark:from-violet-900/20 dark:to-purple-900/20 dark:ring-violet-800/30'"
        >
          <div 
            class="absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl transition-all group-hover:scale-150"
            :class="dashboard.metrics.memory > 80 ? 'bg-rose-100/50 dark:bg-rose-800/20' : dashboard.metrics.memory > 60 ? 'bg-amber-100/50 dark:bg-amber-800/20' : 'bg-violet-100/50 dark:bg-violet-800/20'"
          />
          <div class="relative flex items-start justify-between">
            <div class="min-w-0 flex-1">
              <p 
                class="text-sm font-medium"
                :class="dashboard.metrics.memory > 80 ? 'text-rose-700 dark:text-rose-400' : dashboard.metrics.memory > 60 ? 'text-amber-700 dark:text-amber-400' : 'text-violet-700 dark:text-violet-400'"
              >Memory Usage</p>
              <p class="mt-1.5 text-3xl font-bold text-gray-900 dark:text-white">{{ Math.round(dashboard.metrics.memory) }}%</p>
              <p 
                class="mt-1 text-sm"
                :class="dashboard.metrics.memory > 80 ? 'text-rose-600 dark:text-rose-500' : dashboard.metrics.memory > 60 ? 'text-amber-600 dark:text-amber-500' : 'text-violet-600 dark:text-violet-500'"
              >{{ formatBytes(dashboard.metrics.memory_used) }} / {{ formatBytes(dashboard.metrics.memory_total) }}</p>
            </div>
            <div 
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1"
              :class="dashboard.metrics.memory > 80 
                ? 'bg-rose-500/10 ring-rose-500/20 dark:bg-rose-500/20 dark:ring-rose-500/30' 
                : dashboard.metrics.memory > 60 
                  ? 'bg-amber-500/10 ring-amber-500/20 dark:bg-amber-500/20 dark:ring-amber-500/30'
                  : 'bg-violet-500/10 ring-violet-500/20 dark:bg-violet-500/20 dark:ring-violet-500/30'"
            >
              <ServerIcon 
                class="h-6 w-6"
                :class="dashboard.metrics.memory > 80 ? 'text-rose-600 dark:text-rose-400' : dashboard.metrics.memory > 60 ? 'text-amber-600 dark:text-amber-400' : 'text-violet-600 dark:text-violet-400'"
              />
            </div>
          </div>
        </div>

        <!-- Services Card -->
        <div 
          class="group relative overflow-hidden rounded-xl p-5 shadow-sm transition-all hover:shadow-md"
          :class="dashboard.summary.down > 0 
            ? 'bg-gradient-to-br from-rose-50 to-red-50 ring-1 ring-rose-100 dark:from-rose-900/20 dark:to-red-900/20 dark:ring-rose-800/30'
            : dashboard.summary.degraded > 0
              ? 'bg-gradient-to-br from-amber-50 to-orange-50 ring-1 ring-amber-100 dark:from-amber-900/20 dark:to-orange-900/20 dark:ring-amber-800/30'
              : 'bg-gradient-to-br from-cyan-50 to-sky-50 ring-1 ring-cyan-100 dark:from-cyan-900/20 dark:to-sky-900/20 dark:ring-cyan-800/30'"
        >
          <div 
            class="absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl transition-all group-hover:scale-150"
            :class="dashboard.summary.down > 0 ? 'bg-rose-100/50 dark:bg-rose-800/20' : dashboard.summary.degraded > 0 ? 'bg-amber-100/50 dark:bg-amber-800/20' : 'bg-cyan-100/50 dark:bg-cyan-800/20'"
          />
          <div class="relative flex items-start justify-between">
            <div class="min-w-0 flex-1">
              <p 
                class="text-sm font-medium"
                :class="dashboard.summary.down > 0 ? 'text-rose-700 dark:text-rose-400' : dashboard.summary.degraded > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-cyan-700 dark:text-cyan-400'"
              >Services</p>
              <p class="mt-1.5 text-3xl font-bold text-gray-900 dark:text-white">{{ dashboard.summary.operational }}/{{ dashboard.summary.total_services }}</p>
              <p 
                class="mt-1 text-sm"
                :class="dashboard.summary.down > 0 ? 'text-rose-600 dark:text-rose-500' : dashboard.summary.degraded > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-cyan-600 dark:text-cyan-500'"
              >
                <template v-if="dashboard.summary.down > 0 || dashboard.summary.degraded > 0">
                  {{ dashboard.summary.down + dashboard.summary.degraded }} issues
                </template>
                <template v-else>All services healthy</template>
              </p>
            </div>
            <div 
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1"
              :class="dashboard.summary.down > 0 
                ? 'bg-rose-500/10 ring-rose-500/20 dark:bg-rose-500/20 dark:ring-rose-500/30' 
                : dashboard.summary.degraded > 0 
                  ? 'bg-amber-500/10 ring-amber-500/20 dark:bg-amber-500/20 dark:ring-amber-500/30'
                  : 'bg-cyan-500/10 ring-cyan-500/20 dark:bg-cyan-500/20 dark:ring-cyan-500/30'"
            >
              <CircleStackIcon 
                class="h-6 w-6"
                :class="dashboard.summary.down > 0 ? 'text-rose-600 dark:text-rose-400' : dashboard.summary.degraded > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-cyan-600 dark:text-cyan-400'"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Resource Utilization -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Resource Utilization</h3>
        <div class="grid gap-6 sm:grid-cols-2">
          <div v-for="resource in resources" :key="resource.name" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ resource.name }}</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatResourceValue(resource.used, resource.unit) }} / {{ formatResourceValue(resource.total, resource.unit) }}
              </span>
            </div>
            <AppProgressBar
              :value="resource.total > 0 ? Math.round((resource.used / resource.total) * 100) : 0"
              :color="getProgressColor(resource.total > 0 ? Math.round((resource.used / resource.total) * 100) : 0)"
              size="md"
              :show-label="true"
            />
          </div>
        </div>
      </BaseCard>

      <!-- Performance Chart -->
      <BaseCard v-if="perfDatasets.length > 0">
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Performance (24h)</h3>
        <LineChart
          :labels="perfLabels"
          :datasets="perfDatasets"
          :height="280"
          :show-legend="true"
        />
      </BaseCard>

      <!-- Services Status -->
      <BaseCard>
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">Services Status</h3>
          <div class="flex items-center gap-4 text-xs">
            <span class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full bg-success-500" />
              Operational
            </span>
            <span class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full bg-warning-500" />
              Degraded
            </span>
            <span class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full bg-danger-500" />
              Down
            </span>
          </div>
        </div>

        <DataTable
          :columns="serviceColumns"
          :data="services"
          :loading="isRefreshing"
          :total="services.length"
          :current-page="1"
          :per-page="20"
        >
          <template #cell-name="{ row }">
            <div class="flex items-center gap-2">
              <component :is="getStatusIcon(row.status)" :class="getStatusColor(row.status)" class="h-4 w-4" />
              <span class="font-medium text-gray-900 dark:text-white">{{ row.name }}</span>
            </div>
          </template>

          <template #cell-status="{ row }">
            <span
              :class="getStatusBg(row.status)"
              class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize"
            >
              {{ row.status }}
            </span>
          </template>

          <template #cell-uptime="{ row }">
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ row.uptime ?? '—' }}</span>
          </template>

          <template #cell-response_time="{ row }">
            <span class="font-mono text-sm text-gray-700 dark:text-gray-300">
              {{ row.response_time ? `${row.response_time}ms` : '—' }}
            </span>
          </template>
        </DataTable>
      </BaseCard>

      <!-- Active Incidents -->
      <BaseCard v-if="activeIncidents.length > 0">
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Active Incidents
          <span class="ml-2 rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-700 dark:bg-danger-900/30 dark:text-danger-400">
            {{ activeIncidents.length }}
          </span>
        </h3>
        <div class="space-y-3">
          <div
            v-for="incident in activeIncidents"
            :key="incident.id"
            class="flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50/50 p-3 dark:border-danger-800 dark:bg-danger-900/20"
          >
            <component
              :is="incident.severity === 'critical' ? XCircleIcon : ExclamationTriangleIcon"
              :class="incident.severity === 'critical' ? 'text-danger-500' : 'text-warning-500'"
              class="mt-0.5 h-5 w-5 shrink-0"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">{{ incident.title }}</h4>
                <span :class="getSeverityClasses(incident.severity)" class="rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase">
                  {{ incident.severity }}
                </span>
                <span class="rounded-full bg-danger-100 px-1.5 py-0.5 text-[10px] font-medium text-danger-700 dark:bg-danger-900/50 dark:text-danger-400">
                  {{ incident.status.toUpperCase() }}
                </span>
              </div>
              <p class="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{{ incident.description }}</p>
              <p class="mt-1 text-xs text-gray-500">
                Started: {{ new Date(incident.started_at).toLocaleString() }}
                <template v-if="incident.service_name"> • {{ incident.service_name }}</template>
              </p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Recent Incidents -->
      <BaseCard>
        <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Recent Incidents</h3>
        <div v-if="recentIncidents.length === 0" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No recent incidents
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="incident in recentIncidents"
            :key="incident.id"
            class="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
          >
            <component
              :is="incident.severity === 'critical' ? XCircleIcon : incident.severity === 'warning' ? ExclamationTriangleIcon : CheckCircleIcon"
              :class="incident.severity === 'critical' ? 'text-danger-500' : incident.severity === 'warning' ? 'text-warning-500' : 'text-info-500'"
              class="mt-0.5 h-5 w-5 shrink-0"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">{{ incident.title }}</h4>
                <span :class="getSeverityClasses(incident.severity)" class="rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase">
                  {{ incident.severity }}
                </span>
                <span
                  v-if="incident.status === 'resolved'"
                  class="rounded-full bg-success-50 px-1.5 py-0.5 text-[10px] font-medium text-success-700 dark:bg-success-900/30 dark:text-success-400"
                >
                  RESOLVED
                </span>
              </div>
              <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{{ incident.description }}</p>
            </div>
          </div>
        </div>
      </BaseCard>
    </template>
  </div>
</template>
