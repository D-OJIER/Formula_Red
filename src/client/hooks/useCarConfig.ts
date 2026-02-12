import { useState, useEffect } from 'react';
import type { CarConfig } from '../../shared/types';

const CAR_CONFIG_STORAGE_KEY = 'formula-red-car-config';

const defaultConfig: CarConfig = {
  downforce: 50,
  gearBias: 50,
  tyres: 'medium',
  drivingStyle: 50,
  tacticalAbility: 50,
};

/**
 * Hook to manage car configuration with localStorage persistence
 */
export const useCarConfig = () => {
  const [config, setConfig] = useState<CarConfig>(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(CAR_CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the stored config
        if (
          typeof parsed.downforce === 'number' &&
          typeof parsed.gearBias === 'number' &&
          typeof parsed.drivingStyle === 'number' &&
          typeof parsed.tacticalAbility === 'number' &&
          ['soft', 'medium', 'hard'].includes(parsed.tyres)
        ) {
          return parsed as CarConfig;
        }
      }
    } catch (err) {
      console.warn('Failed to load car config from localStorage:', err);
    }
    return defaultConfig;
  });

  // Save to localStorage whenever config changes
  useEffect(() => {
    try {
      localStorage.setItem(CAR_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (err) {
      console.warn('Failed to save car config to localStorage:', err);
    }
  }, [config]);

  return [config, setConfig] as const;
};
