<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor NID Verification — Upload NID for identity verification   -->
<!-- Uses POST /vendor/settings/nid, GET /vendor/settings/nid-status  -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import { vendorService } from '@/services'
import { useToast, useDate } from '@/composables'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormInput from '@/components/form/FormInput.vue'
import {
  IdentificationIcon,
  ShieldCheckIcon,
  ClockIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  DocumentIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDateTime } = useDate()

// ── State ────────────────────────────────────────────────────────

interface NidStatus {
  nid_number: string | null
  nid_front_image: string | null
  nid_back_image: string | null
  nid_verified: boolean
  nid_verified_at: string | null
  status: 'not_submitted' | 'pending' | 'verified' | 'rejected'
}

const nidStatus = ref<NidStatus | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)

// Form
const nidNumber = ref('')
const nidFront = ref<File | null>(null)
const nidBack = ref<File | null>(null)
const nidFrontPreview = ref<string | null>(null)
const nidBackPreview = ref<string | null>(null)

const nidFrontInput = ref<HTMLInputElement | null>(null)
const nidBackInput = ref<HTMLInputElement | null>(null)

// ── Computed ─────────────────────────────────────────────────────

const canSubmit = computed(() => {
  if (!nidStatus.value) return false
  const s = nidStatus.value.status
  return s === 'not_submitted' || s === 'rejected'
})

const isFormValid = computed(() => {
  return nidNumber.value.length >= 10 && nidFront.value && nidBack.value
})

const statusConfig = computed(() => {
  if (!nidStatus.value) return null
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info'; icon: any; description: string }> = {
    not_submitted: {
      label: 'Not Submitted',
      variant: 'info',
      icon: DocumentIcon,
      description: 'You have not submitted your NID documents yet. Please upload your NID to get verified.',
    },
    pending: {
      label: 'Under Review',
      variant: 'warning',
      icon: ClockIcon,
      description: 'Your NID documents are being reviewed by our team. This usually takes 1-2 business days.',
    },
    verified: {
      label: 'Verified',
      variant: 'success',
      icon: CheckCircleIcon,
      description: 'Your identity has been verified successfully.',
    },
    rejected: {
      label: 'Rejected',
      variant: 'danger',
      icon: XCircleIcon,
      description: 'Your NID verification was rejected. Please re-upload clear, valid documents.',
    },
  }
  return map[nidStatus.value.status] || map.not_submitted
})

// ── Fetch ────────────────────────────────────────────────────────

async function fetchNidStatus() {
  isLoading.value = true
  try {
    nidStatus.value = await vendorService.getNidStatus()
    if (nidStatus.value.nid_number) {
      nidNumber.value = nidStatus.value.nid_number
    }
  } catch {
    toast.error('Failed to load NID status')
  } finally {
    isLoading.value = false
  }
}

// ── File Handling ────────────────────────────────────────────────

function onFrontFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }
    nidFront.value = file
    nidFrontPreview.value = URL.createObjectURL(file)
  }
}

function onBackFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }
    nidBack.value = file
    nidBackPreview.value = URL.createObjectURL(file)
  }
}

function removeFront() {
  nidFront.value = null
  nidFrontPreview.value = null
  if (nidFrontInput.value) nidFrontInput.value.value = ''
}

function removeBack() {
  nidBack.value = null
  nidBackPreview.value = null
  if (nidBackInput.value) nidBackInput.value.value = ''
}

// ── Submit ───────────────────────────────────────────────────────

async function handleSubmit() {
  if (!nidFront.value || !nidBack.value || !nidNumber.value) return

  isSubmitting.value = true
  try {
    await vendorService.uploadNid({
      nid_number: nidNumber.value,
      nid_front: nidFront.value,
      nid_back: nidBack.value,
    })
    toast.success('NID documents uploaded successfully. Verification is pending.')
    // Reset form and refresh status
    nidFront.value = null
    nidBack.value = null
    nidFrontPreview.value = null
    nidBackPreview.value = null
    await fetchNidStatus()
  } catch {
    toast.error('Failed to upload NID documents')
  } finally {
    isSubmitting.value = false
  }
}

