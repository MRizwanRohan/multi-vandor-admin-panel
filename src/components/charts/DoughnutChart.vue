<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Doughnut Chart Component — Reusable doughnut/pie chart -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import { useUIStore } from '@/stores'

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface Props {
  labels: string[]
  data: number[]
  colors?: string[]
  title?: string
  height?: number | string
  showLegend?: boolean
  cutout?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  showLegend: true,
  cutout: '60%',
})

const uiStore = useUIStore()

// Default colors
const defaultColors = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
]

// Chart data
const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.data,
      backgroundColor: props.colors || defaultColors.slice(0, props.data.length),
      borderWidth: 0,
      hoverOffset: 4,
    },
  ],
}))

// Chart options
const chartOptions = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: props.cutout,
  plugins: {
    legend: {
      display: props.showLegend,
      position: 'right' as const,
      labels: {
        color: uiStore.isDark ? '#9ca3af' : '#6b7280',
        usePointStyle: true,
        padding: 16,
        font: {
          size: 12,
        },
      },
    },
    title: {
      display: !!props.title,
      text: props.title,
      color: uiStore.isDark ? '#f3f4f6' : '#111827',
      font: {
        size: 16,
        weight: 'bold',
      },
    },
    tooltip: {
      backgroundColor: uiStore.isDark ? '#374151' : '#ffffff',
      titleColor: uiStore.isDark ? '#f3f4f6' : '#111827',
      bodyColor: uiStore.isDark ? '#9ca3af' : '#6b7280',
      borderColor: uiStore.isDark ? '#4b5563' : '#e5e7eb',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    },
  },
}))
</script>

<template>
  <div :style="{ height: typeof height === 'number' ? `${height}px` : height }">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>
