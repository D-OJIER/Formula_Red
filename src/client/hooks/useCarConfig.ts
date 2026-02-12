import { useState, useEffect } from 'react';
import type { CarConfig } from '../../shared/types';

const CAR_CONFIG_STORAGE_KEY = 'formula-red-car-config';

const defaultConfig: CarConfig = {
  downforce: 20,
  gearBias: 20,
  tyres: 'medium',
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
          ['soft', 'medium', 'hard'].includes(parsed.tyres)
        ) {
          // Remove old fields if they exist (for backward compatibility)
          const { drivingStyle, tacticalAbility, ...cleanConfig } = parsed;
          return cleanConfig as CarConfig;
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
