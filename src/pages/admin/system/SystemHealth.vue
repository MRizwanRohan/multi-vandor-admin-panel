<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- System Health — Server health dashboard                           -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
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

const breadcrumbStore = useBreadcrumbStore()
const isLoading = ref(false)

const stats = [
  { title: 'Uptime', value: '99.97%', icon: ClockIcon, change: 0.02, trend: 'up' as const, changeLabel: 'vs last month', color: 'success' as const },
  { title: 'CPU Usage', value: '42%', icon: CpuChipIcon, change: -5, trend: 'down' as const, changeLabel: 'vs avg', color: 'primary' as const },
  { title: 'Memory Usage', value: '68%', icon: ServerIcon, change: 3, trend: 'up' as const, changeLabel: 'vs avg', color: 'warning' as const },
  { title: 'Disk Usage', value: '54%', icon: CircleStackIcon, change: 2, trend: 'up' as const, changeLabel: 'this week', color: 'info' as const },
]

// Resource gauges
const resources = ref([
  { name: 'CPU', used: 42, total: 100, unit: '%', status: 'healthy' },
  { name: 'Memory', used: 5.4, total: 8, unit: 'GB', status: 'warning' },
  { name: 'Disk', used: 108, total: 200, unit: 'GB', status: 'healthy' },
  { name: 'Swap', used: 0.5, total: 4, unit: 'GB', status: 'healthy' },
])

// Performance chart
const perfLabels = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
const perfDatasets = [
  { label: 'CPU %', data: [25, 22, 18, 20, 35, 55, 60, 42, 48, 38, 30, 28], fill: false },
  { label: 'Memory %', data: [62, 60, 58, 59, 65, 72, 75, 68, 70, 66, 63, 61], fill: false },
]

// Services health
const services = ref([
  { name: 'Web Server (Nginx)', status: 'operational', uptime: '45d 12h 34m', response_time: '12ms', last_check: '2026-02-24T14:30:00' },
  { name: 'Application Server', status: 'operational', uptime: '45d 12h 34m', response_time: '45ms', last_check: '2026-02-24T14:30:00' },
  { name: 'Database (PostgreSQL)', status: 'operational', uptime: '45d 12h 34m', response_time: '8ms', last_check: '2026-02-24T14:30:00' },
  { name: 'Redis Cache', status: 'operational', uptime: '30d 8h 12m', response_time: '2ms', last_check: '2026-02-24T14:30:00' },
  { name: 'Search Engine (Meilisearch)', status: 'degraded', uptime: '15d 4h 56m', response_time: '156ms', last_check: '2026-02-24T14:30:00' },
  { name: 'Email Service (SMTP)', status: 'operational', uptime: '45d 12h 34m', response_time: '89ms', last_check: '2026-02-24T14:30:00' },
  { name: 'File Storage (S3)', status: 'operational', uptime: '90d 0h 0m', response_time: '34ms', last_check: '2026-02-24T14:30:00' },
  { name: 'Queue Worker', status: 'operational', uptime: '7d 2h 15m', response_time: '5ms', last_check: '2026-02-24T14:30:00' },
  { name: 'Payment Gateway', status: 'operational', uptime: '90d 0h 0m', response_time: '210ms', last_check: '2026-02-24T14:30:00' },
  { name: 'SMS Service', status: 'down', uptime: '0d 0h 0m', response_time: '—', last_check: '2026-02-24T12:15:00' },
])

const serviceColumns = [
  { key: 'name', label: 'Service' },
  { key: 'status', label: 'Status' },
  { key: 'uptime', label: 'Uptime' },
  { key: 'response_time', label: 'Response Time', align: 'right' as const },
]

// Recent incidents
const incidents = ref([
  { id: 1, title: 'SMS Service Down', severity: 'critical', started: '2026-02-24T12:15:00', resolved: null, description: 'SMS gateway provider experiencing outage' },
  { id: 2, title: 'Search Engine High Latency', severity: 'warning', started: '2026-02-24T10:00:00', resolved: null, description: 'Meilisearch response times elevated above threshold' },
  { id: 3, title: 'Database Connection Spike', severity: 'warning', started: '2026-02-23T08:30:00', resolved: '2026-02-23T09:15:00', description: 'Connection pool reached 90% capacity during peak' },
  { id: 4, title: 'Redis Cache Restart', severity: 'info', started: '2026-02-20T03:00:00', resolved: '2026-02-20T03:02:00', description: 'Scheduled maintenance restart' },
])

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

onMounted(() => {
  breadcrumbStore.setPageInfo('System Health', [
    { label: 'System' },
    { label: 'Health' },
  ], 'Server health monitoring and service status')
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
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <ArrowPathIcon class="h-4 w-4" />
        Refresh
      </button>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        v-for="stat in stats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :change="stat.change"
        :trend="stat.trend"
        :change-label="stat.changeLabel"
        :color="stat.color"
      />
    </div>

    <!-- Resource Utilization -->
    <BaseCard>
      <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Resource Utilization</h3>
      <div class="grid gap-6 sm:grid-cols-2">
        <div v-for="resource in resources" :key="resource.name" class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ resource.name }}</span>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ resource.used }}{{ resource.unit }} / {{ resource.total }}{{ resource.unit }}
            </span>
          </div>
          <AppProgressBar
            :value="Math.round((resource.used / resource.total) * 100)"
            :color="getProgressColor(Math.round((resource.used / resource.total) * 100))"
            size="md"
            :show-label="true"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Performance Chart -->
    <BaseCard>
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
        :loading="isLoading"
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
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ row.uptime }}</span>
        </template>

        <template #cell-response_time="{ row }">
          <span class="font-mono text-sm text-gray-700 dark:text-gray-300">{{ row.response_time }}</span>
        </template>
      </DataTable>
    </BaseCard>

    <!-- Recent Incidents -->
    <BaseCard>
      <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Recent Incidents</h3>
      <div class="space-y-3">
        <div
          v-for="incident in incidents"
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
                v-if="!incident.resolved"
                class="rounded-full bg-danger-50 px-1.5 py-0.5 text-[10px] font-medium text-danger-700 dark:bg-danger-900/30 dark:text-danger-400"
              >
                ONGOING
              </span>
              <span
                v-else
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
  </div>
</template>
