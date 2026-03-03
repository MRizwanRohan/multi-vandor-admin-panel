<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Webhook Logs — Webhook event monitoring page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { webhookService } from '@/services/payment.service'
import { useDate, usePagination, useToast, useConfirm } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatCard from '@/components/ui/StatCard.vue'
import type { TableColumn } from '@/types'
import type { WebhookEvent, WebhookFilters, WebhookStatistics, WebhookStatus, PaymentGatewayType } from '@/types/payment'
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SignalIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const date = useDate()
const pagination = usePagination()
const toast = useToast()
const confirm = useConfirm()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Webhook Logs', [
    { label: 'Payments', to: '/admin/payments' },
    { label: 'Webhooks' },
  ], 'Monitor payment webhook events')
  fetchWebhooks()
  fetchStatistics()
})

// Data
const webhooks = ref<WebhookEvent[]>([])
const statistics = ref<WebhookStatistics | null>(null)
const isLoading = ref(true)
const selectedIds = ref<number[]>([])

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const gatewayFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'received', label: 'Received' },
  { value: 'processing', label: 'Processing' },
  { value: 'processed', label: 'Processed' },
  { value: 'failed', label: 'Failed' },
  { value: 'ignored', label: 'Ignored' },
]

const gatewayOptions = [
  { value: '', label: 'All Gateways' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'sslcommerz', label: 'SSLCommerz' },
]

// Detail modal
const showDetailModal = ref(false)
const selectedWebhook = ref<WebhookEvent | null>(null)
const isRetrying = ref(false)
const isBulkRetrying = ref(false)

// Table columns
const columns: TableColumn[] = [
  { key: 'eventId', label: 'Event ID', sortable: true },
  { key: 'gateway', label: 'Gateway', sortable: true, align: 'center' },
  { key: 'eventType', label: 'Event Type', sortable: true },
  { key: 'status', label: 'Status', sortable: true, align: 'center' },
  { key: 'retries', label: 'Retries', align: 'center' },
  { key: 'related', label: 'Related' },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'actions', label: '', align: 'right' },
]

// Fetch webhooks
async function fetchWebhooks() {
  isLoading.value = true
  try {
    const filters: WebhookFilters = {
      page: pagination.currentPage.value,
      per_page: pagination.perPage.value,
      status: (statusFilter.value as WebhookStatus) || undefined,
      gateway: (gatewayFilter.value as PaymentGatewayType) || undefined,
    }
    const response = await webhookService.getAll(filters)
    webhooks.value = response.data
    pagination.total.value = response.meta.total
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to load webhook logs'
    toast.error(message)
    webhooks.value = []
  } finally {
    isLoading.value = false
  }
}

// Fetch statistics
async function fetchStatistics() {
  try {
    statistics.value = await webhookService.getStatistics()
  } catch {
    // Stats are optional
  }
}

// Watch for filter changes
watch([searchQuery, statusFilter, gatewayFilter], () => {
  pagination.currentPage.value = 1
  fetchWebhooks()
})

watch([() => pagination.currentPage.value, () => pagination.perPage.value], () => {
  fetchWebhooks()
})

// View webhook detail
function viewWebhook(webhook: WebhookEvent) {
  selectedWebhook.value = webhook
  showDetailModal.value = true
}

// Retry single webhook
async function retryWebhook(webhook: WebhookEvent) {
  isRetrying.value = true
  try {
    await webhookService.retry(webhook.id)
    toast.success('Webhook retry initiated')
    fetchWebhooks()
    fetchStatistics()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to retry webhook')
  } finally {
    isRetrying.value = false
  }
}

// Bulk retry failed webhooks
async function bulkRetry() {
  const failedIds = selectedIds.value.length > 0
    ? selectedIds.value
    : webhooks.value.filter(w => w.status === 'failed').map(w => w.id)

  if (failedIds.length === 0) {
    toast.warning('No failed webhooks to retry')
    return
  }

  const confirmed = await confirm.require({
    title: 'Bulk Retry',
    message: `Retry ${failedIds.length} failed webhook(s)?`,
    confirmText: 'Retry All',
  })

  if (!confirmed) return

  isBulkRetrying.value = true
  try {
    const result = await webhookService.bulkRetry(failedIds)
    toast.success(`${result.success_count} retried, ${result.fail_count} failed`)
    selectedIds.value = []
    fetchWebhooks()
    fetchStatistics()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Bulk retry failed')
  } finally {
    isBulkRetrying.value = false
  }
}

