import { createContext, useContext, useState, useEffect } from 'react';

/* eslint-disable react/only-export-components */

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/* Light is the default canvas. `doodle` stays last so the toggle
   cycles light → doodle → dark → light. */
export const THEMES = ['light', 'doodle', 'dark'];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return THEMES.includes(saved) ? saved : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.remove('light', 'dark', 'doodle');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    const idx = THEMES.indexOf(theme);
    setTheme(THEMES[(idx + 1) % THEMES.length]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;