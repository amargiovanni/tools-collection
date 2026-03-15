import {
  createContext,
  createSignal,
  useContext,
  onMount,
  type ParentProps,
  type Accessor,
} from 'solid-js'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Accessor<Theme>
  resolved: Accessor<ResolvedTheme>
  setTheme: (t: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>()

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme
}

function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

function getStoredTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

export function ThemeProvider(props: ParentProps) {
  const initial = getStoredTheme()
  const [theme, setThemeSignal] = createSignal<Theme>(initial)
  const [resolved, setResolved] = createSignal<ResolvedTheme>(resolveTheme(initial))

  function setTheme(t: Theme) {
    setThemeSignal(t)
    const r = resolveTheme(t)
    setResolved(r)
    applyTheme(r)
    localStorage.setItem('theme', t)
  }

  function toggle() {
    setTheme(resolved() === 'dark' ? 'light' : 'dark')
  }

  onMount(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme() === 'system') {
        const r = getSystemTheme()
        setResolved(r)
        applyTheme(r)
      }
    }
    mq.addEventListener('change', handler)
  })

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {props.children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
