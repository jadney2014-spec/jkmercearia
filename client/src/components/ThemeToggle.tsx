import React from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, isDark, toggleTheme } = useTheme();

  const themes = [
    { key: 'light' as const, icon: SunIcon, label: 'Claro' },
    { key: 'dark' as const, icon: MoonIcon, label: 'Escuro' },
    { key: 'auto' as const, icon: ComputerDesktopIcon, label: 'Automático' },
  ];

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      {/* Toggle rápido - sempre visível */}
      <motion.button
        onClick={toggleTheme}
        className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={`Tema atual: ${themes.find(t => t.key === theme)?.label}`}
        data-theme-toggle
        aria-label="Alternar tema"
      >
        <motion.div
          animate={{ rotate: isDark ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isDark ? (
            <MoonIcon className="h-5 w-5 text-blue-400" />
          ) : (
            <SunIcon className="h-5 w-5 text-yellow-500" />
          )}
        </motion.div>
      </motion.button>

      {/* Seletor de tema completo - OCULTO NO MOBILE */}
      <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.key;
          
          return (
            <motion.button
              key={themeOption.key}
              onClick={() => setTheme(themeOption.key)}
              className={`relative px-2 xl:px-3 py-1.5 rounded-md text-xs xl:text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-1 xl:space-x-1.5">
                <Icon className="h-3 w-3 xl:h-4 xl:w-4" />
                <span className="hidden xl:inline">{themeOption.label}</span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="activeTheme"
                  className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeToggle;
