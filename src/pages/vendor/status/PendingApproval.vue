<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Pending Approval — Status page for vendors awaiting approval -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import {
  ClockIcon,
  DocumentCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()

// Mock vendor data (in real app would come from auth store or API)
const vendorData = ref({
  store_name: authStore.user?.name || 'Your Store',
  submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'pending_review', // pending_documents, pending_review, under_review
  documents_submitted: true,
  estimated_review_days: 3,
})

// Computed
const statusSteps = computed(() => [
  {
    label: 'Application Submitted',
    description: 'Your vendor application has been received',
    status: 'completed',
    icon: DocumentTextIcon,
  },
  {
    label: 'Documents Verification',
    description: 'Your documents are being verified',
    status: vendorData.value.documents_submitted ? 'completed' : 'pending',
    icon: DocumentCheckIcon,
  },
  {
    label: 'Under Review',
    description: 'Your application is being reviewed by our team',
    status: vendorData.value.status === 'under_review' ? 'current' : (vendorData.value.status === 'pending_review' ? 'current' : 'pending'),
    icon: ClockIcon,
  },
  {
    label: 'Approval Decision',
    description: 'Final approval decision pending',
    status: 'pending',
    icon: CheckCircleIcon,
  },
])

const daysWaiting = computed(() => {
  const submitted = new Date(vendorData.value.submitted_at)
  const now = new Date()
  return Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24))
})

const formattedSubmitDate = computed(() => {
  return new Date(vendorData.value.submitted_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

function getStepClasses(status: string) {
  switch (status) {
    case 'completed':
      return {
        circle: 'bg-green-500',
        icon: 'text-white',
        line: 'bg-green-500',
        text: 'text-gray-900 dark:text-white',
      }
    case 'current':
      return {
        circle: 'bg-indigo-500 animate-pulse',
        icon: 'text-white',
        line: 'bg-gray-300 dark:bg-gray-600',
        text: 'text-indigo-600 dark:text-indigo-400 font-semibold',
      }
    default:
      return {
        circle: 'bg-gray-300 dark:bg-gray-600',
        icon: 'text-gray-500 dark:text-gray-400',
        line: 'bg-gray-300 dark:bg-gray-600',
        text: 'text-gray-500 dark:text-gray-400',
      }
  }
}

function contactSupport() {
  window.location.href = 'mailto:support@mve.com?subject=Vendor%20Application%20Inquiry'
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    <div class="max-w-2xl w-full space-y-6">
      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
          <ClockIcon class="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Application Pending</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Your vendor application for <span class="font-semibold">{{ vendorData.store_name }}</span> is being reviewed
        </p>
      </div>

      <!-- Status Card -->
      <BaseCard>
        <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-6 flex items-start gap-3">
          <ExclamationCircleIcon class="h-6 w-6 text-yellow-600 flex-shrink-0" />
          <div>
            <p class="font-medium text-yellow-800 dark:text-yellow-200">Review in Progress</p>
            <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Submitted on {{ formattedSubmitDate }} ({{ daysWaiting }} days ago).
              Estimated completion: {{ vendorData.estimated_review_days }} business days.
            </p>
          </div>
        </div>

        <!-- Progress Steps -->
        <div class="relative">
          <div v-for="(step, index) in statusSteps" :key="step.label" class="relative pb-8 last:pb-0">
            <!-- Vertical line -->
            <div
              v-if="index < statusSteps.length - 1"
              class="absolute left-5 top-10 w-0.5 h-full -ml-px"
              :class="getStepClasses(step.status).line"
            ></div>
            
            <!-- Step -->
            <div class="flex items-start gap-4">
              <div
                class="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                :class="getStepClasses(step.status).circle"
              >
                <component :is="step.icon" class="h-5 w-5" :class="getStepClasses(step.status).icon" />
              </div>
              <div class="pt-1">
                <p :class="getStepClasses(step.status).text">{{ step.label }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ step.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- What's Next -->
      <BaseCard title="What Happens Next?">
        <ul class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <li class="flex items-start gap-3">
            <CheckCircleIcon class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>Our team is reviewing your store details and documents</span>
          </li>
          <li class="flex items-start gap-3">
            <CheckCircleIcon class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>You will receive an email notification once approved</span>
          </li>
          <li class="flex items-start gap-3">
            <CheckCircleIcon class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>After approval, you can start adding products immediately</span>
          </li>
        </ul>
      </BaseCard>

      <!-- Contact Support -->
      <BaseCard>
        <div class="text-center py-4">
          <h3 class="font-medium text-gray-900 dark:text-white mb-2">Have Questions?</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            If you have any questions about your application, feel free to contact our support team.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <BaseButton variant="secondary" @click="contactSupport">
              <EnvelopeIcon class="h-5 w-5 mr-2" />
              Email Support
            </BaseButton>
            <BaseButton variant="secondary" as="a" href="tel:+8801234567890">
              <PhoneIcon class="h-5 w-5 mr-2" />
              Call Support
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- Footer -->
      <p class="text-center text-sm text-gray-500 dark:text-gray-400">
        Application ID: VND-{{ Date.now().toString(36).toUpperCase() }}
      </p>
    </div>
  </div>
</template>
