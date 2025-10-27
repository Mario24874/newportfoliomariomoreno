import { useEffect, useRef, useCallback } from 'react';
import { driver, Driver, Config } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { tourConfig } from '@/config/driverTour';

export const useDriverTour = () => {
  const { language } = useLanguage();
  const driverInstance = useRef<Driver | null>(null);

  const initializeDriver = useCallback(() => {
    const config = tourConfig[language];

    const driverConfig: Config = {
      showProgress: true,
      steps: config.steps,
      nextBtnText: config.nextBtnText,
      prevBtnText: config.prevBtnText,
      doneBtnText: config.doneBtnText,
      allowClose: true,
      overlayClickNext: false,
      smoothScroll: true,
      animate: true,
      stagePadding: 8,
      stageRadius: 8,
      onDestroyStarted: () => {
        if (driverInstance.current) {
          driverInstance.current.destroy();
        }
      }
    };

    if (driverInstance.current) {
      driverInstance.current.destroy();
    }

    driverInstance.current = driver(driverConfig);
  }, [language]);

  useEffect(() => {
    initializeDriver();

    return () => {
      if (driverInstance.current) {
        driverInstance.current.destroy();
      }
    };
  }, [initializeDriver]);

  const startTour = useCallback(() => {
    if (driverInstance.current) {
      driverInstance.current.drive();
    }
  }, []);

  const stopTour = useCallback(() => {
    if (driverInstance.current) {
      driverInstance.current.destroy();
      initializeDriver();
    }
  }, [initializeDriver]);

  return {
    startTour,
    stopTour
  };
};
