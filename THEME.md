# UI Design Kit Tokens - Shopel

## 1. Design System Tokens (Tailwind Extensions)
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        background: { light: '#ffffff', dark: '#0f172a' },
        foreground: { light: '#1e293b', dark: '#f8fafc' },
        primary: { DEFAULT: '#2563eb', hover: '#1d4ed8' },
        rating: { star: '#f59e0b', unselected: '#cbd5e1' },
        success: '#10b981',
        error: '#ef4444'
      }
    }
  }
};
```

## 2. React Global Theme Provider Architecture
```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```