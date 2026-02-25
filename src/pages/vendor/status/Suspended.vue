<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Vendor Suspended — Status page for suspended vendors -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import {
  ExclamationTriangleIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

// Mock suspension data (in real app would come from API)
const suspensionData = ref({
  store_name: authStore.user?.name || 'Your Store',
  suspended_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  reason: 'policy_violation', // policy_violation, payment_issue, fraud, other
  reason_details: 'Multiple customer complaints regarding product quality and delivery delays.',
  appeal_submitted: false,
  appeal_status: null as string | null, // pending, rejected
  can_appeal: true,
})

// Computed
const reasonLabels: Record<string, { title: string; description: string }> = {
  policy_violation: {
    title: 'Policy Violation',
    description: 'Your account has been suspended due to violations of our marketplace policies.',
  },
  payment_issue: {
    title: 'Payment Issue',
    description: 'Your account has been suspended due to unresolved payment or commission issues.',
  },
  fraud: {
    title: 'Suspected Fraud',
    description: 'Your account has been suspended pending investigation of suspicious activity.',
  },
  other: {
    title: 'Account Review',
    description: 'Your account has been suspended for review. Please contact support for details.',
  },
}

const formattedSuspensionDate = computed(() => {
  return new Date(suspensionData.value.suspended_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const daysSuspended = computed(() => {
  const suspended = new Date(suspensionData.value.suspended_at)
  const now = new Date()
  return Math.floor((now.getTime() - suspended.getTime()) / (1000 * 60 * 60 * 24))
})

const reasonInfo = computed(() => 
  reasonLabels[suspensionData.value.reason] || reasonLabels.other
)

// Actions
function submitAppeal() {
  // In real app, this would open a modal or navigate to appeal form
  alert('Appeal form would open here')
  suspensionData.value.appeal_submitted = true
  suspensionData.value.appeal_status = 'pending'
}

function contactSupport() {
  window.location.href = 'mailto:support@mve.com?subject=Account%20Suspension%20Inquiry'
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    <div class="max-w-2xl w-full space-y-6">
      <!-- Header -->
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <ShieldExclamationIcon class="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Account Suspended</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Your vendor account for <span class="font-semibold">{{ suspensionData.store_name }}</span> has been suspended
        </p>
      </div>

      <!-- Suspension Details -->
      <BaseCard>
        <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-6 flex items-start gap-3">
          <ExclamationTriangleIcon class="h-6 w-6 text-red-600 flex-shrink-0" />
          <div>
            <p class="font-medium text-red-800 dark:text-red-200">{{ reasonInfo.title }}</p>
            <p class="text-sm text-red-700 dark:text-red-300 mt-1">
              {{ reasonInfo.description }}
            </p>
          </div>
        </div>

        <!-- Suspension Info -->
        <div class="space-y-4">
          <div class="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <span class="text-gray-500">Suspended On</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ formattedSuspensionDate }}</span>
          </div>
          <div class="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <span class="text-gray-500">Days Suspended</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ daysSuspended }} days</span>
          </div>
          <div v-if="suspensionData.reason_details" class="py-3">
            <span class="text-gray-500 block mb-2">Additional Details</span>
            <p class="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
              {{ suspensionData.reason_details }}
            </p>
          </div>
        </div>

        <!-- Appeal Status -->
        <div v-if="suspensionData.appeal_submitted" class="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-start gap-3">
          <InformationCircleIcon class="h-6 w-6 text-yellow-600 flex-shrink-0" />
          <div>
            <p class="font-medium text-yellow-800 dark:text-yellow-200">Appeal Submitted</p>
            <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Your appeal is currently under review. We will notify you via email once a decision is made.
            </p>
          </div>
        </div>
      </BaseCard>

      <!-- What You Can Do -->
      <BaseCard title="What You Can Do">
        <ul class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <li class="flex items-start gap-3">
            <DocumentTextIcon class="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <span>Review our <a href="#" class="text-indigo-600 dark:text-indigo-400 hover:underline">Seller Policies</a> to understand the violation</span>
          </li>
          <li class="flex items-start gap-3">
            <EnvelopeIcon class="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <span>Contact support if you believe this suspension was made in error</span>
          </li>
          <li class="flex items-start gap-3">
            <DocumentTextIcon class="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <span>Submit an appeal with supporting documentation</span>
          </li>
        </ul>

        <!-- Actions -->
        <div class="mt-6 flex flex-col sm:flex-row gap-3">
          <BaseButton
            v-if="suspensionData.can_appeal && !suspensionData.appeal_submitted"
            @click="submitAppeal"
          >
            <DocumentTextIcon class="h-5 w-5 mr-2" />
            Submit Appeal
          </BaseButton>
          <BaseButton variant="secondary" @click="contactSupport">
            <EnvelopeIcon class="h-5 w-5 mr-2" />
            Contact Support
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Important Notice -->
      <BaseCard>
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 class="font-medium text-gray-900 dark:text-white mb-2">Important Information</h4>
          <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Your existing orders will continue to be processed</li>
            <li>• Pending payouts will be held until the suspension is resolved</li>
            <li>• You cannot create new listings or modify existing products</li>
            <li>• Your store is hidden from customers during suspension</li>
          </ul>
        </div>
      </BaseCard>

      <!-- Contact & Logout -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <BaseButton variant="secondary" as="a" href="tel:+8801234567890">
          <PhoneIcon class="h-5 w-5 mr-2" />
          Call: +880 1234 567 890
        </BaseButton>
        <BaseButton variant="ghost" @click="logout">
          <ArrowRightOnRectangleIcon class="h-5 w-5 mr-2" />
          Logout
        </BaseButton>
      </div>

      <!-- Footer -->
      <p class="text-center text-sm text-gray-500 dark:text-gray-400">
        Reference ID: SUS-{{ suspensionData.suspended_at.substring(0, 10).replace(/-/g, '') }}
      </p>
    </div>
  </div>
</template>
