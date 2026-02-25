<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Line Chart Component — Reusable line chart with Chart.js -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { useUIStore } from '@/stores'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Props {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    fill?: boolean
  }[]
  title?: string
  height?: number | string
  showLegend?: boolean
  showGrid?: boolean
  tension?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  showLegend: true,
  showGrid: true,
  tension: 0.4,
})

const uiStore = useUIStore()

// Default colors
const defaultColors = [
  { border: '#6366f1', background: 'rgba(99, 102, 241, 0.1)' },
  { border: '#10b981', background: 'rgba(16, 185, 129, 0.1)' },
  { border: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' },
  { border: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' },
  { border: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' },
]

// Chart data
const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.labels,
  datasets: props.datasets.map((dataset, index) => ({
    label: dataset.label,
    data: dataset.data,
    borderColor: dataset.borderColor || defaultColors[index % defaultColors.length]?.border || '#6366f1',
    backgroundColor: dataset.backgroundColor || defaultColors[index % defaultColors.length]?.background || 'rgba(99, 102, 241, 0.1)',
    fill: dataset.fill ?? true,
    tension: props.tension,
    pointRadius: 4,
    pointHoverRadius: 6,
    borderWidth: 2,
  })),
}))

// Chart options
const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
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
      grid: {
        display: false,
      },
      ticks: {
        color: uiStore.isDark ? '#9ca3af' : '#6b7280',
      },
    },
    y: {
      display: props.showGrid,
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
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
