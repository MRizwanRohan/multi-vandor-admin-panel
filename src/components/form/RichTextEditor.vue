<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Rich Text Editor — WYSIWYG editor (Note: Requires @tiptap packages) -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useField } from 'vee-validate'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  CodeBracketIcon,
  LinkIcon,
} from '@heroicons/vue/24/outline'

interface Props {
  name: string
  label?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  minHeight?: string
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  placeholder: 'Start typing...',
  minHeight: '200px',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// Use vee-validate field
const { value, errorMessage, meta } = useField<string>(
  () => props.name,
  undefined,
  {
    syncVModel: true,
  }
)

// Simple contenteditable approach (Tiptap would be installed separately)
const editorRef = ref<HTMLDivElement>()
const isFocused = ref(false)

// Initialize content
watch(() => props.modelValue, (newValue) => {
  if (editorRef.value && newValue !== editorRef.value.innerHTML) {
    editorRef.value.innerHTML = newValue || ''
  }
}, { immediate: true })

function handleInput() {
  if (editorRef.value) {
    value.value = editorRef.value.innerHTML
    emit('update:modelValue', value.value)
  }
}

function execCommand(command: string, value?: string) {
  document.execCommand(command, false, value)
  editorRef.value?.focus()
  handleInput()
}

function insertLink() {
  const url = prompt('Enter URL:')
  if (url) {
    execCommand('createLink', url)
  }
}

// Toolbar buttons configuration
const toolbarButtons = [
  { command: 'bold', icon: 'bold', title: 'Bold (Ctrl+B)' },
  { command: 'italic', icon: 'italic', title: 'Italic (Ctrl+I)' },
  { command: 'underline', icon: 'underline', title: 'Underline (Ctrl+U)' },
  { command: 'insertUnorderedList', icon: 'list', title: 'Bullet List' },
  { command: 'insertOrderedList', icon: 'numbered', title: 'Numbered List' },
  { command: 'formatBlock', value: 'pre', icon: 'code', title: 'Code Block' },
  { command: 'createLink', icon: 'link', title: 'Insert Link' },
]
</script>

<template>
  <div class="space-y-1">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <!-- Editor Container -->
    <div
      :class="[
        'border rounded-lg overflow-hidden bg-white dark:bg-gray-800',
        isFocused ? 'ring-2 ring-primary-500 border-primary-500' : 'border-gray-300 dark:border-gray-600',
        errorMessage && meta.touched ? 'border-danger-500 ring-danger-500' : ''
      ]"
    >
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-1 px-2 py-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <button
          v-for="btn in toolbarButtons"
          :key="btn.command"
          type="button"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          :title="btn.title"
          :disabled="disabled"
          @click="btn.command === 'createLink' ? insertLink() : execCommand(btn.command, btn.value)"
        >
          <component
            :is="{
              bold: BoldIcon,
              italic: ItalicIcon,
              underline: UnderlineIcon,
              list: ListBulletIcon,
              numbered: NumberedListIcon,
              code: CodeBracketIcon,
              link: LinkIcon,
            }[btn.icon]"
            class="h-5 w-5"
          />
        </button>

        <div class="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <!-- Headings -->
        <select
          class="text-sm border-0 bg-transparent focus:ring-0 py-0.5"
          :disabled="disabled"
          @change="(e) => execCommand('formatBlock', (e.target as HTMLSelectElement).value)"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
      </div>

      <!-- Editor Content -->
      <div
        ref="editorRef"
        contenteditable
        :class="[
          'prose prose-sm max-w-none p-4 focus:outline-none',
          'dark:prose-invert',
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        :style="{ minHeight: minHeight }"
        :data-placeholder="placeholder"
        @input="handleInput"
        @focus="isFocused = true"
        @blur="isFocused = false"
      ></div>
    </div>

    <!-- Hint -->
    <p v-if="hint && !errorMessage" class="text-sm text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>

    <!-- Note about Tiptap -->
    <p class="text-xs text-amber-600 dark:text-amber-400">
      Note: This is a basic contenteditable implementation. For full WYSIWYG features, install @tiptap/vue-3 and extensions.
    </p>

    <!-- Error -->
    <div v-if="errorMessage && meta.touched" class="flex items-center gap-1 text-sm text-danger-600 dark:text-danger-400">
      <ExclamationCircleIcon class="h-4 w-4 flex-shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
[contenteditable]:empty:before {
  content: attr(data-placeholder);
  color: #9ca3af;
  pointer-events: none;
}

[contenteditable]:focus:before {
  content: '';
}
</style>
