<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Backup Management — Admin backup management page                   -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { useDate } from '@/composables'
import { backupService, type BackupFile, type BackupStats, type BackupHealth } from '@/services'
import BaseCard from '@/components/ui/BaseCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ServerStackIcon,
  CircleStackIcon,
  CloudArrowUpIcon,
  SparklesIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const { formatDate } = useDate()

// State
const isLoading = ref(true)
const error = ref<string | null>(null)
const backups = ref<BackupFile[]>([])
const stats = ref<BackupStats | null>(null)
const health = ref<BackupHealth | null>(null)

const isRunning = ref(false)
const isCleaning = ref(false)
const onlyDb = ref(false)
const runMessage = ref<{ type: 'success' | 'error'; text: string; duration?: number | null } | null>(null)

const deletingFile = ref<string | null>(null)
const downloadingFile = ref<string | null>(null)

// Computed
const healthStatus = computed(() => {
  if (!health.value) return null
  return health.value.healthy ? 'healthy' : 'unhealthy'
})

// Fetch all data in parallel
async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    const [listRes, healthRes] = await Promise.all([
      backupService.list(),
      backupService.health(),
    ])
    backups.value = listRes.backups
    stats.value = listRes.stats
    health.value = healthRes
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load backup data'
  } finally {
    isLoading.value = false
  }
}

// Run manual backup
async function handleRun() {
  isRunning.value = true
  runMessage.value = null
  try {
    const res = await backupService.run(onlyDb.value)
    runMessage.value = {
      type: res.success ? 'success' : 'error',
      text: res.message,
      duration: res.data?.duration,
    }
    if (res.success) await fetchData()
  } catch (e: any) {
    runMessage.value = { type: 'error', text: e.response?.data?.message || 'Backup failed' }
  } finally {
    isRunning.value = false
  }
}

// Run cleanup
async function handleCleanup() {
  isCleaning.value = true
  runMessage.value = null
  try {
    const res = await backupService.cleanup()
    runMessage.value = { type: res.success ? 'success' : 'error', text: res.message }
    if (res.success) await fetchData()
  } catch (e: any) {
    runMessage.value = { type: 'error', text: e.response?.data?.message || 'Cleanup failed' }
  } finally {
    isCleaning.value = false
  }
}

// Download backup
async function handleDownload(file: BackupFile) {
  downloadingFile.value = file.filename
  try {
    const blob = await backupService.download(file.filename)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.filename
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Download failed'
  } finally {
    downloadingFile.value = null
  }
}

// Delete backup
async function handleDelete(file: BackupFile) {
  if (!confirm(`Delete backup "${file.filename}"? This cannot be undone.`)) return
  deletingFile.value = file.filename
  try {
    await backupService.delete(file.filename)
    await fetchData()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Delete failed'
  } finally {
    deletingFile.value = null
  }
}

