<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- AppTour — Interactive guided tour overlay panel                   -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { useTour } from '@/composables/useTour'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckCircleIcon,
  MapIcon,
} from '@heroicons/vue/24/outline'

const tour = useTour()

const colorBg: Record<string, string> = {
  blue:    'from-blue-600 to-blue-500',
  indigo:  'from-indigo-600 to-indigo-500',
  emerald: 'from-emerald-600 to-emerald-500',
  amber:   'from-amber-500 to-orange-500',
  cyan:    'from-cyan-600 to-cyan-500',
  green:   'from-green-600 to-green-500',
  rose:    'from-rose-600 to-rose-500',
  violet:  'from-violet-600 to-violet-500',
  slate:   'from-slate-600 to-slate-500',
}

const dotColor: Record<string, string> = {
  blue:    'bg-blue-500',
  indigo:  'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  cyan:    'bg-cyan-500',
  green:   'bg-green-500',
  rose:    'bg-rose-500',
  violet:  'bg-violet-500',
  slate:   'bg-slate-500',
}
</script>

<template>
  <!-- ── BACKDROP tint ── -->
  <Transition name="tour-fade">
    <div
      v-if="tour.isActive.value"
      class="pointer-events-none fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-[1px]"
    />
  </Transition>

  <!-- ── TOUR PANEL ── -->
  <Transition name="tour-slide">
    <div
      v-if="tour.isActive.value"
      class="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700"
    >
      <!-- Step header with gradient -->
      <div :class="['relative bg-gradient-to-r px-5 py-4 text-white', colorBg[tour.step.value?.color ?? 'blue']]">
        <!-- progress bar -->
        <div class="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-500"
          :style="{ width: tour.progress.value + '%' }" />

        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-2xl">
              {{ tour.step.value?.icon }}
            </span>
            <div>
              <p class="text-xs font-medium text-white/70">
                ধাপ {{ (tour.currentStep.value ?? 0) + 1 }} / {{ tour.totalSteps }}
              </p>
              <h3 class="text-base font-bold leading-tight">{{ tour.step.value?.titleBn }}</h3>
            </div>
          </div>
          <button
            type="button"
            class="rounded-lg p-1.5 transition-colors hover:bg-white/20"
            @click="tour.dismissTour()"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- ── SCREEN MOCKUP ── -->
      <div class="border-b border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
        <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-inner dark:border-gray-600 dark:bg-gray-900" style="height:160px">

          <!-- Mockup: Dashboard -->
          <div v-if="tour.step.value?.mockupType === 'dashboard'" class="p-3">
            <!-- mini stat cards row -->
            <div class="mb-2 grid grid-cols-4 gap-1.5">
              <div v-for="(c,i) in ['bg-blue-50','bg-green-50','bg-amber-50','bg-purple-50']" :key="i"
                :class="['rounded-lg p-2', c]">
                <div class="mb-1 h-1.5 w-8 rounded-full bg-gray-200" />
                <div class="h-3 w-12 rounded bg-gray-300" />
              </div>
            </div>
            <!-- mini chart area -->
            <div class="flex gap-1.5">
              <div class="flex-1 rounded-lg border border-gray-100 p-2">
                <div class="mb-1 h-1.5 w-16 rounded-full bg-gray-200" />
                <div class="flex items-end gap-0.5 pt-1" style="height:52px">
                  <div v-for="(h,i) in [30,55,40,65,50,80,60,75,45,88,70,95]" :key="i"
                    class="flex-1 rounded-t bg-blue-300 transition-all"
                    :style="{ height: h+'%' }" />
                </div>
              </div>
              <div class="w-20 rounded-lg border border-gray-100 p-2">
                <div class="mb-1 h-1.5 w-10 rounded-full bg-gray-200" />
                <div class="mx-auto mt-2 h-10 w-10 rounded-full border-4 border-purple-200 border-t-purple-500" style="transform:rotate(45deg)" />
              </div>
            </div>
          </div>

          <!-- Mockup: List -->
          <div v-else-if="tour.step.value?.mockupType === 'list'" class="p-3">
            <!-- toolbar -->
            <div class="mb-2 flex items-center gap-1.5">
              <div class="flex-1 rounded border border-gray-200 px-2 py-1">
                <div class="h-1.5 w-20 rounded-full bg-gray-200" />
              </div>
              <div class="rounded bg-blue-500 px-2 py-1">
                <div class="h-1.5 w-10 rounded-full bg-white/60" />
              </div>
            </div>
            <!-- table rows -->
            <div class="overflow-hidden rounded border border-gray-100">
              <div class="grid grid-cols-4 gap-2 border-b border-gray-100 bg-gray-50 px-2 py-1">
                <div v-for="i in 4" :key="i" class="h-1.5 rounded-full bg-gray-300" />
              </div>
              <div v-for="row in 4" :key="row"
                class="grid grid-cols-4 items-center gap-2 border-b border-gray-50 px-2 py-1.5 last:border-0 hover:bg-gray-50">
                <div class="flex items-center gap-1">
                  <div class="h-4 w-4 rounded bg-gray-200" />
                  <div class="h-1.5 w-10 rounded-full bg-gray-200" />
                </div>
                <div class="h-1.5 w-14 rounded-full bg-gray-200" />
                <div class="h-1.5 w-8 rounded-full" :class="row === 1 ? 'bg-green-300' : row === 2 ? 'bg-yellow-300' : 'bg-gray-200'" />
                <div class="flex justify-end gap-1">
                  <div class="h-3 w-5 rounded bg-blue-100" />
                  <div class="h-3 w-5 rounded bg-red-100" />
                </div>
              </div>
            </div>
          </div>

          <!-- Mockup: Form -->
          <div v-else-if="tour.step.value?.mockupType === 'form'" class="p-3">
            <div class="mb-2 h-1.5 w-24 rounded-full bg-gray-300" />
            <div class="grid grid-cols-2 gap-2">
              <div v-for="i in 4" :key="i" class="rounded border border-gray-200 px-2 py-2">
                <div class="mb-1 h-1 w-10 rounded-full bg-gray-300" />
                <div class="h-2 w-full rounded bg-gray-100" />
              </div>
            </div>
            <div class="mt-2 rounded border border-gray-200 px-2 py-2">
              <div class="mb-1 h-1 w-16 rounded-full bg-gray-300" />
              <div class="h-8 w-full rounded bg-gray-100" />
            </div>
            <div class="mt-2 flex justify-end">
              <div class="rounded bg-blue-500 px-3 py-1">
                <div class="h-1.5 w-12 rounded-full bg-white/70" />
              </div>
            </div>
          </div>

          <!-- Mockup: Stats + chart -->
          <div v-else-if="tour.step.value?.mockupType === 'stats'" class="p-3">
            <div class="mb-2 grid grid-cols-3 gap-1.5">
              <div v-for="(c,i) in ['border-blue-200 bg-blue-50','border-green-200 bg-green-50','border-red-200 bg-red-50']" :key="i"
                :class="['rounded-lg border p-2 text-center', c]">
                <div class="mx-auto mb-1 h-3 w-3 rounded-full bg-gray-300" />
                <div class="mx-auto h-2 w-10 rounded bg-gray-200" />
                <div class="mx-auto mt-0.5 h-1 w-6 rounded bg-gray-100" />
              </div>
            </div>
            <div class="flex items-end gap-0.5 rounded border border-gray-100 bg-gray-50 p-2" style="height:70px">
              <div v-for="(h,i) in [40,70,30,90,50,60,80,45,75,55,65,85]" :key="i"
                :class="['flex-1 rounded-t transition-all', h > 60 ? 'bg-red-300' : 'bg-green-300']"
                :style="{ height: h+'%' }" />
            </div>
          </div>

          <!-- Mockup: Chart -->
          <div v-else-if="tour.step.value?.mockupType === 'chart'" class="p-3">
            <div class="mb-2 flex gap-2">
              <div v-for="(c,i) in ['bg-violet-100 text-violet-600','bg-blue-100 text-blue-600','bg-green-100 text-green-600']" :key="i">
                <div :class="['rounded-full px-2 py-0.5', c]">
                  <div class="h-1.5 w-8 rounded-full bg-current opacity-40" />
                </div>
              </div>
            </div>
            <!-- line chart simulation -->
            <div class="relative h-24 rounded border border-gray-100 bg-gray-50 p-2">
              <svg class="h-full w-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                <polyline points="0,50 20,35 40,42 60,20 80,30 100,15 120,25 140,10 160,18 180,8 200,5"
                  fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" />
                <polyline points="0,50 20,35 40,42 60,20 80,30 100,15 120,25 140,10 160,18 180,8 200,5"
                  fill="url(#grad)" stroke="none" />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

        </div>
        <p class="mt-2 text-center text-[10px] text-gray-400">↑ স্ক্রিনে এরকম দেখাবে</p>
      </div>

      <!-- ── DESCRIPTION ── -->
      <div class="px-5 py-4">
        <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {{ tour.step.value?.description }}
        </p>

        <!-- Pro tip -->
        <div v-if="tour.step.value?.tip"
          class="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          <span class="mt-0.5 shrink-0 text-base">💡</span>
          <span>{{ tour.step.value.tip }}</span>
        </div>
      </div>

      <!-- ── STEP DOTS ── -->
      <div class="flex justify-center gap-1.5 pb-3">
        <button
          v-for="(s, i) in tour.steps"
          :key="s.id"
          type="button"
          class="h-1.5 rounded-full transition-all"
          :class="[
            i === tour.currentStep.value
              ? ['w-6', dotColor[s.color]]
              : 'w-1.5 bg-gray-200 dark:bg-gray-600'
          ]"
          @click="tour.jumpTo(i)"
        />
      </div>

      <!-- ── FOOTER ACTIONS ── -->
      <div class="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-700">
        <button
          type="button"
          class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click="tour.completeTour()"
        >
          ট্যুর বাদ দিন
        </button>

        <div class="flex items-center gap-2">
          <button
            v-if="!tour.isFirst.value"
            type="button"
            class="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            @click="tour.prev()"
          >
            <ChevronLeftIcon class="h-3.5 w-3.5" />
            আগে
          </button>

          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-95"
            @click="tour.next()"
          >
            <template v-if="tour.isLast.value">
              <CheckCircleIcon class="h-4 w-4" />
              সম্পন্ন করুন
            </template>
            <template v-else>
              পরবর্তী
              <ChevronRightIcon class="h-3.5 w-3.5" />
            </template>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.tour-fade-enter-active, .tour-fade-leave-active { transition: opacity 0.3s ease; }
.tour-fade-enter-from, .tour-fade-leave-to { opacity: 0; }

.tour-slide-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.tour-slide-leave-active { transition: all 0.25s ease; }
.tour-slide-enter-from { opacity: 0; transform: translateY(24px) scale(0.95); }
.tour-slide-leave-to   { opacity: 0; transform: translateY(16px) scale(0.97); }
</style>
