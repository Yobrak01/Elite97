import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('elite97_theme');
    return saved || 'void';
  });

  useEffect(() => {
    localStorage.setItem('elite97_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const themes = [
    { id: 'void', name: 'Void', desc: 'Elite Dark Navy & Gold' },
    { id: 'hyperlight', name: 'Hyperlight', desc: 'Sleek Day Mode' },
    { id: 'cyberpunk', name: 'Cyberpunk', desc: 'Neon Pink & Cyan' },
    { id: 'zenith', name: 'Zenith', desc: 'Emerald & Deep Forest' }
  ];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};
