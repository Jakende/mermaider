import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark'
type MermaidTheme = 'slate' | 'earth' | 'cosmic' | 'sage' | 'royal'

interface ThemeContextType {
  theme: Theme
  mermaidTheme: MermaidTheme
  toggleTheme: () => void
  setMermaidTheme: (theme: MermaidTheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('mermaider-theme')
    return (saved as Theme) || 'dark'
  })
  const [mermaidTheme, setMermaidThemeState] = useState<MermaidTheme>(() => {
    const saved = localStorage.getItem('mermaider-mermaid-theme')
    // Validate saved theme against new valid options
    if (saved === 'slate' || saved === 'earth' || saved === 'cosmic' || saved === 'sage' || saved === 'royal') {
      return saved as MermaidTheme
    }
    return 'slate'
  })

  useEffect(() => {
    localStorage.setItem('mermaider-theme', theme)
    if (theme === 'light') {
      document.body.classList.add('theme-invert')
    } else {
      document.body.classList.remove('theme-invert')
    }
  }, [theme])

  useEffect(() => {
    localStorage.setItem('mermaider-mermaid-theme', mermaidTheme)
  }, [mermaidTheme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const setMermaidTheme = (newTheme: MermaidTheme) => {
    setMermaidThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, mermaidTheme, toggleTheme, setMermaidTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

