/// <reference types="vite/client" />

interface ImportMetaEnv {
  // OpenAI API Configuration


  // Application Configuration
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_VERSION?: string

  // Analytics
  readonly VITE_ANALYTICS_ID?: string
  readonly VITE_ENABLE_ANALYTICS?: string

  // Feature Flags
  readonly VITE_ENABLE_AI_FIXER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
