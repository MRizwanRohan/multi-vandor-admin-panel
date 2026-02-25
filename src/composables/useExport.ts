// ═══════════════════════════════════════════════════════════════════
// useExport — CSV/PDF export utilities
// ═══════════════════════════════════════════════════════════════════

import { ref } from 'vue'
import { useToast } from './useToast'
import { useDate } from './useDate'

export interface ExportColumn<T> {
  key: keyof T | string
  label: string
  formatter?: (value: unknown, row: T) => string
}

export interface ExportOptions {
  filename?: string
  sheetName?: string
  includeHeaders?: boolean
  dateFormat?: string
}

/**
 * Composable for exporting data to CSV and JSON formats
 *
 * @returns Export utilities
 *
 * @example
 * const { exportCSV, exportJSON, isExporting } = useExport()
 *
 * // Export products to CSV
 * await exportCSV(products, [
 *   { key: 'name', label: 'Product Name' },
 *   { key: 'price', label: 'Price', formatter: (v) => `৳${v}` },
 *   { key: 'status', label: 'Status' },
 * ], { filename: 'products' })
 */
export function useExport() {
  const toast = useToast()
  const { formatDate } = useDate()

  const isExporting = ref(false)

  /**
   * Get nested value from object using dot notation
   */
  function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc: unknown, part) => {
      if (acc && typeof acc === 'object' && part in acc) {
        return (acc as Record<string, unknown>)[part]
      }
      return undefined
    }, obj)
  }

  /**
   * Format value for CSV output
   */
  function formatValueForCSV(value: unknown): string {
    if (value === null || value === undefined) {
      return ''
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }

    if (value instanceof Date) {
      return formatDate(value)
    }

    if (Array.isArray(value)) {
      return value.join(', ')
    }

    if (typeof value === 'object') {
      return JSON.stringify(value)
    }

    const str = String(value)
    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }

    return str
  }

  /**
   * Export data to CSV file
   */
  async function exportCSV<T extends Record<string, unknown>>(
    data: T[],
    columns: ExportColumn<T>[],
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      filename = 'export',
      includeHeaders = true,
    } = options

    if (data.length === 0) {
      toast.warning('No data to export')
      return
    }

    isExporting.value = true

    try {
      const rows: string[] = []

      // Headers
      if (includeHeaders) {
        const headerRow = columns.map((col) => formatValueForCSV(col.label)).join(',')
        rows.push(headerRow)
      }

      // Data rows
      for (const row of data) {
        const values = columns.map((col) => {
          const rawValue = getNestedValue(row as Record<string, unknown>, String(col.key))
          const value = col.formatter ? col.formatter(rawValue, row) : rawValue
          return formatValueForCSV(value)
        })
        rows.push(values.join(','))
      }

      const csvContent = rows.join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })

      downloadBlob(blob, `${filename}_${formatDate(new Date(), 'YYYY-MM-DD')}.csv`)

      toast.success(`Exported ${data.length} records to CSV`)
    } catch (error) {
      console.error('CSV export failed:', error)
      toast.error('Export failed')
    } finally {
      isExporting.value = false
    }
  }

  /**
   * Export data to JSON file
   */
  async function exportJSON<T>(
    data: T[],
    options: ExportOptions = {}
  ): Promise<void> {
    const { filename = 'export' } = options

    if (data.length === 0) {
      toast.warning('No data to export')
      return
    }

    isExporting.value = true

    try {
      const jsonContent = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })

      downloadBlob(blob, `${filename}_${formatDate(new Date(), 'YYYY-MM-DD')}.json`)

      toast.success(`Exported ${data.length} records to JSON`)
    } catch (error) {
      console.error('JSON export failed:', error)
      toast.error('Export failed')
    } finally {
      isExporting.value = false
    }
  }

  /**
   * Export data as formatted text/plain
   */
  async function exportText<T extends Record<string, unknown>>(
    data: T[],
    columns: ExportColumn<T>[],
    options: ExportOptions = {}
  ): Promise<void> {
    const { filename = 'export' } = options

    if (data.length === 0) {
      toast.warning('No data to export')
      return
    }

    isExporting.value = true

    try {
      const lines: string[] = []

      // Header
      lines.push(columns.map((c) => c.label).join('\t'))
      lines.push('-'.repeat(80))

      // Data
      for (const row of data) {
        const values = columns.map((col) => {
          const rawValue = getNestedValue(row as Record<string, unknown>, String(col.key))
          const value = col.formatter ? col.formatter(rawValue, row) : rawValue
          return String(value ?? '')
        })
        lines.push(values.join('\t'))
      }

      const textContent = lines.join('\n')
      const blob = new Blob([textContent], { type: 'text/plain' })

      downloadBlob(blob, `${filename}_${formatDate(new Date(), 'YYYY-MM-DD')}.txt`)

      toast.success(`Exported ${data.length} records`)
    } catch (error) {
      console.error('Text export failed:', error)
      toast.error('Export failed')
    } finally {
      isExporting.value = false
    }
  }

  /**
   * Download blob as file
   */
  function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Print data as table (opens print dialog)
   */
  function printData<T extends Record<string, unknown>>(
    data: T[],
    columns: ExportColumn<T>[],
    title = 'Report'
  ): void {
    const tableRows = data.map((row) => {
      const cells = columns.map((col) => {
        const rawValue = getNestedValue(row as Record<string, unknown>, String(col.key))
        const value = col.formatter ? col.formatter(rawValue, row) : rawValue
        return `<td style="border: 1px solid #ddd; padding: 8px;">${value ?? ''}</td>`
      }).join('')
      return `<tr>${cells}</tr>`
    }).join('')

    const headerCells = columns.map((col) =>
      `<th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">${col.label}</th>`
    ).join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 18px; margin-bottom: 10px; }
          table { border-collapse: collapse; width: 100%; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated: ${formatDate(new Date(), 'MMM D, YYYY HH:mm')}</p>
        <table>
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  return {
    isExporting,
    exportCSV,
    exportJSON,
    exportText,
    printData,
    downloadBlob,
  }
}

/**
 * Quick helper to create export columns from object keys
 *
 * @example
 * const columns = createExportColumns<Product>(['name', 'price', 'status'])
 */
export function createExportColumns<T>(
  keys: (keyof T)[],
  labels?: Partial<Record<keyof T, string>>
): ExportColumn<T>[] {
  return keys.map((key) => ({
    key: key as string,
    label: labels?.[key] ?? String(key).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }))
}