// ── Init ─────────────────────────────────────────────────────────

onMounted(() => {
  breadcrumbStore.setPageInfo('NID Verification', [
    { label: 'Settings' },
    { label: 'NID Verification' },
  ], 'Upload your NID for identity verification')
  fetchNidStatus()
})
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>

    <template v-else-if="nidStatus && statusConfig">
      <!-- Status Banner -->
      <div
        class="flex items-start gap-4 rounded-lg border p-4"
        :class="{
          'border-info-200 bg-info-50 dark:border-info-800 dark:bg-info-900/20': statusConfig.variant === 'info',
          'border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-900/20': statusConfig.variant === 'warning',
          'border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20': statusConfig.variant === 'success',
          'border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/20': statusConfig.variant === 'danger',
        }"
      >
        <component
          :is="statusConfig.icon"
          class="h-6 w-6 shrink-0"
          :class="{
            'text-info-600 dark:text-info-400': statusConfig.variant === 'info',
            'text-warning-600 dark:text-warning-400': statusConfig.variant === 'warning',
            'text-success-600 dark:text-success-400': statusConfig.variant === 'success',
            'text-danger-600 dark:text-danger-400': statusConfig.variant === 'danger',
          }"
        />
        <div>
          <div class="flex items-center gap-2">
            <h4
              class="font-medium"
              :class="{
                'text-info-800 dark:text-info-200': statusConfig.variant === 'info',
                'text-warning-800 dark:text-warning-200': statusConfig.variant === 'warning',
                'text-success-800 dark:text-success-200': statusConfig.variant === 'success',
                'text-danger-800 dark:text-danger-200': statusConfig.variant === 'danger',
              }"
            >
              NID Verification
            </h4>
            <BaseBadge :variant="statusConfig.variant">
              {{ statusConfig.label }}
            </BaseBadge>
          </div>
          <p
            class="mt-1 text-sm"
            :class="{
              'text-info-600 dark:text-info-400': statusConfig.variant === 'info',
              'text-warning-600 dark:text-warning-400': statusConfig.variant === 'warning',
              'text-success-600 dark:text-success-400': statusConfig.variant === 'success',
              'text-danger-600 dark:text-danger-400': statusConfig.variant === 'danger',
            }"
          >
            {{ statusConfig.description }}
          </p>
          <p
            v-if="nidStatus.nid_verified && nidStatus.nid_verified_at"
            class="mt-1 text-xs text-success-500"
          >
            Verified on {{ formatDateTime(nidStatus.nid_verified_at) }}
          </p>
        </div>
      </div>

      <!-- Verified — Show NID info -->
      <BaseCard v-if="nidStatus.status === 'verified'">
        <div class="mb-4 flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/50">
            <ShieldCheckIcon class="h-6 w-6 text-success-600 dark:text-success-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Verified Identity
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Your NID has been verified
            </p>
          </div>
        </div>
        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500 dark:text-gray-400">NID Number</span>
            <span class="font-mono font-medium text-gray-900 dark:text-white">
              {{ nidStatus.nid_number ? `****${nidStatus.nid_number.slice(-4)}` : '—' }}
            </span>
          </div>
        </div>
      </BaseCard>

      <!-- Pending — Show submitted info -->
      <BaseCard v-if="nidStatus.status === 'pending'">
        <div class="mb-4 flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/50">
            <ClockIcon class="h-6 w-6 text-warning-600 dark:text-warning-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Documents Submitted
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              NID Number: {{ nidStatus.nid_number ? `****${nidStatus.nid_number.slice(-4)}` : '—' }}
            </p>
          </div>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Our team is reviewing your documents. You'll be notified once the verification is complete.
        </p>
      </BaseCard>

      <!-- Upload Form — Show when not_submitted or rejected -->
      <BaseCard v-if="canSubmit">
        <div class="mb-6 flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/50">
            <IdentificationIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Upload NID Documents
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Upload clear photos of your National ID card (front and back)
            </p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- NID Number -->
          <FormInput
            v-model="nidNumber"
            label="NID Number"
            name="nid_number"
            placeholder="Enter your NID number"
            hint="Your 10 or 17 digit National ID number"
            required
          />

          <!-- Front Image -->
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              NID Front Side <span class="text-danger-500">*</span>
            </label>
            <div
              v-if="!nidFrontPreview && !nidStatus.nid_front_image"
              class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-primary-500 dark:border-gray-600 dark:hover:border-primary-400"
              @click="nidFrontInput?.click()"
            >
              <ArrowUpTrayIcon class="mb-2 h-8 w-8 text-gray-400" />
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload front side</p>
              <p class="mt-1 text-xs text-gray-400">JPG, PNG — Max 5MB</p>
            </div>
            <div v-else class="relative">
              <img
                :src="nidFrontPreview || nidStatus.nid_front_image || ''"
                alt="NID Front"
                class="h-48 w-full rounded-lg border border-gray-200 object-contain dark:border-gray-700"
              />
              <button
                v-if="nidFrontPreview"
                type="button"
                class="absolute right-2 top-2 rounded-full bg-danger-600 p-1 text-white shadow hover:bg-danger-700"
                @click="removeFront"
              >
                <XCircleIcon class="h-5 w-5" />
              </button>
            </div>
            <input
              ref="nidFrontInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onFrontFileChange"
            />
          </div>

          <!-- Back Image -->
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              NID Back Side <span class="text-danger-500">*</span>
            </label>
            <div
              v-if="!nidBackPreview && !nidStatus.nid_back_image"
              class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-primary-500 dark:border-gray-600 dark:hover:border-primary-400"
              @click="nidBackInput?.click()"
            >
              <ArrowUpTrayIcon class="mb-2 h-8 w-8 text-gray-400" />
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload back side</p>
              <p class="mt-1 text-xs text-gray-400">JPG, PNG — Max 5MB</p>
            </div>
            <div v-else class="relative">
              <img
                :src="nidBackPreview || nidStatus.nid_back_image || ''"
                alt="NID Back"
                class="h-48 w-full rounded-lg border border-gray-200 object-contain dark:border-gray-700"
              />
              <button
                v-if="nidBackPreview"
                type="button"
                class="absolute right-2 top-2 rounded-full bg-danger-600 p-1 text-white shadow hover:bg-danger-700"
                @click="removeBack"
              >
                <XCircleIcon class="h-5 w-5" />
              </button>
            </div>
            <input
              ref="nidBackInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onBackFileChange"
            />
          </div>

          <div class="flex justify-end">
            <BaseButton
              type="submit"
              variant="primary"
              :loading="isSubmitting"
              :disabled="!isFormValid"
            >
              <ArrowUpTrayIcon class="mr-2 h-4 w-4" />
              Submit for Verification
            </BaseButton>
          </div>
        </form>
      </BaseCard>

      <!-- Guidelines -->
      <BaseCard>
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Verification Guidelines
        </h3>
        <ul class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <li class="flex gap-2">
            <CheckCircleIcon class="h-5 w-5 shrink-0 text-success-500" />
            Upload clear, high-resolution photos of your NID
          </li>
          <li class="flex gap-2">
            <CheckCircleIcon class="h-5 w-5 shrink-0 text-success-500" />
            Ensure all text on the NID is readable
          </li>
          <li class="flex gap-2">
            <CheckCircleIcon class="h-5 w-5 shrink-0 text-success-500" />
            Upload both front and back sides
          </li>
          <li class="flex gap-2">
            <CheckCircleIcon class="h-5 w-5 shrink-0 text-success-500" />
            Accepted formats: JPG, PNG (max 5MB each)
          </li>
          <li class="flex gap-2">
            <XCircleIcon class="h-5 w-5 shrink-0 text-danger-500" />
            Do not upload blurry or cropped images
          </li>
          <li class="flex gap-2">
            <XCircleIcon class="h-5 w-5 shrink-0 text-danger-500" />
            Do not upload expired or damaged NID
          </li>
        </ul>
      </BaseCard>
    </template>
  </div>
</template>
