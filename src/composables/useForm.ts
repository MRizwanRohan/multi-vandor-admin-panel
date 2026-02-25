// ═══════════════════════════════════════════════════════════════════
// useForm Composable — Form management with vee-validate integration
// ═══════════════════════════════════════════════════════════════════

import { ref, computed, watch, type Ref } from 'vue'
import { useForm as useVeeForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import type { ZodSchema, ZodTypeDef } from 'zod'

export interface FormOptions<T extends Record<string, unknown>> {
  schema?: ZodSchema<T, ZodTypeDef, unknown>
  initialValues?: Partial<T>
  validateOnMount?: boolean
  keepValuesOnUnmount?: boolean
}

export interface FormState<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isValid: boolean
  isDirty: boolean
  isSubmitting: boolean
  submitCount: number
}

export interface UseFormReturn<T extends Record<string, unknown>> {
  // State
  values: Ref<T>
  errors: Ref<Partial<Record<keyof T, string>>>
  touched: Ref<Partial<Record<keyof T, boolean>>>
  isValid: Ref<boolean>
  isDirty: Ref<boolean>
  isSubmitting: Ref<boolean>
  submitCount: Ref<number>

  // Field helpers
  getFieldValue: <K extends keyof T>(field: K) => T[K]
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void
  setFieldError: <K extends keyof T>(field: K, error: string) => void
  setFieldTouched: <K extends keyof T>(field: K, touched?: boolean) => void
  getFieldError: <K extends keyof T>(field: K) => string | undefined
  getFieldProps: <K extends keyof T>(field: K) => {
    modelValue: T[K]
    'onUpdate:modelValue': (value: T[K]) => void
    error: string | undefined
    onBlur: () => void
  }

  // Form actions
  handleSubmit: (
    onValid: (values: T) => void | Promise<void>,
    onInvalid?: (errors: Partial<Record<keyof T, string>>) => void
  ) => (e?: Event) => Promise<void>
  validate: () => Promise<boolean>
  validateField: <K extends keyof T>(field: K) => Promise<boolean>
  reset: (newValues?: Partial<T>) => void
  resetField: <K extends keyof T>(field: K, value?: T[K]) => void
  setValues: (values: Partial<T>) => void
  setErrors: (errors: Partial<Record<keyof T, string>>) => void
  clearErrors: () => void

  // Meta
  meta: {
    valid: Ref<boolean>
    dirty: Ref<boolean>
    touched: Ref<boolean>
    pending: Ref<boolean>
  }
}

/**
 * Enhanced form composable with vee-validate integration
 */
export function useForm<T extends Record<string, unknown>>(
  options: FormOptions<T> = {}
): UseFormReturn<T> {
  const { schema, initialValues = {} as Partial<T>, validateOnMount = false } = options

  // Initialize vee-validate form
  const veeFormConfig = schema
    ? {
        validationSchema: toTypedSchema(schema),
        initialValues: initialValues as T,
        validateOnMount,
      }
    : {
        initialValues: initialValues as T,
        validateOnMount,
      }

  const {
    values,
    errors,
    meta,
    handleSubmit: veeHandleSubmit,
    setFieldValue: veeSetFieldValue,
    setFieldError: veeSetFieldError,
    setFieldTouched: veeSetFieldTouched,
    setValues: veeSetValues,
    setErrors: veeSetErrors,
    resetForm,
    validate: veeValidate,
    validateField: veeValidateField,
  } = useVeeForm<T>(veeFormConfig)

  // Reactive state
  const isSubmitting = ref(false)
  const submitCount = ref(0)

  // Computed
  const isValid = computed(() => meta.value.valid)
  const isDirty = computed(() => meta.value.dirty)
  const touched = computed(() => {
    const result: Partial<Record<keyof T, boolean>> = {}
    for (const key in values) {
      result[key as keyof T] = meta.value.touched
    }
    return result
  })

  // Field helpers
  const getFieldValue = <K extends keyof T>(field: K): T[K] => {
    return values[field]
  }

  const setFieldValue = <K extends keyof T>(field: K, value: T[K]): void => {
    veeSetFieldValue(field as string, value)
  }

  const setFieldError = <K extends keyof T>(field: K, error: string): void => {
    veeSetFieldError(field as string, error)
  }

  const setFieldTouched = <K extends keyof T>(field: K, isTouched = true): void => {
    veeSetFieldTouched(field as string, isTouched)
  }

  const getFieldError = <K extends keyof T>(field: K): string | undefined => {
    return errors.value[field]
  }

  const getFieldProps = <K extends keyof T>(field: K) => {
    return {
      modelValue: values[field],
      'onUpdate:modelValue': (value: T[K]) => setFieldValue(field, value),
      error: errors.value[field],
      onBlur: () => setFieldTouched(field, true),
    }
  }

  // Form actions
  const handleSubmit = (
    onValid: (values: T) => void | Promise<void>,
    onInvalid?: (errors: Partial<Record<keyof T, string>>) => void
  ) => {
    return veeHandleSubmit(
      async (validValues) => {
        isSubmitting.value = true
        submitCount.value++
        try {
          await onValid(validValues)
        } finally {
          isSubmitting.value = false
        }
      },
      (invalidErrors) => {
        submitCount.value++
        onInvalid?.(invalidErrors.errors as Partial<Record<keyof T, string>>)
      }
    )
  }

  const validate = async (): Promise<boolean> => {
    const result = await veeValidate()
    return result.valid
  }

  const validateField = async <K extends keyof T>(field: K): Promise<boolean> => {
    const result = await veeValidateField(field as string)
    return result.valid
  }

  const reset = (newValues?: Partial<T>): void => {
    resetForm({
      values: newValues ? { ...initialValues, ...newValues } as T : initialValues as T,
    })
    submitCount.value = 0
  }

  const resetField = <K extends keyof T>(field: K, value?: T[K]): void => {
    const resetValue = value !== undefined ? value : initialValues[field]
    setFieldValue(field, resetValue as T[K])
    setFieldError(field, '')
    setFieldTouched(field, false)
  }

  const setValues = (newValues: Partial<T>): void => {
    veeSetValues(newValues)
  }

  const setErrors = (newErrors: Partial<Record<keyof T, string>>): void => {
    veeSetErrors(newErrors as Record<string, string>)
  }

  const clearErrors = (): void => {
    veeSetErrors({})
  }

  return {
    // State
    values: values as unknown as Ref<T>,
    errors: errors as unknown as Ref<Partial<Record<keyof T, string>>>,
    touched,
    isValid,
    isDirty,
    isSubmitting,
    submitCount,

    // Field helpers
    getFieldValue,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    getFieldError,
    getFieldProps,

    // Form actions
    handleSubmit,
    validate,
    validateField,
    reset,
    resetField,
    setValues,
    setErrors,
    clearErrors,

    // Meta
    meta: {
      valid: isValid,
      dirty: isDirty,
      touched: computed(() => meta.value.touched),
      pending: computed(() => meta.value.pending),
    },
  }
}

