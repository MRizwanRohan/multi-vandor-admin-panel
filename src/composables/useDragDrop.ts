// ═══════════════════════════════════════════════════════════════════
// useDragDrop — Drag and drop reorder utilities
// ═══════════════════════════════════════════════════════════════════
//
// NOTE: This composable provides basic drag-drop functionality.
// For full sortable list support, install vue-draggable-plus:
//   npm install vue-draggable-plus
//
// ═══════════════════════════════════════════════════════════════════

import { ref, type Ref } from 'vue'

export interface DragDropOptions<T> {
  /** Called when items are reordered */
  onReorder?: (items: T[], from: number, to: number) => void
  /** Called when drag starts */
  onDragStart?: (item: T, index: number) => void
  /** Called when drag ends */
  onDragEnd?: (item: T, index: number) => void
  /** Handle selector (only this element triggers drag) */
  handle?: string
  /** Disable drag functionality */
  disabled?: boolean
}

export interface DragDropState {
  isDragging: boolean
  dragIndex: number | null
  dragOverIndex: number | null
}

/**
 * Composable for basic drag and drop reordering
 *
 * @param items - Ref to array of items to reorder
 * @param options - Configuration options
 * @returns Drag and drop utilities and state
 *
 * @example
 * const items = ref(['A', 'B', 'C'])
 * const { state, handlers } = useDragDrop(items, {
 *   onReorder: (newItems) => console.log('Reordered:', newItems),
 * })
 *
 * // In template:
 * <div
 *   v-for="(item, index) in items"
 *   :key="item"
 *   draggable="true"
 *   v-bind="handlers(index)"
 * >
 *   {{ item }}
 * </div>
 */
export function useDragDrop<T>(
  items: Ref<T[]>,
  options: DragDropOptions<T> = {}
) {
  const { onReorder, onDragStart, onDragEnd, disabled = false } = options

  const state = ref<DragDropState>({
    isDragging: false,
    dragIndex: null,
    dragOverIndex: null,
  })

  /**
   * Move item from one index to another
   */
  function moveItem(from: number, to: number): void {
    if (from === to) return
    if (from < 0 || from >= items.value.length) return
    if (to < 0 || to >= items.value.length) return

    const newItems = [...items.value]
    const [removed] = newItems.splice(from, 1)
    newItems.splice(to, 0, removed)
    items.value = newItems

    onReorder?.(newItems, from, to)
  }

  /**
   * Handle drag start event
   */
  function handleDragStart(e: DragEvent, index: number): void {
    if (disabled) {
      e.preventDefault()
      return
    }

    state.value.isDragging = true
    state.value.dragIndex = index

    // Set drag data
    e.dataTransfer?.setData('text/plain', String(index))
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
    }

    onDragStart?.(items.value[index], index)
  }

  /**
   * Handle drag over event
   */
  function handleDragOver(e: DragEvent, index: number): void {
    if (disabled) return

    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
    state.value.dragOverIndex = index
  }

  /**
   * Handle drag leave event
   */
  function handleDragLeave(): void {
    state.value.dragOverIndex = null
  }

  /**
   * Handle drop event
   */
  function handleDrop(e: DragEvent, index: number): void {
    if (disabled) return

    e.preventDefault()

    const fromIndex = state.value.dragIndex
    if (fromIndex !== null && fromIndex !== index) {
      moveItem(fromIndex, index)
    }

    resetDragState()
  }

  /**
   * Handle drag end event
   */
  function handleDragEnd(): void {
    if (state.value.dragIndex !== null) {
      onDragEnd?.(items.value[state.value.dragIndex], state.value.dragIndex)
    }
    resetDragState()
  }

  /**
   * Reset drag state
   */
  function resetDragState(): void {
    state.value.isDragging = false
    state.value.dragIndex = null
    state.value.dragOverIndex = null
  }

  /**
   * Get event handlers for an item at index
   */
  function handlers(index: number) {
    return {
      onDragstart: (e: DragEvent) => handleDragStart(e, index),
      onDragover: (e: DragEvent) => handleDragOver(e, index),
      onDragleave: handleDragLeave,
      onDrop: (e: DragEvent) => handleDrop(e, index),
      onDragend: handleDragEnd,
    }
  }

  /**
   * Get CSS classes for drag state
   */
  function dragClasses(index: number) {
    return {
      'is-dragging': state.value.isDragging && state.value.dragIndex === index,
      'drag-over': state.value.dragOverIndex === index && state.value.dragIndex !== index,
    }
  }

  /**
   * Check if an index is currently being dragged
   */
  function isDraggingIndex(index: number): boolean {
    return state.value.isDragging && state.value.dragIndex === index
  }

  /**
   * Check if an index is the current drop target
   */
  function isDropTarget(index: number): boolean {
    return state.value.dragOverIndex === index && state.value.dragIndex !== index
  }

  /**
   * Programmatically reorder items (move up)
   */
  function moveUp(index: number): void {
    if (index > 0) {
      moveItem(index, index - 1)
    }
  }

  /**
   * Programmatically reorder items (move down)
   */
  function moveDown(index: number): void {
    if (index < items.value.length - 1) {
      moveItem(index, index + 1)
    }
  }

  /**
   * Move item to start
   */
  function moveToStart(index: number): void {
    if (index > 0) {
      moveItem(index, 0)
    }
  }

  /**
   * Move item to end
   */
  function moveToEnd(index: number): void {
    if (index < items.value.length - 1) {
      moveItem(index, items.value.length - 1)
    }
  }

  return {
    // State
    state,

    // Event handlers (use with v-bind)
    handlers,

    // CSS class helper
    dragClasses,

    // State checks
    isDraggingIndex,
    isDropTarget,

    // Programmatic moves
    moveItem,
    moveUp,
    moveDown,
    moveToStart,
    moveToEnd,

    // Reset
    resetDragState,
  }
}

/**
 * Simple array reorder utility
 *
 * @example
 * const items = ['A', 'B', 'C']
 * const reordered = reorderArray(items, 0, 2) // ['B', 'C', 'A']
 */
export function reorderArray<T>(array: T[], from: number, to: number): T[] {
  const result = [...array]
  const [removed] = result.splice(from, 1)
  result.splice(to, 0, removed)
  return result
}
