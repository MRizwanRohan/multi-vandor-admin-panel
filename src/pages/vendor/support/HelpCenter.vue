<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Help Center — Vendor: help articles, support tickets, contact     -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBreadcrumbStore } from '@/stores'
import BaseCard from '@/components/ui/BaseCard.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import {
  MagnifyingGlassIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'

const breadcrumbStore = useBreadcrumbStore()

const searchQuery = ref('')
const activeSection = ref<'articles' | 'tickets' | 'contact'>('articles')
const showNewTicket = ref(false)

// Help articles
interface HelpArticle {
  id: number
  title: string
  category: string
  excerpt: string
  updated: string
}

const articles = ref<HelpArticle[]>([
  { id: 1, title: 'How to Add Your First Product', category: 'Getting Started', excerpt: 'Step-by-step guide to listing your first product on the marketplace.', updated: '2026-02-20' },
  { id: 2, title: 'Understanding Commission Structure', category: 'Payments', excerpt: 'Learn how commissions are calculated and when you get paid.', updated: '2026-02-18' },
  { id: 3, title: 'Managing Product Variants', category: 'Products', excerpt: 'How to set up sizes, colors, and other product variations.', updated: '2026-02-15' },
  { id: 4, title: 'Shipping Zone Configuration', category: 'Shipping', excerpt: 'Set up shipping zones and delivery methods for your products.', updated: '2026-02-12' },
  { id: 5, title: 'Processing Orders & Fulfillment', category: 'Orders', excerpt: 'Guide to processing, shipping, and completing customer orders.', updated: '2026-02-10' },
  { id: 6, title: 'Requesting a Payout', category: 'Payments', excerpt: 'How to request and track your earnings payouts.', updated: '2026-02-08' },
  { id: 7, title: 'Creating Coupons & Promotions', category: 'Marketing', excerpt: 'Set up discount codes and promotional offers for customers.', updated: '2026-02-05' },
  { id: 8, title: 'Shop Settings & Branding', category: 'Getting Started', excerpt: 'Customize your shop profile, logo, and banner.', updated: '2026-02-01' },
])

const articleCategories = computed(() => {
  const cats = new Set(articles.value.map((a) => a.category))
  return Array.from(cats)
})

const filteredArticles = computed(() => {
  if (!searchQuery.value) return articles.value
  const q = searchQuery.value.toLowerCase()
  return articles.value.filter(
    (a) => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q),
  )
})

// Support tickets
interface SupportTicket {
  id: number
  subject: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created: string
  last_reply: string
  messages_count: number
}

const tickets = ref<SupportTicket[]>([
  { id: 1001, subject: 'Payment not received for order #2345', status: 'in_progress', priority: 'high', created: '2026-02-22', last_reply: '2026-02-24', messages_count: 3 },
  { id: 1002, subject: 'How to change shop banner image?', status: 'resolved', priority: 'low', created: '2026-02-18', last_reply: '2026-02-19', messages_count: 2 },
  { id: 1003, subject: 'Product images not uploading', status: 'open', priority: 'medium', created: '2026-02-24', last_reply: '2026-02-24', messages_count: 1 },
])

// New ticket form
const newTicket = ref({
  subject: '',
  category: 'general',
  priority: 'medium',
  message: '',
})

function getTicketStatusColor(status: string): string {
  const map: Record<string, string> = {
    open: 'bg-info-50 text-info-700 dark:bg-info-900/30 dark:text-info-400',
    in_progress: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    resolved: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  }
  return map[status] ?? map.open
}

function getTicketStatusIcon(status: string) {
  if (status === 'resolved' || status === 'closed') return CheckCircleIcon
  if (status === 'in_progress') return ClockIcon
  return ExclamationCircleIcon
}

async function handleSubmitTicket() {
  if (!newTicket.value.subject || !newTicket.value.message) return
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))
  tickets.value.unshift({
    id: Date.now(),
    subject: newTicket.value.subject,
    status: 'open',
    priority: newTicket.value.priority as 'low' | 'medium' | 'high',
    created: new Date().toISOString().slice(0, 10),
    last_reply: new Date().toISOString().slice(0, 10),
    messages_count: 1,
  })
  newTicket.value = { subject: '', category: 'general', priority: 'medium', message: '' }
  showNewTicket.value = false
}

