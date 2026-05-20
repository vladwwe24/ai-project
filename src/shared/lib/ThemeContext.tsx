import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'app-color-mode'

interface ThemeCtx {
  dark: boolean
  toggle: () => void
}

const Ctx = createContext<ThemeCtx>({ dark: false, toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => {
    const isDark = localStorage.getItem(STORAGE_KEY) === 'dark'
    // Apply synchronously to avoid theme flash on first paint
    if (isDark) document.documentElement.classList.add('dark')
    return isDark
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  }, [dark])

  return (
    <Ctx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </Ctx.Provider>
  )
}

export function useTheme() {
  return useContext(Ctx)
}
