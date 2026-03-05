<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Contact Message Detail — View and respond to a message -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreadcrumbStore } from '@/stores'
import { useToast, useDate, useConfirm } from '@/composables'
import { contactService } from '@/services'
import type { ContactMessage } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()
const { formatDateTime, formatRelative } = useDate()
const confirm = useConfirm()

const messageId = computed(() => route.params.id as string)

// State
const isLoading = ref(false)
const isSaving = ref(false)
const message = ref<ContactMessage | null>(null)
const newNote = ref('')
const newStatus = ref('')

// Status options
const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'spam', label: 'Spam' },
]

// Status badge variants
const statusVariants: Record<string, 'warning' | 'info' | 'success' | 'primary' | 'danger'> = {
  new: 'warning',
  read: 'info',
  replied: 'primary',
  resolved: 'success',
  spam: 'danger',
}

onMounted(async () => {
  breadcrumbStore.setPageInfo('Message Details', [
    { label: 'CMS' },
    { label: 'Contact', to: '/admin/cms/contact' },
    { label: 'Details' },
  ], 'View contact message')

  await fetchMessage()
})

// Fetch message
async function fetchMessage() {
  isLoading.value = true
  try {
    const response = await contactService.getById(messageId.value)
    message.value = response.data
    newStatus.value = response.data.status

    // Mark as read if new
    if (response.data.status === 'new') {
      await contactService.markAsRead(messageId.value)
      message.value.status = 'read'
      newStatus.value = 'read'
    }
  } catch (error) {
    toast.error('Failed to load message')
    router.push('/admin/cms/contact')
  } finally {
    isLoading.value = false
  }
}

// Update status
async function updateStatus() {
  if (!message.value || newStatus.value === message.value.status) return

  isSaving.value = true
  try {
    await contactService.updateStatus(messageId.value, newStatus.value)
    message.value.status = newStatus.value
    toast.success('Status updated')
  } catch (error) {
    toast.error('Failed to update status')
    newStatus.value = message.value.status
  } finally {
    isSaving.value = false
  }
}

// Add note
async function addNote() {
  if (!newNote.value.trim()) return

  isSaving.value = true
  try {
    await contactService.addNotes(messageId.value, newNote.value)
    
    // Update local notes
    if (message.value) {
      const existingNotes = message.value.notes || ''
      const timestamp = new Date().toLocaleString()
      message.value.notes = existingNotes 
        ? `${existingNotes}\n\n[${timestamp}]\n${newNote.value}`
        : `[${timestamp}]\n${newNote.value}`
    }
    
    newNote.value = ''
    toast.success('Note added')
  } catch (error) {
    toast.error('Failed to add note')
  } finally {
    isSaving.value = false
  }
}

// Reply via email (opens default email client)
function replyViaEmail() {
  if (!message.value) return
  
  const subject = encodeURIComponent(`Re: ${message.value.subject || 'Your inquiry'}`)
  const body = encodeURIComponent(`\n\n---\nOriginal message from ${message.value.name}:\n${message.value.message}`)
  window.location.href = `mailto:${message.value.email}?subject=${subject}&body=${body}`
}