onMounted(() => {
  breadcrumbStore.setPageInfo('Help Center', [
    { label: 'Support' },
    { label: 'Help Center' },
  ], 'Find answers, submit tickets, and contact support')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Help Center</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Find answers, get help, and contact our support team</p>
    </div>

    <!-- Search bar -->
    <BaseCard class="bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-900/10">
      <div class="mx-auto max-w-xl text-center">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">How can we help you?</h3>
        <div class="relative mt-3">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <FormInput
            v-model="searchQuery"
            placeholder="Search help articles..."
            class="pl-10"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Section tabs -->
    <div class="flex gap-2 border-b border-gray-200 dark:border-gray-700">
      <button
        v-for="section in [
          { key: 'articles', label: 'Help Articles', icon: BookOpenIcon },
          { key: 'tickets', label: 'My Tickets', icon: ChatBubbleLeftRightIcon },
          { key: 'contact', label: 'Contact Us', icon: EnvelopeIcon },
        ] as const"
        :key="section.key"
        :class="[
          activeSection === section.key
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
          'flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-medium transition-colors',
        ]"
        @click="activeSection = section.key"
      >
        <component :is="section.icon" class="h-4 w-4" />
        {{ section.label }}
      </button>
    </div>

    <!-- Help Articles -->
    <template v-if="activeSection === 'articles'">
      <!-- Categories quick links -->
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BaseCard
          v-for="cat in articleCategories"
          :key="cat"
          class="cursor-pointer transition-colors hover:border-primary-300 dark:hover:border-primary-700"
        >
          <div class="flex items-center gap-2">
            <QuestionMarkCircleIcon class="h-5 w-5 text-primary-500" />
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{ cat }}</span>
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ articles.filter((a) => a.category === cat).length }} articles
          </p>
        </BaseCard>
      </div>

      <!-- Article list -->
      <BaseCard v-if="filteredArticles.length">
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="article in filteredArticles"
            :key="article.id"
            class="flex cursor-pointer items-center gap-3 px-2 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <BookOpenIcon class="h-5 w-5 shrink-0 text-gray-400" />
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ article.title }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ article.excerpt }}</p>
            </div>
            <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              {{ article.category }}
            </span>
            <ChevronRightIcon class="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </BaseCard>
      <EmptyState
        v-else
        title="No articles found"
        description="Try different search keywords"
      />
    </template>

    <!-- Support Tickets -->
    <template v-if="activeSection === 'tickets'">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ tickets.length }} ticket(s)</p>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          @click="showNewTicket = !showNewTicket"
        >
          <PlusIcon class="h-4 w-4" />
          New Ticket
        </button>
      </div>

      <!-- New ticket form -->
      <BaseCard v-if="showNewTicket">
        <h4 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Submit a New Ticket</h4>
        <form class="space-y-3" @submit.prevent="handleSubmitTicket">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
            <FormInput v-model="newTicket.subject" placeholder="Brief description of your issue" required />
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <FormSelect
                v-model="newTicket.category"
                :options="[
                  { label: 'General', value: 'general' },
                  { label: 'Products', value: 'products' },
                  { label: 'Orders', value: 'orders' },
                  { label: 'Payments', value: 'payments' },
                  { label: 'Technical', value: 'technical' },
                ]"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
              <FormSelect
                v-model="newTicket.priority"
                :options="[
                  { label: 'Low', value: 'low' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'High', value: 'high' },
                ]"
              />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
            <FormTextarea v-model="newTicket.message" placeholder="Describe your issue in detail..." :rows="4" required />
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" class="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400" @click="showNewTicket = false">Cancel</button>
            <button type="submit" class="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">Submit Ticket</button>
          </div>
        </form>
      </BaseCard>

      <!-- Ticket list -->
      <div class="space-y-3">
        <BaseCard
          v-for="ticket in tickets"
          :key="ticket.id"
          class="cursor-pointer transition-colors hover:border-gray-300 dark:hover:border-gray-600"
        >
          <div class="flex items-start gap-3">
            <component :is="getTicketStatusIcon(ticket.status)" :class="ticket.status === 'resolved' ? 'text-success-500' : ticket.status === 'in_progress' ? 'text-warning-500' : 'text-info-500'" class="mt-0.5 h-5 w-5 shrink-0" />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">{{ ticket.subject }}</h4>
                <span :class="getTicketStatusColor(ticket.status)" class="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase">
                  {{ ticket.status.replace('_', ' ') }}
                </span>
              </div>
              <div class="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>#{{ ticket.id }}</span>
                <span>Created {{ ticket.created }}</span>
                <span>{{ ticket.messages_count }} message(s)</span>
              </div>
            </div>
            <ChevronRightIcon class="h-4 w-4 text-gray-400" />
          </div>
        </BaseCard>
      </div>
    </template>

    <!-- Contact Us -->
    <template v-if="activeSection === 'contact'">
      <div class="grid gap-4 sm:grid-cols-3">
        <BaseCard class="text-center">
          <EnvelopeIcon class="mx-auto h-8 w-8 text-primary-500" />
          <h4 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Email Support</h4>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Get a reply within 24 hours</p>
          <a href="mailto:vendor-support@mve.com" class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400">
            vendor-support@mve.com
            <ArrowTopRightOnSquareIcon class="h-3 w-3" />
          </a>
        </BaseCard>

        <BaseCard class="text-center">
          <ChatBubbleLeftRightIcon class="mx-auto h-8 w-8 text-success-500" />
          <h4 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Live Chat</h4>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Available Mon-Fri, 9 AM - 6 PM</p>
          <button class="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400">
            Start Chat
          </button>
        </BaseCard>

        <BaseCard class="text-center">
          <PhoneIcon class="mx-auto h-8 w-8 text-warning-500" />
          <h4 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Phone Support</h4>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">For urgent issues</p>
          <a href="tel:+8801234567890" class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400">
            +880 1234 567 890
          </a>
        </BaseCard>
      </div>

      <BaseCard>
        <h3 class="mb-3 text-base font-semibold text-gray-900 dark:text-white">Frequently Asked Questions</h3>
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <details v-for="faq in [
            { q: 'How long does it take to get approved as a vendor?', a: 'Vendor applications are typically reviewed within 2-3 business days. You will receive an email notification once your application is processed.' },
            { q: 'When do I receive my payments?', a: 'Payouts are processed every Monday for earnings that have cleared the 14-day holding period. You can request manual payouts from the Payouts page.' },
            { q: 'How are commissions calculated?', a: 'The default commission rate is 10% of the product selling price. Some categories may have different rates. Commission is deducted before your earnings are credited.' },
            { q: 'Can I change my shop URL/slug?', a: 'Shop URLs can be changed once from Shop Settings. Contact support if you need additional changes.' },
          ]" :key="faq.q" class="group py-3">
            <summary class="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-900 dark:text-white">
              {{ faq.q }}
              <ChevronRightIcon class="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" />
            </summary>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ faq.a }}</p>
          </details>
        </div>
      </BaseCard>
    </template>
  </div>
</template>
