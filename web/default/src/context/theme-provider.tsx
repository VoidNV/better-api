import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

type Theme = 'dark' | 'light' | 'system'
type ResolvedTheme = Exclude<Theme, 'system'>
export type ColorPreset =
  | 'neutral'
  | 'blue'
  | 'violet'
  | 'rose'
  | 'emerald'
  | 'amber'
  | 'custom'

const DEFAULT_THEME = 'dark'
const DEFAULT_COLOR_PRESET: ColorPreset = 'neutral'
const DEFAULT_CUSTOM_ACCENT = '#007aff'
const THEME_COOKIE_NAME = 'vite-ui-theme'
const COLOR_PRESET_STORAGE_KEY = 'vite-ui-color-preset'
const CUSTOM_ACCENT_STORAGE_KEY = 'vite-ui-custom-accent'
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year
const COLOR_PRESETS: ColorPreset[] = [
  'neutral',
  'blue',
  'violet',
  'rose',
  'emerald',
  'amber',
  'custom',
]

function isColorPreset(value: string | null): value is ColorPreset {
  return COLOR_PRESETS.includes(value as ColorPreset)
}

function normalizeHexColor(value: string | null) {
  return /^#[0-9a-f]{6}$/i.test(value || '') ? value! : DEFAULT_CUSTOM_ACCENT
}

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  defaultTheme: Theme
  defaultColorPreset: ColorPreset
  colorPreset: ColorPreset
  customAccentColor: string
  resolvedTheme: ResolvedTheme
  theme: Theme
  setTheme: (theme: Theme) => void
  setColorPreset: (preset: ColorPreset) => void
  setCustomAccentColor: (color: string) => void
  resetTheme: () => void
}

const initialState: ThemeProviderState = {
  defaultTheme: DEFAULT_THEME,
  defaultColorPreset: DEFAULT_COLOR_PRESET,
  colorPreset: DEFAULT_COLOR_PRESET,
  customAccentColor: DEFAULT_CUSTOM_ACCENT,
  resolvedTheme: 'dark',
  theme: DEFAULT_THEME,
  setTheme: () => null,
  setColorPreset: () => null,
  setCustomAccentColor: () => null,
  resetTheme: () => null,
}

const ThemeContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = THEME_COOKIE_NAME,
  ...props
}: ThemeProviderProps) {
  const [theme, _setTheme] = useState<Theme>(
    () => (getCookie(storageKey) as Theme) || defaultTheme
  )
  const [colorPreset, _setColorPreset] = useState<ColorPreset>(() => {
    if (typeof window === 'undefined') return DEFAULT_COLOR_PRESET
    const saved = window.localStorage.getItem(COLOR_PRESET_STORAGE_KEY)
    return isColorPreset(saved) ? saved : DEFAULT_COLOR_PRESET
  })
  const [customAccentColor, _setCustomAccentColor] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_CUSTOM_ACCENT
    return normalizeHexColor(
      window.localStorage.getItem(CUSTOM_ACCENT_STORAGE_KEY)
    )
  })

  // Optimized: Memoize the resolved theme calculation to prevent unnecessary re-computations
  const resolvedTheme = useMemo((): ResolvedTheme => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    return theme as ResolvedTheme
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (currentResolvedTheme: ResolvedTheme) => {
      root.classList.remove('light', 'dark') // Remove existing theme classes
      root.classList.add(currentResolvedTheme) // Add the new theme class
    }

    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light'
        applyTheme(systemTheme)
      }
    }

    applyTheme(resolvedTheme)

    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, resolvedTheme])

  useEffect(() => {
    const root = window.document.documentElement
    root.dataset.colorPreset = colorPreset
    root.style.setProperty('--custom-primary', customAccentColor)
  }, [colorPreset, customAccentColor])

  const setTheme = (theme: Theme) => {
    setCookie(storageKey, theme, THEME_COOKIE_MAX_AGE)
    _setTheme(theme)
  }

  const setColorPreset = (preset: ColorPreset) => {
    window.localStorage.setItem(COLOR_PRESET_STORAGE_KEY, preset)
    _setColorPreset(preset)
  }

  const setCustomAccentColor = (color: string) => {
    window.localStorage.setItem(CUSTOM_ACCENT_STORAGE_KEY, color)
    _setCustomAccentColor(color)
  }

  const resetTheme = () => {
    removeCookie(storageKey)
    window.localStorage.removeItem(COLOR_PRESET_STORAGE_KEY)
    window.localStorage.removeItem(CUSTOM_ACCENT_STORAGE_KEY)
    _setTheme(defaultTheme)
    _setColorPreset(DEFAULT_COLOR_PRESET)
    _setCustomAccentColor(DEFAULT_CUSTOM_ACCENT)
  }

  const contextValue = {
    defaultTheme,
    defaultColorPreset: DEFAULT_COLOR_PRESET,
    colorPreset,
    customAccentColor,
    resolvedTheme,
    resetTheme,
    theme,
    setTheme,
    setColorPreset,
    setCustomAccentColor,
  }

  return (
    <ThemeContext value={contextValue} {...props}>
      {children}
    </ThemeContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
