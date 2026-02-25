<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Bar Chart Component — Reusable bar chart with Chart.js -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { useUIStore } from '@/stores'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface Props {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
  title?: string
  height?: number | string
  showLegend?: boolean
  showGrid?: boolean
  horizontal?: boolean
  stacked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  showLegend: true,
  showGrid: true,
  horizontal: false,
  stacked: false,
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
]

// Chart data
const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.labels,
  datasets: props.datasets.map((dataset, index) => ({
    label: dataset.label,
    data: dataset.data,
    backgroundColor: dataset.backgroundColor || defaultColors[index % defaultColors.length],
    borderColor: dataset.borderColor || 'transparent',
    borderWidth: dataset.borderWidth ?? 0,
    borderRadius: 6,
    barThickness: 'flex' as const,
    maxBarThickness: 50,
  })),
}))

// Chart options
const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: props.horizontal ? 'y' : 'x',
  plugins: {
    legend: {
      display: props.showLegend,
      position: 'top' as const,
      labels: {
        color: uiStore.isDark ? '#9ca3af' : '#6b7280',
        usePointStyle: true,
        padding: 20,
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
  scales: {
    x: {
      display: props.showGrid,
      stacked: props.stacked,
      grid: {
        display: false,
      },
      ticks: {
        color: uiStore.isDark ? '#9ca3af' : '#6b7280',
      },
    },
    y: {
      display: props.showGrid,
      stacked: props.stacked,
      grid: {
        color: uiStore.isDark ? '#374151' : '#f3f4f6',
      },
      ticks: {
        color: uiStore.isDark ? '#9ca3af' : '#6b7280',
      },
    },
  },
}))
</script>

<template>
  <div :style="{ height: typeof height === 'number' ? `${height}px` : height }">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
