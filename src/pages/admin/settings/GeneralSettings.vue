<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- General Settings — Site-wide general settings (Dynamic from API) -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { settingsService } from '@/services'
import { useToast } from '@/composables'
import type { Setting } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import DynamicSettingsForm from '@/components/domain/DynamicSettingsForm.vue'

const toast = useToast()
const GROUP = 'general'

// State
const settings = ref<Setting[]>([])
const formValues = ref<Record<string, unknown>>({})
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref('')

// Initialize form values from settings
function initFormValues(settingsList: Setting[]) {
  const values: Record<string, unknown> = {}
  for (const s of settingsList) {
    values[s.key] = s.value ?? s.default_value
  }
  formValues.value = values
}

// Fetch settings for this group
async function fetchSettings() {
  isLoading.value = true
  error.value = ''
  try {
    const data = await settingsService.getByGroup(GROUP)
    settings.value = data
    initFormValues(data)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load settings'
    toast.error(error.value)
  } finally {
    isLoading.value = false
  }
}

// Save settings
async function saveSettings() {
  isSaving.value = true
  try {
    await settingsService.bulkUpdateGroup(GROUP, formValues.value)
    toast.success('General settings saved successfully')
  } catch (err: any) {
    const message = err.response?.data?.message || 'Failed to save settings'
    toast.error(message)
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <!-- Loading state -->
  <div v-if="isLoading" class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>

  <!-- Error state -->
  <BaseCard v-else-if="error" class="text-center py-8">
    <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
    <BaseButton variant="secondary" size="sm" @click="fetchSettings">
      Retry
    </BaseButton>
  </BaseCard>

  <!-- Settings form -->
  <BaseCard v-else class="space-y-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
      General Settings
    </h3>

    <DynamicSettingsForm
      v-model="formValues"
      :settings="settings"
      :disabled="isSaving"
    />

    <!-- Save button -->
    <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
      <BaseButton variant="primary" :loading="isSaving" @click="saveSettings">
        Save Changes
      </BaseButton>
    </div>
  </BaseCard>
</template>
