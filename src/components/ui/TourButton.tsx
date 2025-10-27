import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { FaQuestion } from 'react-icons/fa';
import { useDriverTour } from '@/hooks/useDriverTour';
import { useLanguage } from '@/contexts/LanguageContext';

const TourButton: React.FC = () => {
  const { startTour } = useDriverTour();
  const { language } = useLanguage();

  const tooltipText = language === 'en'
    ? 'Start Tour'
    : 'Iniciar Tour';

  return (
    <Tooltip title={tooltipText}>
      <IconButton
        onClick={startTour}
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
        <FaQuestion size={18} />
      </IconButton>
    </Tooltip>
  );
};

export default TourButton;