onMounted(() => {
  breadcrumbStore.setPageInfo('Backup Management', [
    { label: 'System', to: '/admin/system/health' },
    { label: 'Backup Management' },
  ], 'Manage database and file backups')
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Error Banner -->
    <div
      v-if="error"
      class="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400"
    >
      <XCircleIcon class="h-5 w-5 shrink-0" />
      {{ error }}
    </div>

    <!-- Action Feedback -->
    <div
      v-if="runMessage"
      class="flex items-center gap-3 rounded-lg p-4"
      :class="runMessage.type === 'success'
        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'"
    >
      <CheckCircleIcon v-if="runMessage.type === 'success'" class="h-5 w-5 shrink-0" />
      <XCircleIcon v-else class="h-5 w-5 shrink-0" />
      <span>
        {{ runMessage.text }}
        <span v-if="runMessage.duration" class="ml-2 text-sm opacity-75">({{ runMessage.duration }}s)</span>
      </span>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <template v-else>
      <!-- Top row: Health + Stats -->
      <div class="grid gap-6 lg:grid-cols-2">

        <!-- Health Status -->
        <BaseCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ServerStackIcon class="h-5 w-5 text-gray-400" />
                <span class="font-semibold text-gray-900 dark:text-white">System Health</span>
              </div>
              <BaseBadge
                v-if="health"
                :variant="health.healthy ? 'success' : 'danger'"
              >
                {{ health.healthy ? 'Healthy' : 'Unhealthy' }}
              </BaseBadge>
            </div>
          </template>

          <div v-if="health" class="space-y-3">
            <div
              v-for="(check, key) in health.checks"
              :key="key"
              class="flex items-start gap-3 rounded-lg p-3"
              :class="check.passed ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'"
            >
              <CheckCircleIcon
                v-if="check.passed"
                class="mt-0.5 h-5 w-5 shrink-0 text-green-500"
              />
              <ExclamationTriangleIcon
                v-else
                class="mt-0.5 h-5 w-5 shrink-0 text-red-500"
              />
              <div>
                <p
                  class="text-sm font-medium"
                  :class="check.passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'"
                >
                  {{ check.message }}
                </p>
                <p v-if="check.free_space" class="mt-0.5 text-xs text-gray-500">
                  Free: {{ check.free_space }}
                </p>
              </div>
            </div>
          </div>
          <p v-else class="py-4 text-center text-sm text-gray-500">No health data</p>
        </BaseCard>

        <!-- Stats -->
        <BaseCard>
          <template #header>
            <div class="flex items-center gap-2">
              <CircleStackIcon class="h-5 w-5 text-gray-400" />
              <span class="font-semibold text-gray-900 dark:text-white">Storage Statistics</span>
            </div>
          </template>

          <div v-if="stats" class="grid grid-cols-2 gap-4">
            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <p class="text-xs text-gray-500 dark:text-gray-400">Total Backups</p>
              <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total_backups }}</p>
            </div>
            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <p class="text-xs text-gray-500 dark:text-gray-400">Total Size</p>
              <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total_size_human }}</p>
            </div>
            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <p class="text-xs text-gray-500 dark:text-gray-400">Disk Free</p>
              <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ stats.disk_free_space }}</p>
            </div>
            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <p class="text-xs text-gray-500 dark:text-gray-400">Storage Disk</p>
              <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white capitalize">{{ stats.disk_name }}</p>
            </div>
            <div class="col-span-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <p class="text-xs text-gray-500 dark:text-gray-400">Latest Backup</p>
              <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {{ stats.newest_backup ? formatDate(stats.newest_backup) : '—' }}
              </p>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Actions -->
      <BaseCard>
        <template #header>
          <div class="flex items-center gap-2">
            <CloudArrowUpIcon class="h-5 w-5 text-gray-400" />
            <span class="font-semibold text-gray-900 dark:text-white">Backup Actions</span>
          </div>
        </template>

        <div class="flex flex-wrap items-center gap-4">
          <!-- DB only toggle -->
          <label class="flex cursor-pointer items-center gap-2">
            <input
              v-model="onlyDb"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Database only (faster)</span>
          </label>

          <div class="flex flex-wrap gap-3">
            <BaseButton
              :loading="isRunning"
              :disabled="isRunning || isCleaning"
              variant="primary"
              @click="handleRun"
            >
              <CloudArrowUpIcon class="mr-2 h-4 w-4" />
              {{ isRunning ? 'Running Backup…' : 'Run Backup Now' }}
            </BaseButton>

            <BaseButton
              :loading="isCleaning"
              :disabled="isRunning || isCleaning"
              variant="secondary"
              @click="handleCleanup"
            >
              <SparklesIcon class="mr-2 h-4 w-4" />
              {{ isCleaning ? 'Cleaning Up…' : 'Run Cleanup' }}
            </BaseButton>

            <BaseButton
              variant="ghost"
              :disabled="isLoading"
              @click="fetchData"
            >
              <ArrowPathIcon class="mr-2 h-4 w-4" :class="isLoading && 'animate-spin'" />
              Refresh
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- Backup Files List -->
      <BaseCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <CircleStackIcon class="h-5 w-5 text-gray-400" />
              <span class="font-semibold text-gray-900 dark:text-white">Backup Files</span>
            </div>
            <BaseBadge variant="secondary">{{ backups.length }} files</BaseBadge>
          </div>
        </template>

        <div v-if="backups.length" class="divide-y divide-gray-100 dark:divide-gray-700">
          <div
            v-for="backup in backups"
            :key="backup.filename"
            class="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
          >
            <!-- File info -->
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <CircleStackIcon class="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ backup.filename }}</p>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ backup.size_human }} · {{ backup.age }} · {{ formatDate(backup.created_at) }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                :disabled="downloadingFile === backup.filename"
                class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                @click="handleDownload(backup)"
              >
                <ArrowDownTrayIcon
                  class="h-4 w-4"
                  :class="downloadingFile === backup.filename && 'animate-bounce'"
                />
                {{ downloadingFile === backup.filename ? 'Downloading…' : 'Download' }}
              </button>

              <button
                type="button"
                :disabled="deletingFile === backup.filename"
                class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                @click="handleDelete(backup)"
              >
                <TrashIcon
                  class="h-4 w-4"
                  :class="deletingFile === backup.filename && 'animate-pulse'"
                />
                {{ deletingFile === backup.filename ? 'Deleting…' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="py-12 text-center">
          <CircleStackIcon class="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p class="mt-3 text-sm font-medium text-gray-900 dark:text-white">No backups found</p>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Run a backup to get started.</p>
          <BaseButton class="mt-4" variant="primary" @click="handleRun">
            <CloudArrowUpIcon class="mr-2 h-4 w-4" />
            Run First Backup
          </BaseButton>
        </div>
      </BaseCard>
    </template>
  </div>
</template>
