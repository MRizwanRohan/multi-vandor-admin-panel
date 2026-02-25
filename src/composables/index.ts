// ═══════════════════════════════════════════════════════════════════
// Composables Index — Re-exports all composables
// ═══════════════════════════════════════════════════════════════════

// Authentication & Authorization
export { useAuth } from './useAuth'
export { usePermission, useCanDo, useHasRole, type UserRole } from './usePermission'

// API & Data Fetching
export { useApi, useMutation } from './useApi'
export { usePagination, usePaginationMeta } from './usePagination'
export { useTable } from './useTable'

// UI State & Modals
export { useModal, useModals } from './useModal'
export { useConfirm, useConfirmDelete, useConfirmAction } from './useConfirm'
export { useToast } from './useToast'
export { useBreadcrumb, usePageBreadcrumb, type UseBreadcrumbOptions } from './useBreadcrumb'

// Formatting & Localization
export { useCurrency } from './useCurrency'
export { useDate } from './useDate'
export { useTheme, type Theme } from './useTheme'
export { useLocale } from './useLocale'

// Forms & File Upload
export { useForm, useSimpleForm, useFormField, type FormOptions, type FormState, type UseFormReturn } from './useForm'
export { useFileUpload, useImageUpload, useGalleryUpload, type FileWithPreview, type UseFileUploadOptions, type UseFileUploadReturn } from './useFileUpload'

// Utilities
export { useDebounce, useDebouncedRef, useDebouncedValue } from './useDebounce'
export { useClipboard, useCopyText, type UseClipboardOptions } from './useClipboard'
export { useBreakpoint, useIsDesktop, useIsMobile, BREAKPOINTS, type BreakpointKey } from './useBreakpoint'
export { useExport, createExportColumns, type ExportColumn, type ExportOptions } from './useExport'
export { useDragDrop, reorderArray, type DragDropOptions, type DragDropState } from './useDragDrop'
