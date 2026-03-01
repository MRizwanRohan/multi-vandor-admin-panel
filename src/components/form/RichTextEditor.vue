<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Rich Text Editor — TipTap-powered WYSIWYG editor                    -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { watch, onBeforeUnmount, computed } from 'vue'
import { useField } from 'vee-validate'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

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
  placeholder: 'বিস্তারিত বর্ণনা লিখুন...',
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

// Initialize TipTap editor
const editor = useEditor({
  content: props.modelValue || value.value || '',
  editable: !props.disabled,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [2, 3, 4],
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary-600 underline hover:text-primary-700',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3',
      style: `min-height: ${props.minHeight}`,
    },
  },
  onUpdate: ({ editor: ed }) => {
    const html = ed.getHTML()
    value.value = html
    emit('update:modelValue', html)
  },
})

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && newValue !== editor.value.getHTML()) {
      editor.value.commands.setContent(newValue || '', false)
    }
  }
)

// Watch for disabled changes
watch(
  () => props.disabled,
  (disabled) => {
    editor.value?.setEditable(!disabled)
  }
)

// Cleanup
onBeforeUnmount(() => {
  editor.value?.destroy()
})

// Toolbar actions
const setLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href
  const url = window.prompt('URL লিখুন:', previousUrl)

  if (url === null) return
  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

// Character count
const characterCount = computed(() => editor.value?.storage.characterCount?.characters() || 0)
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
        'border rounded-lg overflow-hidden bg-white dark:bg-gray-800 transition-colors',
        errorMessage && meta.touched 
          ? 'border-danger-500 ring-1 ring-danger-500' 
          : 'border-gray-300 dark:border-gray-600 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500',
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      ]"
    >
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <!-- Bold -->
        <button
          type="button"
          title="Bold (Ctrl+B)"
          :disabled="disabled"
          :class="[
            'flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm transition-colors',
            editor?.isActive('bold')
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
          ]"
          @click="editor?.chain().focus().toggleBold().run()"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z" />
          </svg>
        </button>

        <!-- Italic -->
        <button
          type="button"
          title="Italic (Ctrl+I)"
          :disabled="disabled"
          :class="[
            'flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm transition-colors',
            editor?.isActive('italic')
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
          ]"
          @click="editor?.chain().focus().toggleItalic().run()"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 4h4m-2 0l-2 16m-2 0h4" />
          </svg>
        </button>

        <!-- Strike -->
        <button
          type="button"
          title="Strikethrough"
          :disabled="disabled"
          :class="[
            'flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm transition-colors',
            editor?.isActive('strike')
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
          ]"
          @click="editor?.chain().focus().toggleStrike().run()"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12h12M9 6h6a3 3 0 110 6M9 18h6a3 3 0 100-6" />
          </svg>
        </button>

        <div class="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600" />

        <!-- Heading 2 -->
        <button
          type="button"
          title="Heading 2"
          :disabled="disabled"
          :class="[
            'flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm font-bold transition-colors',
            editor?.isActive('heading', { level: 2 })
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
          ]"
          @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
        >
          H2
        </button>

        <!-- Heading 3 -->
        <button
          type="button"
          title="Heading 3"
          :disabled="disabled"
          :class="[
            'flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm font-bold transition-colors',
            editor?.isActive('heading', { level: 3 })
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
          ]"
          @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
        >
          H3
        </button>

        <div class="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600" />

        <!-- Bullet List -->
        <button
          type="button"
          title="Bullet List"
          :disabled="disabled"
          :class="[
            'flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm transition-colors',
            editor?.isActive('bulletList')
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
          ]"
          @click="editor?.chain().focus().toggleBulletList().run()"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h.01M4 12h.01M4 18h.01M8 6h12M8 12h12M8 18h12" />
          </svg>
        </button>

        <!-- Numbered List -->
        <button
          type="button"
          title="Numbered List"
          :disabled="disabled"
          :class="[
            'flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm transition-colors',
            editor?.isActive('orderedList')
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
          ]"
          @click="editor?.chain().focus().toggleOrderedList().run()"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h.01M4 12h.01M4 18h.01M8 6h12M8 12h12M8 18h12" />
            <text x="2" y="8" font-size="5" fill="currentColor" stroke="none">1</text>
          </svg>
        </button>

        <div class="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600" />

        <!-- Blockquote -->
        <button
          type="button"
          title="Blockquote"
          :disabled="disabled"
          :class="[
            'flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm transition-colors',
            editor?.isActive('blockquote')
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
          ]"
          @click="editor?.chain().focus().toggleBlockquote().run()"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </button>

        <!-- Link -->
        <button
          type="button"
          title="Insert Link"
          :disabled="disabled"
          :class="[
            'flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm transition-colors',
            editor?.isActive('link')
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
          ]"
          @click="setLink"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        <!-- Horizontal Rule -->
        <button
          type="button"
          title="Horizontal Rule"
          :disabled="disabled"
          class="flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
          @click="editor?.chain().focus().setHorizontalRule().run()"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
          </svg>
        </button>

        <div class="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600" />

        <!-- Undo -->
        <button
          type="button"
          title="Undo (Ctrl+Z)"
          :disabled="disabled"
          class="flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
          @click="editor?.chain().focus().undo().run()"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        </button>

        <!-- Redo -->
        <button
          type="button"
          title="Redo (Ctrl+Shift+Z)"
          :disabled="disabled"
          class="flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
          @click="editor?.chain().focus().redo().run()"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
          </svg>
        </button>
      </div>

      <!-- Editor Content -->
      <EditorContent :editor="editor" class="max-h-96 overflow-y-auto" />
    </div>

    <!-- Hint -->
    <p v-if="hint && !errorMessage" class="text-sm text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>

    <!-- Error -->
    <div v-if="errorMessage && meta.touched" class="flex items-center gap-1 text-sm text-danger-600 dark:text-danger-400">
      <ExclamationCircleIcon class="h-4 w-4 shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<style>
/* Placeholder styling */
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}

.dark .tiptap p.is-editor-empty:first-child::before {
  color: #6b7280;
}

/* Basic prose styling */
.tiptap {
  outline: none;
}

.tiptap h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.tiptap h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
}

.tiptap h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
}

.tiptap p {
  margin-bottom: 0.5rem;
}

.tiptap ul,
.tiptap ol {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}

.tiptap ul {
  list-style-type: disc;
}

.tiptap ol {
  list-style-type: decimal;
}

.tiptap blockquote {
  border-left: 3px solid #d1d5db;
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: #6b7280;
}

.dark .tiptap blockquote {
  border-color: #4b5563;
  color: #9ca3af;
}

.tiptap hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1rem 0;
}

.dark .tiptap hr {
  border-color: #374151;
}

.tiptap a {
  color: #2563eb;
  text-decoration: underline;
}

.tiptap a:hover {
  color: #1d4ed8;
}

.dark .tiptap a {
  color: #60a5fa;
}

.dark .tiptap a:hover {
  color: #93c5fd;
}
</style>
