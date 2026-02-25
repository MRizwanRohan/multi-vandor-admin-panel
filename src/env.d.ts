/// <reference types="vite/client" />

// ═══════════════════════════════════════════════════════════════════
// Environment Variables Type Definitions
// ═══════════════════════════════════════════════════════════════════

interface ImportMetaEnv {
  // App
  readonly VITE_APP_NAME: string
  readonly VITE_APP_URL: string
  readonly VITE_APP_ENV: 'local' | 'staging' | 'production'
  
  // API
  readonly VITE_API_URL: string
  readonly VITE_API_TIMEOUT: string
  
  // Storage
  readonly VITE_STORAGE_URL: string
  
  // Features
  readonly VITE_ENABLE_DEVTOOLS: string
  readonly VITE_ENABLE_MOCK_API: string
  
  // Analytics (optional)
  readonly VITE_GA_ID?: string
  readonly VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Vue component type augmentation
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Image imports
declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

declare module '*.gif' {
  const content: string
  export default content
}

declare module '*.webp' {
  const content: string
  export default content
}
