import { useState, useEffect } from 'react';
import type { CarConfig } from '../../shared/types';

type CarConfigFormProps = {
  onConfigChange: (config: CarConfig) => void;
  disabled?: boolean;
};

export const CarConfigForm = ({
  onConfigChange,
  disabled = false,
}: CarConfigFormProps) => {
  const [config, setConfig] = useState<CarConfig>({
    downforce: 50,
    gearBias: 50,
    tyres: 'medium',
    drivingStyle: 50,
    tacticalAbility: 50,
  });

  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Car Configuration</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Downforce: {config.downforce}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={config.downforce}
            onChange={(e) =>
              setConfig({ ...config, downforce: parseInt(e.target.value) })
            }
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Affects grip and cornering speed
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Gear Bias: {config.gearBias}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={config.gearBias}
            onChange={(e) =>
              setConfig({ ...config, gearBias: parseInt(e.target.value) })
            }
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Affects acceleration curve and max speed
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tyres</label>
          <select
            value={config.tyres}
            onChange={(e) =>
              setConfig({
                ...config,
                tyres: e.target.value as 'soft' | 'medium' | 'hard',
              })
            }
            disabled={disabled}
            className="w-full p-2 border rounded"
          >
            <option value="soft">Soft (More grip, less durable)</option>
            <option value="medium">Medium (Balanced)</option>
            <option value="hard">Hard (Less grip, more durable)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Driving Style: {config.drivingStyle}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={config.drivingStyle}
            onChange={(e) =>
              setConfig({ ...config, drivingStyle: parseInt(e.target.value) })
            }
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Affects boost power and stability
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Tactical Ability: {config.tacticalAbility}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={config.tacticalAbility}
            onChange={(e) =>
              setConfig({ ...config, tacticalAbility: parseInt(e.target.value) })
            }
            disabled={disabled}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
