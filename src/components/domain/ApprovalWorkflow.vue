<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Approval Workflow — Approve/reject UI for vendors, products, etc. -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/vue/24/outline'
import BaseButton from '../ui/BaseButton.vue'

interface Props {
  entityType: 'vendor' | 'product' | 'payout' | 'review'
  entityId: string | number
  currentStatus: string
  showReasonField?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showReasonField: true,
  loading: false,
})

const emit = defineEmits<{
  (e: 'approve', data: { id: string | number; note: string }): void
  (e: 'reject', data: { id: string | number; reason: string }): void
}>()

const note = ref('')
const reason = ref('')
const showRejectForm = ref(false)

const isPending = computed(() => {
  const pendingStatuses = ['pending', 'pending_approval', 'under_review', 'submitted']
  return pendingStatuses.includes(props.currentStatus.toLowerCase().replace(/[\s-]/g, '_'))
})

function handleApprove() {
  emit('approve', { id: props.entityId, note: note.value })
  note.value = ''
}

function handleReject() {
  emit('reject', { id: props.entityId, reason: reason.value })
  reason.value = ''
  showRejectForm.value = false
}

function toggleRejectForm() {
  showRejectForm.value = !showRejectForm.value
}

const statusDisplay = computed(() => {
  const s = props.currentStatus.toLowerCase()
  if (s === 'approved' || s === 'active') return { label: 'Approved', color: 'text-success-600 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-900/20' }
  if (s === 'rejected') return { label: 'Rejected', color: 'text-danger-600 dark:text-danger-400', bg: 'bg-danger-50 dark:bg-danger-900/20' }
  return { label: 'Pending Review', color: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-900/20' }
})
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
    <!-- Status header -->
    <div class="mb-4 flex items-center justify-between">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white">
        Approval Status
      </h4>
      <span
        :class="[
          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
          statusDisplay.bg,
          statusDisplay.color,
        ]"
      >
        {{ statusDisplay.label }}
      </span>
    </div>

    <!-- Action buttons (only when pending) -->
    <template v-if="isPending">
      <!-- Note field -->
      <div v-if="showReasonField && !showRejectForm" class="mb-3">
        <textarea
          v-model="note"
          placeholder="Optional approval note..."
          rows="2"
          class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
        />
      </div>

      <!-- Reject reason form -->
      <div v-if="showRejectForm" class="mb-3">
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Rejection reason <span class="text-danger-500">*</span>
        </label>
        <textarea
          v-model="reason"
          placeholder="Please provide a reason for rejection..."
          rows="3"
          class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-danger-500 focus:outline-none focus:ring-1 focus:ring-danger-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
        />
        <div class="mt-2 flex gap-2">
          <BaseButton
            size="sm"
            variant="danger"
            :disabled="!reason.trim() || loading"
            :loading="loading"
            :icon="XMarkIcon"
            @click="handleReject"
          >
            Confirm Rejection
          </BaseButton>
          <BaseButton
            size="sm"
            variant="ghost"
            @click="toggleRejectForm"
          >
            Cancel
          </BaseButton>
        </div>
      </div>

      <!-- Action buttons -->
      <div v-if="!showRejectForm" class="flex gap-2">
        <BaseButton
          size="sm"
          variant="success"
          :icon="CheckIcon"
          :loading="loading"
          @click="handleApprove"
        >
          Approve
        </BaseButton>
        <BaseButton
          size="sm"
          variant="danger"
          :icon="XMarkIcon"
          @click="toggleRejectForm"
        >
          Reject
        </BaseButton>
      </div>
    </template>

    <!-- Already processed -->
    <div
      v-else
      class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
    >
      <ChatBubbleLeftEllipsisIcon class="h-4 w-4" />
      This {{ entityType }} has been {{ currentStatus.toLowerCase() }}.
    </div>
  </div>
</template>