// Status badge variant
function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary' {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'> = {
    received: 'info',
    processing: 'warning',
    processed: 'success',
    failed: 'danger',
    ignored: 'secondary',
  }
  return variants[status] || 'secondary'
}

function getGatewayLabel(gateway: string): string {
  const labels: Record<string, string> = {
    stripe: 'Stripe',
    paypal: 'PayPal',
    sslcommerz: 'SSLCommerz',
    cod: 'COD',
  }
  return labels[gateway] || gateway
}

function getGatewayColor(gateway: string): string {
  const colors: Record<string, string> = {
    stripe: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    paypal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    sslcommerz: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  }
  return colors[gateway] || 'bg-gray-100 text-gray-700'
}

// Format JSON for display
function formatJson(data: Record<string, unknown> | null): string {
  if (!data) return '{}'
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return '{}'
  }
}

// Check if failed webhooks exist
const hasFailedWebhooks = computed(() => 
  webhooks.value.some(w => w.status === 'failed')
)

// Computed stats
const totalEvents = computed(() => statistics.value?.total_events ?? 0)
const processedCount = computed(() => statistics.value?.processed_count ?? 0)
const failedCount = computed(() => statistics.value?.failed_count ?? 0)
const successRate = computed(() => statistics.value?.success_rate ?? 0)
</script>