// Delete message
async function deleteMessage() {
  const confirmed = await confirm.require({
    title: 'Delete Message',
    message: `Are you sure you want to delete this message? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  })
  
  if (confirmed) {
    try {
      await contactService.delete(messageId.value)
      toast.success('Message deleted')
      router.push('/admin/cms/contact')
    } catch (error) {
      toast.error('Failed to delete message')
    }
  }
}

// Go back
function goBack() {
  router.push('/admin/cms/contact')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="goBack"
        >
          <ArrowLeftIcon class="h-5 w-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Message Details
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and respond to customer inquiry
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <BaseButton variant="danger" @click="deleteMessage">
          <TrashIcon class="mr-2 h-5 w-5" />
          Delete
        </BaseButton>
        <BaseButton @click="replyViaEmail">
          <PaperAirplaneIcon class="mr-2 h-5 w-5" />
          Reply
        </BaseButton>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
    </div>

    <template v-else-if="message">
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Message Content -->
          <BaseCard>
            <div class="mb-4 flex items-start justify-between">
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ message.subject || '(No subject)' }}
                </h2>
                <p class="text-sm text-gray-500">
                  Received {{ formatRelative(message.created_at) }}
                </p>
              </div>
              <BaseBadge :variant="statusVariants[message.status] || 'secondary'">
                {{ message.status }}
              </BaseBadge>
            </div>

            <div class="prose max-w-none dark:prose-invert">
              <p class="whitespace-pre-wrap">{{ message.message }}</p>
            </div>
          </BaseCard>

          <!-- Notes Section -->
          <BaseCard>
            <h3 class="mb-4 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
              <DocumentTextIcon class="h-5 w-5" />
              Internal Notes
            </h3>

            <!-- Existing Notes -->
            <div v-if="message.notes" class="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <pre class="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">{{ message.notes }}</pre>
            </div>
            <p v-else class="mb-4 text-sm text-gray-500">No notes yet.</p>

            <!-- Add Note Form -->
            <div class="space-y-3">
              <FormTextarea
                v-model="newNote"
                name="note"
                placeholder="Add a note about this message..."
                :rows="3"
              />
              <BaseButton 
                size="sm" 
                :loading="isSaving"
                :disabled="!newNote.trim()"
                @click="addNote"
              >
                Add Note
              </BaseButton>
            </div>
          </BaseCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Sender Info -->
          <BaseCard>
            <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Sender Information</h3>
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                  <span class="text-lg font-medium text-primary-600 dark:text-primary-400">
                    {{ message.name?.charAt(0)?.toUpperCase() || '?' }}
                  </span>
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ message.name }}</p>
                  <p class="text-sm text-gray-500">Customer</p>
                </div>
              </div>

              <div class="space-y-3 pt-4 border-t dark:border-gray-700">
                <div class="flex items-center gap-3 text-sm">
                  <EnvelopeIcon class="h-5 w-5 text-gray-400" />
                  <a 
                    :href="`mailto:${message.email}`" 
                    class="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    {{ message.email }}
                  </a>
                </div>
                
                <div v-if="message.phone" class="flex items-center gap-3 text-sm">
                  <PhoneIcon class="h-5 w-5 text-gray-400" />
                  <a 
                    :href="`tel:${message.phone}`" 
                    class="text-gray-700 hover:underline dark:text-gray-300"
                  >
                    {{ message.phone }}
                  </a>
                </div>

                <div class="flex items-center gap-3 text-sm">
                  <CalendarIcon class="h-5 w-5 text-gray-400" />
                  <span class="text-gray-600 dark:text-gray-400">
                    {{ formatDateTime(message.created_at) }}
                  </span>
                </div>
              </div>
            </div>
          </BaseCard>

          <!-- Status Update -->
          <BaseCard>
            <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Update Status</h3>
            <div class="space-y-4">
              <FormSelect
                v-model="newStatus"
                name="status"
                :options="statusOptions"
              />
              <BaseButton 
                size="sm" 
                class="w-full"
                :loading="isSaving"
                :disabled="newStatus === message.status"
                @click="updateStatus"
              >
                <CheckCircleIcon class="mr-2 h-4 w-4" />
                Update Status
              </BaseButton>
            </div>
          </BaseCard>

          <!-- Quick Actions -->
          <BaseCard>
            <h3 class="mb-4 font-medium text-gray-900 dark:text-white">Quick Actions</h3>
            <div class="space-y-2">
              <BaseButton 
                variant="outline" 
                size="sm" 
                class="w-full justify-start"
                @click="replyViaEmail"
              >
                <PaperAirplaneIcon class="mr-2 h-4 w-4" />
                Reply via Email
              </BaseButton>
              <BaseButton 
                variant="outline" 
                size="sm" 
                class="w-full justify-start text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                @click="deleteMessage"
              >
                <TrashIcon class="mr-2 h-4 w-4" />
                Delete Message
              </BaseButton>
            </div>
          </BaseCard>
        </div>
      </div>
    </template>
  </div>
</template>
