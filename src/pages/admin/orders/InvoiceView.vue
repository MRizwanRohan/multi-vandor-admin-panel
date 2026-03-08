<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Invoice View — Printable invoice with PDF download (Admin)        -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { orderService } from '@/services'
import { useCurrency } from '@/composables'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import type { Invoice } from '@/types'
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const { formatCurrency } = useCurrency()

const orderId = computed(() => {
  const id = Number(route.params.id)
  return isNaN(id) ? null : id
})

const invoice = ref<Invoice | null>(null)
const isLoading = ref(true)
const isDownloading = ref(false)
const error = ref<string | null>(null)

// Status badge variant
function statusVariant(status: string) {
  const s = status.toLowerCase()
  if (s === 'paid') return 'success'
  if (s === 'pending') return 'warning'
  if (['cancelled', 'refunded'].includes(s)) return 'danger'
  return 'secondary'
}

// Status icon
function statusIcon(status: string) {
  const s = status.toLowerCase()
  if (s === 'paid') return CheckCircleIcon
  if (['cancelled', 'refunded'].includes(s)) return XCircleIcon
  return ClockIcon
}

async function fetchInvoice() {
  if (!orderId.value) return
  isLoading.value = true
  error.value = null
  try {
    invoice.value = await orderService.getInvoice(orderId.value)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load invoice'
  } finally {
    isLoading.value = false
  }
}

async function downloadPdf() {
  if (!orderId.value) return
  isDownloading.value = true
  try {
    const blob = await orderService.downloadInvoicePdf(orderId.value)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${invoice.value?.invoice_number || orderId.value}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'PDF download failed'
  } finally {
    isDownloading.value = false
  }
}

function printInvoice() {
  window.print()
}

