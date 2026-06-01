/// <reference types="vite/client" />
import type { JiuJianApi } from '@shared/types'

declare global {
  interface Window {
    api: JiuJianApi
  }
}

export {}
