<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Category Template Manager — Manage attribute templates for a category -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { categoryService } from '@/services'
import { attributeTemplateService } from '@/services'
import { useToast } from '@/composables'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import type { CategoryTemplateAssignment } from '@/types'
import type { AttributeTemplate } from '@/types'
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline'

interface Props {
  modelValue: boolean
  categoryId: number | string
  categoryName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const toast = useToast()

// State
const isLoading = ref(false)
const isSaving = ref(false)
const currentTemplates = ref<CategoryTemplateAssignment[]>([])
const availableTemplates = ref<AttributeTemplate[]>([])
const selectedTemplateId = ref<number | null>(null)

// Edited template assignments
const editedTemplates = ref<{
  attribute_template_id: number
  is_required_override: boolean
  display_order: number
  inheritance_mode: 'inherit' | 'replace'
  // Display fields (from enriched API or available templates)
  name: string
  type: string
  source: string
  inherited_from: { id: number; name: string } | null
}[]>([])

// Load data when modal opens
watch(() => props.modelValue, async (open) => {
  if (open) {
    await loadData()
  }
})

async function loadData() {
  isLoading.value = true
  try {
    // Load current templates for this category
    const templates = await categoryService.getCategoryTemplates(props.categoryId, true)
    currentTemplates.value = templates

    // Load all available templates for the "Add" dropdown
    try {
      availableTemplates.value = await attributeTemplateService.getAllForSelect()
    } catch {
      // Fallback: no available templates to add
      availableTemplates.value = []
    }

    // Build editable list from current templates
    editedTemplates.value = templates.map(t => ({
      attribute_template_id: t.attribute_template_id ?? t.id ?? 0,
      is_required_override: t.is_required_override ?? t.is_required ?? false,
      display_order: t.display_order ?? 0,
      inheritance_mode: t.inheritance_mode ?? 'inherit',
      name: t.name ?? `Template #${t.attribute_template_id ?? t.id}`,
      type: t.type ?? 'text',
      source: t.source ?? 'direct',
      inherited_from: t.inherited_from ?? null,
    }))
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to load templates')
  } finally {
    isLoading.value = false
  }
}

// Templates available to add (not already assigned)
const addableTemplates = computed(() => {
  const assignedIds = new Set(editedTemplates.value.map(t => t.attribute_template_id))
  return availableTemplates.value.filter(t => !assignedIds.has(t.id) && t.is_active)
})

// Add a template
function addTemplate() {
  if (!selectedTemplateId.value) return
  const tmpl = availableTemplates.value.find(t => t.id === selectedTemplateId.value)
  if (!tmpl) return

  editedTemplates.value.push({
    attribute_template_id: tmpl.id,
    is_required_override: tmpl.is_required,
    display_order: editedTemplates.value.length,
    inheritance_mode: 'inherit',
    name: tmpl.name,
    type: tmpl.data_type,
    source: 'direct',
    inherited_from: null,
  })
  selectedTemplateId.value = null
}

// Remove a template
function removeTemplate(index: number) {
  editedTemplates.value.splice(index, 1)
  // Update display orders
  editedTemplates.value.forEach((t, i) => {
    t.display_order = i
  })
}

// Move template up/down
function moveTemplate(index: number, direction: 'up' | 'down') {
  const arr = editedTemplates.value
  if (direction === 'up' && index > 0) {
    ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
  } else if (direction === 'down' && index < arr.length - 1) {
    ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
  }
  // Update display orders
  arr.forEach((t, i) => {
    t.display_order = i
  })
}

// Save templates
async function saveTemplates() {
  isSaving.value = true
  try {
    const payload = editedTemplates.value
      .filter(t => t.source !== 'inherited') // Only sync direct templates
      .map(t => ({
        attribute_template_id: t.attribute_template_id,
        is_required_override: t.is_required_override,
        display_order: t.display_order,
        inheritance_mode: t.inheritance_mode,
      }))

    await categoryService.syncTemplates(props.categoryId, payload)
    toast.success('Attribute templates synced successfully')
    emit('saved')
    close()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to sync templates')
  } finally {
    isSaving.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}

// Data type badge color
function typeColor(type: string): 'info' | 'success' | 'warning' {
  const map: Record<string, 'info' | 'success' | 'warning'> = {
    text: 'info',
    number: 'success',
    select: 'warning',
    multiselect: 'warning',
    boolean: 'info',
    color: 'success',
  }
  return map[type] ?? 'info'
}
</script>

<template>
  <BaseModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" size="xl" :title="`Attribute Templates: ${categoryName}`">
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>

    <div v-else class="space-y-5">
      <!-- Info banner -->
      <div class="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-3">
        <InformationCircleIcon class="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div class="text-xs text-blue-700 dark:text-blue-300">
          <p><strong>"inherit"</strong> = child categories will also get this template.</p>
          <p><strong>"replace"</strong> = child categories can override this template.</p>
          <p class="mt-1 text-blue-500 dark:text-blue-400">Inherited templates from parent categories are shown but cannot be removed here.</p>
        </div>
      </div>

      <!-- Current templates list -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Assigned Templates ({{ editedTemplates.length }})
        </h4>

        <div v-if="editedTemplates.length === 0" class="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 py-8 text-center">
          <DocumentTextIcon class="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">No templates assigned</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">Use the form below to add attribute templates</p>
        </div>

        <div v-else class="divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
          <div
            v-for="(tmpl, index) in editedTemplates"
            :key="tmpl.attribute_template_id"
            class="p-3"
            :class="tmpl.source === 'inherited' ? 'bg-gray-50 dark:bg-gray-800/50' : ''"
          >
            <div class="flex items-start gap-3">
              <!-- Order & drag area -->
              <div class="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                <button
                  type="button"
                  :disabled="index === 0 || tmpl.source === 'inherited'"
                  class="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  @click="moveTemplate(index, 'up')"
                >
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
                </button>
                <span class="text-[10px] font-mono text-gray-400">{{ index + 1 }}</span>
                <button
                  type="button"
                  :disabled="index === editedTemplates.length - 1 || tmpl.source === 'inherited'"
                  class="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  @click="moveTemplate(index, 'down')"
                >
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>

              <!-- Template info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ tmpl.name }}</p>
                  <BaseBadge :variant="typeColor(tmpl.type)" size="sm" rounded>{{ tmpl.type }}</BaseBadge>
                  <BaseBadge v-if="tmpl.source === 'inherited'" variant="info" size="sm" rounded>
                    inherited{{ tmpl.inherited_from ? ` from ${tmpl.inherited_from.name}` : '' }}
                  </BaseBadge>
                </div>

                <!-- Editable fields (only for direct templates) -->
                <div v-if="tmpl.source !== 'inherited'" class="mt-2 flex flex-wrap items-center gap-3">
                  <!-- Required toggle -->
                  <label class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                    <input
                      v-model="tmpl.is_required_override"
                      type="checkbox"
                      class="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Required
                  </label>

                  <!-- Inheritance mode -->
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs text-gray-500 dark:text-gray-400">Mode:</span>
                    <select
                      v-model="tmpl.inheritance_mode"
                      class="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    >
                      <option value="inherit">inherit</option>
                      <option value="replace">replace</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Remove button (only for direct templates) -->
              <button
                v-if="tmpl.source !== 'inherited'"
                type="button"
                class="shrink-0 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                title="Remove template"
                @click="removeTemplate(index)"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add template -->
      <div v-if="addableTemplates.length > 0" class="flex items-end gap-3">
        <div class="flex-1">
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Add Template</label>
          <select
            v-model="selectedTemplateId"
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option :value="null" disabled>Select a template to add...</option>
            <option v-for="tmpl in addableTemplates" :key="tmpl.id" :value="tmpl.id">
              {{ tmpl.name }} ({{ tmpl.data_type }}){{ tmpl.is_required ? ' — required' : '' }}
            </option>
          </select>
        </div>
        <BaseButton
          variant="secondary"
          size="sm"
          :disabled="!selectedTemplateId"
          @click="addTemplate"
        >
          <PlusIcon class="mr-1.5 h-4 w-4" />
          Add
        </BaseButton>
      </div>
      <div v-else-if="availableTemplates.length === 0 && editedTemplates.length === 0" class="text-xs text-gray-400 dark:text-gray-500">
        No attribute templates available. Create templates first from the Attribute Templates section.
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <BaseButton variant="secondary" @click="close" :disabled="isSaving">
          Cancel
        </BaseButton>
        <BaseButton variant="primary" :loading="isSaving" @click="saveTemplates">
          <ArrowPathIcon class="mr-1.5 h-4 w-4" />
          Save Templates
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