onMounted(() => {
  breadcrumbStore.setPageInfo('Invoice', [
    { label: 'Orders', to: '/admin/orders' },
    { label: `Order #${route.params.id}`, to: `/admin/orders/${route.params.id}` },
    { label: 'Invoice' },
  ])
  fetchInvoice()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar — hidden when printing -->
    <div class="print:hidden flex items-center justify-between gap-4">
      <button
        type="button"
        class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        @click="router.push(`/admin/orders/${orderId}`)"
      >
        <ArrowLeftIcon class="h-4 w-4" />
        Back to Order
      </button>
      <div class="flex gap-2">
        <button
          type="button"
          :disabled="isDownloading || isLoading"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          @click="downloadPdf"
        >
          <ArrowDownTrayIcon class="h-4 w-4" :class="isDownloading && 'animate-bounce'" />
          {{ isDownloading ? 'Downloading…' : 'Download PDF' }}
        </button>
        <button
          type="button"
          :disabled="isLoading"
          class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
          @click="printInvoice"
        >
          <PrinterIcon class="h-4 w-4" />
          Print
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-24">
      <AppSpinner size="lg" />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-lg bg-red-50 p-6 text-center text-red-700 dark:bg-red-900/20 dark:text-red-400 print:hidden"
    >
      {{ error }}
    </div>

    <!-- Invoice Document -->
    <div
      v-else-if="invoice"
      class="mx-auto max-w-4xl rounded-2xl bg-white shadow-lg print:shadow-none print:rounded-none dark:bg-gray-900 print:dark:bg-white"
    >
      <!-- Header band -->
      <div class="flex flex-col gap-6 rounded-t-2xl bg-gradient-to-r from-primary-600 to-primary-800 px-10 py-8 text-white print:rounded-none sm:flex-row sm:items-start sm:justify-between">
        <!-- Company info -->
        <div>
          <p class="text-2xl font-bold tracking-tight">{{ invoice.company.name }}</p>
          <p v-if="invoice.company.address" class="mt-1 text-sm text-primary-100">{{ invoice.company.address }}</p>
          <p v-if="invoice.company.phone" class="text-sm text-primary-100">{{ invoice.company.phone }}</p>
          <p v-if="invoice.company.email" class="text-sm text-primary-100">{{ invoice.company.email }}</p>
        </div>
        <!-- Invoice meta -->
        <div class="text-right">
          <p class="text-3xl font-extrabold tracking-tight">INVOICE</p>
          <p class="mt-1 text-lg font-semibold text-primary-100"># {{ invoice.invoice_number }}</p>
          <div class="mt-2 flex items-center justify-end gap-2">
            <component :is="statusIcon(invoice.status)" class="h-4 w-4" />
            <BaseBadge :variant="statusVariant(invoice.status)" class="uppercase text-xs">
              {{ invoice.status }}
            </BaseBadge>
          </div>
        </div>
      </div>

      <div class="px-10 py-8 space-y-8">
        <!-- Dates + Order number -->
        <div class="flex flex-wrap gap-6 rounded-xl border border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800 print:bg-gray-50 print:border-gray-200">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Order Number</p>
            <p class="mt-1 font-semibold text-gray-900 dark:text-white print:text-gray-900">{{ invoice.order_number }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Order Date</p>
            <p class="mt-1 font-semibold text-gray-900 dark:text-white print:text-gray-900">{{ invoice.order_date_formatted }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Invoice Date</p>
            <p class="mt-1 font-semibold text-gray-900 dark:text-white print:text-gray-900">{{ invoice.invoice_date_formatted }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Due Date</p>
            <p class="mt-1 font-semibold text-gray-900 dark:text-white print:text-gray-900">{{ invoice.due_date_formatted }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Payment Method</p>
            <p class="mt-1 font-semibold text-gray-900 dark:text-white print:text-gray-900">{{ invoice.payment_method || 'N/A' }}</p>
          </div>
        </div>

        <!-- Bill To / Ship To -->
        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Bill To</p>
            <p class="font-semibold text-gray-900 dark:text-white print:text-gray-900">{{ invoice.customer.name }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400 print:text-gray-600">{{ invoice.customer.email }}</p>
            <p v-if="invoice.customer.phone" class="text-sm text-gray-600 dark:text-gray-400 print:text-gray-600">{{ invoice.customer.phone }}</p>
            <template v-if="invoice.billing_address">
              <p class="mt-2 text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">{{ invoice.billing_address.address_line_1 }}</p>
              <p v-if="invoice.billing_address.address_line_2" class="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">{{ invoice.billing_address.address_line_2 }}</p>
              <p class="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">
                {{ invoice.billing_address.city }}<template v-if="invoice.billing_address.state">, {{ invoice.billing_address.state }}</template>
                {{ invoice.billing_address.postal_code }}
              </p>
              <p class="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">{{ invoice.billing_address.country }}</p>
            </template>
          </div>
          <div v-if="invoice.shipping_address">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Ship To</p>
            <p v-if="invoice.shipping_address.name" class="font-semibold text-gray-900 dark:text-white print:text-gray-900">{{ invoice.shipping_address.name }}</p>
            <p v-if="invoice.shipping_address.phone" class="text-sm text-gray-600 dark:text-gray-400 print:text-gray-600">{{ invoice.shipping_address.phone }}</p>
            <p class="mt-1 text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">{{ invoice.shipping_address.address_line_1 }}</p>
            <p v-if="invoice.shipping_address.address_line_2" class="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">{{ invoice.shipping_address.address_line_2 }}</p>
            <p class="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">
              {{ invoice.shipping_address.city }}<template v-if="invoice.shipping_address.state">, {{ invoice.shipping_address.state }}</template>
              {{ invoice.shipping_address.postal_code }}
            </p>
            <p class="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700">{{ invoice.shipping_address.country }}</p>
          </div>
        </div>

        <!-- Items Table -->
        <div class="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700 print:border-gray-200">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800 print:bg-gray-100">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Item</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Qty</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Unit Price</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Discount</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700 print:divide-gray-200">
              <tr
                v-for="(item, i) in invoice.items"
                :key="i"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 print:hover:bg-transparent"
              >
                <td class="px-4 py-4">
                  <p class="font-medium text-gray-900 dark:text-white print:text-gray-900">{{ item.product_name }}</p>
                  <p v-if="item.variant_name" class="text-xs text-gray-500">{{ item.variant_name }}</p>
                  <p v-if="item.sku" class="text-xs text-gray-400">SKU: {{ item.sku }}</p>
                </td>
                <td class="px-4 py-4 text-right text-gray-700 dark:text-gray-300 print:text-gray-700">{{ item.quantity }}</td>
                <td class="px-4 py-4 text-right text-gray-700 dark:text-gray-300 print:text-gray-700">{{ formatCurrency(item.unit_price) }}</td>
                <td class="px-4 py-4 text-right text-red-500">
                  {{ item.discount > 0 ? `-${formatCurrency(item.discount)}` : '—' }}
                </td>
                <td class="px-4 py-4 text-right font-semibold text-gray-900 dark:text-white print:text-gray-900">{{ formatCurrency(item.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="flex justify-end">
          <div class="w-full max-w-sm space-y-2 rounded-xl border border-gray-100 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-800 print:bg-gray-50 print:border-gray-200">
            <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 print:text-gray-600">
              <span>Subtotal</span>
              <span>{{ invoice.summary.subtotal_formatted }}</span>
            </div>
            <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 print:text-gray-600">
              <span>Shipping</span>
              <span>{{ invoice.summary.shipping_amount_formatted }}</span>
            </div>
            <div v-if="invoice.summary.tax_amount > 0" class="flex justify-between text-sm text-gray-600 dark:text-gray-400 print:text-gray-600">
              <span>Tax</span>
              <span>{{ invoice.summary.tax_amount_formatted }}</span>
            </div>
            <div v-if="invoice.summary.discount_amount > 0" class="flex justify-between text-sm text-red-500">
              <span>Discount</span>
              <span>-{{ invoice.summary.discount_amount_formatted }}</span>
            </div>
            <div class="mt-2 border-t border-gray-200 pt-3 dark:border-gray-600 print:border-gray-300">
              <div class="flex justify-between text-lg font-bold text-gray-900 dark:text-white print:text-gray-900">
                <span>Total</span>
                <span>{{ invoice.summary.total_amount_formatted }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer note -->
        <p class="text-center text-xs text-gray-400 pb-2">
          Thank you for your order! — {{ invoice.company.name }}
          <span v-if="invoice.company.email"> · {{ invoice.company.email }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  .print\:hidden {
    display: none !important;
  }
}
</style>
