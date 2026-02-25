<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Product Status Flow — Visual status pipeline for products -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import { CheckIcon } from '@heroicons/vue/24/solid'

interface StatusStep {
  key: string
  label: string
  description?: string
}

interface Props {
  steps: StatusStep[]
  currentStep: string
  direction?: 'horizontal' | 'vertical'
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'horizontal',
})

// Find current step index
const currentIndex = computed(() =>
  props.steps.findIndex(s => s.key === props.currentStep)
)

function stepStatus(index: number): 'completed' | 'current' | 'upcoming' {
  if (index < currentIndex.value) return 'completed'
  if (index === currentIndex.value) return 'current'
  return 'upcoming'
}

function dotClasses(status: string) {
  return {
    completed:
      'bg-primary-600 text-white dark:bg-primary-500',
    current:
      'border-2 border-primary-600 bg-white text-primary-600 dark:border-primary-400 dark:bg-gray-800 dark:text-primary-400',
    upcoming:
      'border-2 border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800',
  }[status]
}

function lineClasses(index: number) {
  return index < currentIndex.value
    ? 'bg-primary-600 dark:bg-primary-500'
    : 'bg-gray-200 dark:bg-gray-700'
}
</script>

<template>
  <!-- Horizontal layout -->
  <div
    v-if="direction === 'horizontal'"
    class="flex items-start"
  >
    <template v-for="(step, index) in steps" :key="step.key">
      <!-- Step -->
      <div class="flex flex-col items-center" :class="index !== 0 ? 'flex-1' : ''">
        <div class="flex w-full items-center">
          <!-- Line before -->
          <div
            v-if="index !== 0"
            :class="['h-0.5 flex-1 transition-colors', lineClasses(index)]"
          />

          <!-- Dot -->
          <div
            :class="[
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all',
              dotClasses(stepStatus(index)),
            ]"
          >
            <CheckIcon v-if="stepStatus(index) === 'completed'" class="h-4 w-4" />
            <span v-else>{{ index + 1 }}</span>
          </div>

          <!-- Line after -->
          <div
            v-if="index !== steps.length - 1"
            :class="['h-0.5 flex-1 transition-colors', lineClasses(index + 1)]"
          />
        </div>

        <!-- Label -->
        <div class="mt-2 text-center">
          <p
            :class="[
              'text-xs font-medium',
              stepStatus(index) === 'upcoming'
                ? 'text-gray-400 dark:text-gray-500'
                : 'text-gray-900 dark:text-white',
            ]"
          >
            {{ step.label }}
          </p>
          <p
            v-if="step.description"
            class="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400"
          >
            {{ step.description }}
          </p>
        </div>
      </div>
    </template>
  </div>

  <!-- Vertical layout -->
  <div v-else class="space-y-0">
    <div
      v-for="(step, index) in steps"
      :key="step.key"
      class="relative flex gap-3"
      :class="index !== steps.length - 1 ? 'pb-6' : ''"
    >
      <!-- Vertical line -->
      <div
        v-if="index !== steps.length - 1"
        :class="[
          'absolute left-4 top-8 h-full w-0.5 -translate-x-1/2',
          lineClasses(index + 1),
        ]"
      />

      <!-- Dot -->
      <div
        :class="[
          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium',
          dotClasses(stepStatus(index)),
        ]"
      >
        <CheckIcon v-if="stepStatus(index) === 'completed'" class="h-4 w-4" />
        <span v-else>{{ index + 1 }}</span>
      </div>

      <!-- Content -->
      <div class="pt-1">
        <p
          :class="[
            'text-sm font-medium',
            stepStatus(index) === 'upcoming'
              ? 'text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-white',
          ]"
        >
          {{ step.label }}
        </p>
        <p v-if="step.description" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {{ step.description }}
        </p>
      </div>
    </div>
  </div>
</template>
