<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Webhook Logs — Webhook event monitoring page -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { webhookService } from '@/services/payment.service'
import { useDate, usePagination, useToast } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { TableColumn } from '@/types'
import type { WebhookEvent, WebhookFilters, WebhookStatus, PaymentGatewayType } from '@/types/payment'
import {
  ArrowPathIcon,
  CodeBracketIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const date = useDate()
const pagination = usePagination()
const toast = useToast()

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo('Webhook Logs', [
    { label: 'Payments', to: '/admin/payments' },
    { label: 'Webhooks' },
  ], 'Monitor payment webhook events')
  fetchWebhooks()
})

// Data
const webhooks = ref<WebhookEvent[]>([])
const isLoading = ref(true)

// Filters
const statusFilter = ref('')
const gatewayFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
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

// Table columns
const columns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'gateway', label: 'Gateway', sortable: true, align: 'center' },
  { key: 'event', label: 'Event', sortable: true },
  { key: 'status', label: 'Status', sortable: true, align: 'center' },
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
    webhooks.value = response.webhook_logs
    pagination.total.value = response.pagination?.total ?? 0
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to load webhook logs'
    toast.error(message)
    webhooks.value = []
  } finally {
    isLoading.value = false
  }
}

// Watch for filter changes
watch([statusFilter, gatewayFilter], () => {
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

// Status badge variant
function getStatusVariant(status: string | null): 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary' {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'> = {
    success: 'success',
    failed: 'danger',
  }
  return variants[status ?? ''] || 'secondary'
}

function getGatewayLabel(gateway: string | null): string {
  if (!gateway) return '—'
  const labels: Record<string, string> = {
    stripe: 'Stripe',
    paypal: 'PayPal',
    sslcommerz: 'SSLCommerz',
    cod: 'COD',
  }
  return labels[gateway] || gateway
}

function getGatewayColor(gateway: string | null): string {
  if (!gateway) return 'bg-gray-100 text-gray-700'
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
</script>

<template>
  <div class="space-y-6">
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

      <BaseButton variant="secondary" size="sm" @click="fetchWebhooks">
        <ArrowPathIcon class="mr-2 h-4 w-4" />
        Refresh
      </BaseButton>
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
        <template #cell-id="{ item }">
          <button
            class="font-mono text-xs text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
            @click="viewWebhook(item)"
          >
            #{{ item.id }}
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

        <template #cell-event="{ item }">
          <span class="font-mono text-sm text-gray-900 dark:text-white">
            {{ item.event }}
          </span>
        </template>

        <template #cell-status="{ item }">
          <BaseBadge :variant="getStatusVariant(item.status)" class="capitalize">
            {{ item.status ?? 'unknown' }}
          </BaseBadge>
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
          <button
            type="button"
            class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title="View details"
            @click="viewWebhook(item)"
          >
            <CodeBracketIcon class="h-5 w-5" />
          </button>
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
              <dt class="text-xs text-gray-500 dark:text-gray-400">ID</dt>
              <dd class="font-mono text-sm text-gray-900 dark:text-white">
                #{{ selectedWebhook.id }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Gateway</dt>
              <dd class="text-sm font-medium text-gray-900 dark:text-white">
                {{ getGatewayLabel(selectedWebhook.gateway) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Event</dt>
              <dd class="font-mono text-sm text-gray-900 dark:text-white">
                {{ selectedWebhook.event }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Status</dt>
              <dd>
                <BaseBadge :variant="getStatusVariant(selectedWebhook.status)" size="sm" class="capitalize">
                  {{ selectedWebhook.status ?? 'unknown' }}
                </BaseBadge>
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Received</dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                {{ date.format(selectedWebhook.created_at, 'MMM D, YYYY h:mm:ss A') }}
              </dd>
            </div>
          </dl>
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
        <div class="flex justify-end">
          <BaseButton variant="secondary" @click="showDetailModal = false">
            Close
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
