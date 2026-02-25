<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Sparkline Chart — Inline mini chart for compact areas -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  type ChartOptions,
  type ChartData,
} from 'chart.js'
import { Line } from 'vue-chartjs'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler)

interface Props {
  data: number[]
  color?: string
  fillColor?: string
  width?: number | string
  height?: number | string
  fill?: boolean
  trend?: boolean // auto-color based on trend
}

const props = withDefaults(defineProps<Props>(), {
  color: '#6366f1',
  width: 120,
  height: 32,
  fill: true,
  trend: false,
})

// Auto-detect trend color
const lineColor = computed(() => {
  if (!props.trend) return props.color
  if (props.data.length < 2) return '#6b7280'
  const last = props.data[props.data.length - 1] ?? 0
  const prev = props.data[props.data.length - 2] ?? 0
  return last >= prev ? '#10b981' : '#ef4444'
})

const bgColor = computed(() => {
  if (props.fillColor) return props.fillColor
  // Create semi-transparent version of line color
  const hex = lineColor.value.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, 0.15)`
})

// Chart data — no labels, minimal style
const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.data.map((_, i) => String(i)),
  datasets: [
    {
      data: props.data,
      borderColor: lineColor.value,
      backgroundColor: bgColor.value,
      fill: props.fill,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 0,
      borderWidth: 1.5,
    },
  ],
}))

// Minimal chart options
const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
  scales: {
    x: { display: false },
    y: { display: false },
  },
  elements: {
    line: {
      tension: 0.4,
    },
  },
}))
</script>

<template>
  <div
    :style="{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    }"
    class="inline-block"
  >
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
