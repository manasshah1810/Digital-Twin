'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{
    theme: Theme
    toggleTheme: () => void
}>({ theme: 'light', toggleTheme: () => { } })

export const useTheme = () => useContext(ThemeContext)

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem('theme') as Theme
        if (saved) {
            setTheme(saved)
            if (saved === 'dark') document.documentElement.classList.add('dark')
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark')
            document.documentElement.classList.add('dark')
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

    if (!mounted) return <>{children}</>

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()
    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-surface-100 text-surface-900 hover:bg-surface-200 transition-colors shadow-sm"
            title="Toggle theme"
        >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
    )
}