/**
 * Simple form composable without vee-validate (for basic forms)
 */
export function useSimpleForm<T extends Record<string, unknown>>(initialValues: T) {
  const values = ref({ ...initialValues }) as Ref<T>
  const errors = ref<Partial<Record<keyof T, string>>>({})
  const touched = ref<Partial<Record<keyof T, boolean>>>({})
  const isSubmitting = ref(false)
  const submitCount = ref(0)

  const isDirty = computed(() => {
    return JSON.stringify(values.value) !== JSON.stringify(initialValues)
  })

  const isValid = computed(() => {
    return Object.keys(errors.value).length === 0
  })

  const setFieldValue = <K extends keyof T>(field: K, value: T[K]) => {
    values.value[field] = value
  }

  const setFieldError = <K extends keyof T>(field: K, error: string | undefined) => {
    if (error) {
      errors.value[field] = error
    } else {
      delete errors.value[field]
    }
  }

  const setFieldTouched = <K extends keyof T>(field: K, isTouched = true) => {
    touched.value[field] = isTouched
  }

  const reset = (newValues?: Partial<T>) => {
    values.value = { ...initialValues, ...newValues } as T
    errors.value = {}
    touched.value = {}
    submitCount.value = 0
  }

  const handleSubmit = (
    onValid: (values: T) => void | Promise<void>,
    validate?: () => boolean | Promise<boolean>
  ) => {
    return async (e?: Event) => {
      e?.preventDefault()
      isSubmitting.value = true
      submitCount.value++

      try {
        const isFormValid = validate ? await validate() : true
        if (isFormValid) {
          await onValid(values.value)
        }
      } finally {
        isSubmitting.value = false
      }
    }
  }

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    isDirty,
    isValid,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    reset,
    handleSubmit,
  }
}

/**
 * Field-level composable for individual form fields
 */
export function useFormField<T>(
  name: string,
  options?: {
    initialValue?: T
    validate?: (value: T) => string | undefined | Promise<string | undefined>
  }
) {
  const { value, errorMessage, handleBlur, handleChange, meta, validate, resetField } = useField<T>(
    name,
    options?.validate,
    { initialValue: options?.initialValue }
  )

  return {
    value,
    error: errorMessage,
    touched: computed(() => meta.touched),
    dirty: computed(() => meta.dirty),
    valid: computed(() => meta.valid),
    handleBlur,
    handleChange,
    validate,
    reset: resetField,
    props: computed(() => ({
      modelValue: value.value,
      'onUpdate:modelValue': handleChange,
      error: errorMessage.value,
      onBlur: handleBlur,
    })),
  }
}