<template>
  <div class="space-y-6">
    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Events"
        :value="totalEvents.toLocaleString()"
        icon="signal"
        color="blue"
      />
      <StatCard
        title="Processed"
        :value="processedCount.toLocaleString()"
        icon="check-circle"
        color="green"
      />
      <StatCard
        title="Failed"
        :value="failedCount.toLocaleString()"
        icon="x-circle"
        color="red"
      />
      <StatCard
        title="Success Rate"
        :value="`${successRate.toFixed(1)}%`"
        icon="chart-bar"
        color="indigo"
      />
    </div>

    <!-- Filters -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-wrap items-center gap-3">
        <FormSelect
          v-model="statusFilter"
          name="statusFilter"
          :options="statusOptions"
          class="w-40"
        />

        <FormSelect
          v-model="gatewayFilter"
          name="gatewayFilter"
          :options="gatewayOptions"
          class="w-40"
        />
      </div>

      <div class="flex items-center gap-2">
        <BaseButton
          v-if="hasFailedWebhooks"
          variant="warning"
          size="sm"
          :loading="isBulkRetrying"
          @click="bulkRetry"
        >
          <ArrowPathIcon class="mr-2 h-4 w-4" />
          Retry Failed
        </BaseButton>
        <BaseButton variant="secondary" size="sm" @click="fetchWebhooks">
          <ArrowPathIcon class="mr-2 h-4 w-4" />
          Refresh
        </BaseButton>
      </div>
    </div>

    <!-- Webhooks table -->
    <BaseCard padding="none">
      <DataTable
        :columns="columns"
        :data="webhooks"
        :loading="isLoading"
        row-key="id"
        :current-page="pagination.currentPage.value"
        :per-page="pagination.perPage.value"
        :total="pagination.total.value"
        @update:currentPage="pagination.currentPage.value = $event"
        @update:perPage="pagination.perPage.value = $event"
      >
        <template #cell-eventId="{ item }">
          <button
            class="font-mono text-xs text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400 truncate max-w-[120px] block"
            :title="item.event_id"
            @click="viewWebhook(item)"
          >
            {{ item.event_id }}
          </button>
        </template>

        <template #cell-gateway="{ item }">
          <span
            class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            :class="getGatewayColor(item.gateway)"
          >
            {{ getGatewayLabel(item.gateway) }}
          </span>
        </template>

        <template #cell-eventType="{ item }">
          <span class="font-mono text-sm text-gray-900 dark:text-white">
            {{ item.event_type }}
          </span>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="getStatusVariant(item.status)" class="capitalize">
            {{ item.status }}
          </BaseBadge>
        </template>

        <template #cell-retries="{ item }">
          <span
            class="text-sm"
            :class="item.retry_count > 0 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-gray-500 dark:text-gray-400'"
          >
            {{ item.retry_count }}/{{ item.max_retries }}
          </span>
        </template>

        <template #cell-related="{ item }">
          <div class="text-sm">
            <router-link
              v-if="item.related_order_id"
              :to="`/admin/orders/${item.related_order_id}`"
              class="text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Order #{{ item.related_order_id }}
            </router-link>
            <span v-else class="text-gray-400">—</span>
          </div>
        </template>

        <template #cell-date="{ item }">
          <div>
            <p class="text-sm text-gray-900 dark:text-white">
              {{ date.format(item.created_at, 'MMM D, YYYY') }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ date.format(item.created_at, 'h:mm:ss A') }}
            </p>
          </div>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center gap-1">
            <button
              v-if="item.status === 'failed' && item.retry_count < item.max_retries"
              type="button"
              class="rounded p-1 text-amber-500 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/30"
              title="Retry"
              :disabled="isRetrying"
              @click="retryWebhook(item)"
            >
              <ArrowPathIcon class="h-5 w-5" />
            </button>
            <button
              type="button"
              class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="View details"
              @click="viewWebhook(item)"
            >
              <CodeBracketIcon class="h-5 w-5" />
            </button>
          </div>
        </template>

        <!-- Empty state -->
        <template #empty>
          <EmptyState
            title="No webhook events"
            description="Webhook events from payment gateways will appear here."
            icon="signal"
          />
        </template>
      </DataTable>
    </BaseCard>

    <!-- Webhook Detail Modal -->
    <BaseModal
      :show="showDetailModal"
      title="Webhook Event Detail"
      size="lg"
      @close="showDetailModal = false"
    >
      <div v-if="selectedWebhook" class="space-y-4">
        <!-- Event info -->
        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <dl class="grid grid-cols-2 gap-3">
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Event ID</dt>
              <dd class="font-mono text-sm text-gray-900 dark:text-white break-all">
                {{ selectedWebhook.event_id }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Gateway</dt>
              <dd class="text-sm font-medium text-gray-900 dark:text-white">
                {{ getGatewayLabel(selectedWebhook.gateway) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Event Type</dt>
              <dd class="font-mono text-sm text-gray-900 dark:text-white">
                {{ selectedWebhook.event_type }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Status</dt>
              <dd>
                <BaseBadge :variant="getStatusVariant(selectedWebhook.status)" size="sm" class="capitalize">
                  {{ selectedWebhook.status }}
                </BaseBadge>
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">IP Address</dt>
              <dd class="font-mono text-sm text-gray-900 dark:text-white">
                {{ selectedWebhook.ip_address || '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Retries</dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                {{ selectedWebhook.retry_count }}/{{ selectedWebhook.max_retries }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Received</dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                {{ date.format(selectedWebhook.created_at, 'MMM D, YYYY h:mm:ss A') }}
              </dd>
            </div>
            <div v-if="selectedWebhook.processed_at">
              <dt class="text-xs text-gray-500 dark:text-gray-400">Processed</dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                {{ date.format(selectedWebhook.processed_at, 'MMM D, YYYY h:mm:ss A') }}
              </dd>
            </div>
          </dl>

          <!-- Failure reason -->
          <div
            v-if="selectedWebhook.failure_reason"
            class="mt-3 rounded bg-red-50 p-3 dark:bg-red-900/20"
          >
            <p class="text-sm font-medium text-red-700 dark:text-red-300">Failure Reason:</p>
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ selectedWebhook.failure_reason }}
            </p>
          </div>
        </div>

        <!-- Payload -->
        <div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Payload</h4>
          <pre
            class="overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400 max-h-60"
          ><code>{{ formatJson(selectedWebhook.payload) }}</code></pre>
        </div>

        <!-- Response -->
        <div v-if="selectedWebhook.response">
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Response</h4>
          <pre
            class="overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-blue-400 max-h-60"
          ><code>{{ formatJson(selectedWebhook.response) }}</code></pre>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <BaseButton
            v-if="selectedWebhook?.status === 'failed' && (selectedWebhook?.retry_count ?? 0) < (selectedWebhook?.max_retries ?? 3)"
            variant="warning"
            size="sm"
            :loading="isRetrying"
            @click="selectedWebhook && retryWebhook(selectedWebhook)"
          >
            <ArrowPathIcon class="mr-2 h-4 w-4" />
            Retry
          </BaseButton>
          <div v-else></div>
          <BaseButton variant="secondary" @click="showDetailModal = false">
            Close
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
