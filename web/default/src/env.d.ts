/// <reference types="@rsbuild/core/types" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_SITE_URL?: string
}

declare module '@visactor/react-vchart' {
  export const VChart: React.ComponentType<Record<string, unknown>>
}

declare module '@visactor/vchart-semi-theme' {
  export const initVChartSemiTheme: (opts?: Record<string, unknown>) => void
}
