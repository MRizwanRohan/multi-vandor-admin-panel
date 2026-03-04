<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- Admin Banner Form — Create/Edit banner with image upload -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useBreadcrumbStore } from '@/stores'
import { bannerService } from '@/services'
import { useToast } from '@/composables'
import { BANNER_POSITIONS } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormTextarea from '@/components/form/FormTextarea.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import FormSwitch from '@/components/form/FormSwitch.vue'
import {
  ArrowLeftIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const breadcrumbStore = useBreadcrumbStore()
const toast = useToast()

// Mode detection
const bannerId = computed(() => {
  const raw = route.params.id as string | undefined
  if (!raw || raw === 'new') return undefined
  const id = Number(raw)
  return isNaN(id) ? undefined : id
})
const isEditMode = computed(() => bannerId.value !== undefined)
const pageTitle = computed(() => isEditMode.value ? 'Edit Banner' : 'Create Banner')

// Set page info
onMounted(() => {
  breadcrumbStore.setPageInfo(pageTitle.value, [
    { label: 'Banners', to: '/admin/banners' },
    { label: pageTitle.value },
  ])
  
  if (isEditMode.value) {
    fetchBanner()
  }
})

// Data
const isLoading = ref(false)
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const existingImageUrl = ref<string | null>(null)

// Form validation
const bannerSchema = toTypedSchema(z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  link_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  position: z.string().min(1, 'Position is required'),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  is_active: z.boolean(),
  display_order: z.coerce.number().int().min(0).optional(),
}))

const {
  handleSubmit,
  errors,
  defineField,
  isSubmitting,
  setValues,
} = useForm({
  validationSchema: bannerSchema,
  initialValues: {
    title: '',
    description: '',
    link_url: '',
    position: 'hero',
    starts_at: '',
    ends_at: '',
    is_active: true,
    display_order: 0,
  },
})

const [title, titleAttrs] = defineField('title')
const [description, descriptionAttrs] = defineField('description')
const [linkUrl, linkUrlAttrs] = defineField('link_url')
const [position, positionAttrs] = defineField('position')
const [startsAt, startsAtAttrs] = defineField('starts_at')
const [endsAt, endsAtAttrs] = defineField('ends_at')
const [isActive, isActiveAttrs] = defineField('is_active')
const [displayOrder, displayOrderAttrs] = defineField('display_order')

// Position options
const positionOptions = BANNER_POSITIONS.map(p => ({
  value: p.value,
  label: p.label,
}))

// Fetch banner for editing
async function fetchBanner() {
  if (!bannerId.value) return
  
  isLoading.value = true
  try {
    const banner = await bannerService.getById(bannerId.value)
    setValues({
      title: banner.title,
      description: banner.description || '',
      link_url: banner.link_url || '',
      position: banner.position,
      starts_at: banner.starts_at ? formatDateTimeLocal(banner.starts_at) : '',
      ends_at: banner.ends_at ? formatDateTimeLocal(banner.ends_at) : '',
      is_active: banner.is_active,
      display_order: banner.display_order || 0,
    })
    existingImageUrl.value = banner.image_url || banner.image || null
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to fetch banner')
    router.push('/admin/banners')
  } finally {
    isLoading.value = false
  }
}

// Format datetime for input
function formatDateTimeLocal(date: string) {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().slice(0, 16)
}

// Handle image upload
function handleImageSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  
  const file = input.files[0]
  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file')
    return
  }
  
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image size must be less than 5MB')
    return
  }
  
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

function removeImage() {
  imageFile.value = null
  imagePreview.value = null
}

function removeExistingImage() {
  existingImageUrl.value = null
}

// Current image to show
const displayImage = computed(() => {
  if (imagePreview.value) return imagePreview.value
  if (existingImageUrl.value) return existingImageUrl.value
  return null
})

// Submit form
const onSubmit = handleSubmit(async (values) => {
  if (!isEditMode.value && !imageFile.value) {
    toast.error('Please select a banner image')
    return
  }

  try {
    const payload = {
      title: values.title,
      description: values.description,
      link_url: values.link_url || undefined,
      position: values.position,
      starts_at: values.starts_at || undefined,
      ends_at: values.ends_at || undefined,
      is_active: values.is_active,
      display_order: values.display_order,
      image: imageFile.value || undefined,
    }
    
    if (isEditMode.value && bannerId.value) {
      await bannerService.update(bannerId.value, payload)
      toast.success('Banner updated successfully')
    } else {
      await bannerService.create(payload as any)
      toast.success('Banner created successfully')
    }
    
    router.push('/admin/banners')
  } catch (error: any) {
    toast.error(error.response?.data?.message || (isEditMode.value ? 'Failed to update banner' : 'Failed to create banner'))
  }
})

