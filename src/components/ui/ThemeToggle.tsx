import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { HiSun, HiMoon } from 'react-icons/hi';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/data/translations';

const ThemeToggle: React.FC = () => {
  const { themeMode, toggleTheme, isDarkMode } = useTheme();
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <Tooltip title={isDarkMode ? (t.theme?.lightMode || 'Light Mode') : (t.theme?.darkMode || 'Dark Mode')}>
      <IconButton
        onClick={toggleTheme}
        component={motion.button}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        sx={{
          color: 'text.secondary',
          border: '1px solid',
          borderColor: 'divider',
          width: 40,
          height: 40,
          transition: 'all 0.3s ease',
          '&:hover': {
            color: 'primary.main',
            borderColor: 'primary.main',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
          },
        }}
      >
        <motion.div
          initial={false}
          animate={{
            rotate: isDarkMode ? 0 : 180,
            scale: isDarkMode ? 1 : 0.8,
          }}
          transition={{
            duration: 0.5,
            ease: 'easeInOut',
          }}
        >
          {isDarkMode ? <HiSun size={20} /> : <HiMoon size={20} />}
        </motion.div>
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;