// Navigation
function goBack() {
  router.push('/admin/banners')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <BaseButton variant="ghost" size="sm" @click="goBack">
          <ArrowLeftIcon class="h-5 w-5" />
        </BaseButton>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ pageTitle }}</h1>
      </div>
      <div class="flex gap-3">
        <BaseButton variant="secondary" @click="goBack">Cancel</BaseButton>
        <BaseButton :loading="isSubmitting" @click="onSubmit">
          {{ isEditMode ? 'Update Banner' : 'Create Banner' }}
        </BaseButton>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>

    <form v-else @submit.prevent="onSubmit" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic Information -->
        <BaseCard title="Banner Details">
          <div class="space-y-4">
            <FormInput
              v-model="title"
              v-bind="titleAttrs"
              label="Title"
              placeholder="e.g., Summer Sale Banner"
              :error="errors.title"
              required
            />
            
            <FormTextarea
              v-model="description"
              v-bind="descriptionAttrs"
              label="Description"
              placeholder="Optional banner description"
              :rows="2"
              :error="errors.description"
            />
            
            <FormInput
              v-model="linkUrl"
              v-bind="linkUrlAttrs"
              label="Link URL"
              placeholder="https://example.com/promo"
              :error="errors.link_url"
              hint="Where users go when clicking the banner"
            />
          </div>
        </BaseCard>

        <!-- Image Upload -->
        <BaseCard title="Banner Image">
          <div class="space-y-4">
            <!-- Current/Preview Image -->
            <div v-if="displayImage" class="relative rounded-lg overflow-hidden">
              <img
                :src="displayImage"
                alt="Banner preview"
                class="w-full h-48 object-cover"
              />
              <button
                type="button"
                class="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                @click="imagePreview ? removeImage() : removeExistingImage()"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
            
            <!-- Upload Zone -->
            <label
              class="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-primary-500 dark:hover:bg-gray-800/50 transition-colors"
              :class="{ 'hidden': displayImage }"
            >
              <div class="flex flex-col items-center justify-center py-6">
                <CloudArrowUpIcon class="w-12 h-12 text-gray-400 mb-3" />
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  <span class="font-semibold text-primary-500">Click to upload</span> or drag and drop
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  PNG, JPG, or WebP (max 5MB)
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleImageSelect"
              />
            </label>
            
            <!-- Re-upload button when image exists -->
            <div v-if="displayImage" class="flex justify-center">
              <label class="cursor-pointer">
                <span class="text-sm text-primary-500 hover:text-primary-600">Change image</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleImageSelect"
                />
              </label>
            </div>
          </div>
        </BaseCard>

        <!-- Schedule -->
        <BaseCard title="Schedule">
          <div class="grid grid-cols-2 gap-4">
            <FormInput
              v-model="startsAt"
              v-bind="startsAtAttrs"
              label="Start Date & Time"
              type="datetime-local"
              :error="errors.starts_at"
              hint="Leave empty to start immediately"
            />
            
            <FormInput
              v-model="endsAt"
              v-bind="endsAtAttrs"
              label="End Date & Time"
              type="datetime-local"
              :error="errors.ends_at"
              hint="Leave empty for no end date"
            />
          </div>
        </BaseCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Status -->
        <BaseCard title="Status">
          <div class="space-y-4">
            <FormSwitch
              v-model="isActive"
              v-bind="isActiveAttrs"
              label="Active"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Banner will be visible when active and within the scheduled period.
            </p>
          </div>
        </BaseCard>

        <!-- Position -->
        <BaseCard title="Position">
          <div class="space-y-4">
            <FormSelect
              v-model="position"
              v-bind="positionAttrs"
              label="Display Position"
              :options="positionOptions"
              :error="errors.position"
            />
            
            <FormInput
              v-model.number="displayOrder"
              v-bind="displayOrderAttrs"
              label="Display Order"
              type="number"
              :min="0"
              :error="errors.display_order"
              hint="Lower numbers appear first"
            />
          </div>
        </BaseCard>

        <!-- Preview -->
        <BaseCard title="Preview">
          <div class="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            <div v-if="displayImage" class="relative">
              <img
                :src="displayImage"
                :alt="title || 'Banner'"
                class="w-full h-32 object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div class="absolute bottom-2 left-2 right-2">
                <p class="text-white text-sm font-medium truncate">{{ title || 'Banner Title' }}</p>
              </div>
            </div>
            <div v-else class="flex h-32 items-center justify-center">
              <PhotoIcon class="h-12 w-12 text-gray-400" />
            </div>
          </div>
        </BaseCard>
      </div>
    </form>
  </div>
</template>
