import { useEffect } from 'react';
import type { CarConfig } from '../../shared/types';

type CarConfigFormProps = {
  config: CarConfig;
  onConfigChange: (config: CarConfig) => void;
  disabled?: boolean;
};

export const CarConfigForm = ({
  config,
  onConfigChange,
  disabled = false,
}: CarConfigFormProps) => {
  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  const tyreColors = {
    soft: 'bg-red-100 border-red-400 text-red-800',
    medium: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    hard: 'bg-blue-100 border-blue-400 text-blue-800',
  };

  return (
    <div className="space-y-6 f1-card p-6">
      <div className="f1-card-header mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          🏎️ Car Configuration
        </h3>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-gray-800 uppercase tracking-wide">
              Downforce
            </label>
            <span className="f1-badge">{config.downforce}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.downforce}
            onChange={(e) =>
              onConfigChange({ ...config, downforce: parseInt(e.target.value) })
            }
            disabled={disabled}
            className="f1-slider"
          />
          <p className="text-xs text-gray-600 mt-2 italic">
            Affects grip and cornering speed
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-gray-800 uppercase tracking-wide">
              Gear Bias
            </label>
            <span className="f1-badge">{config.gearBias}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.gearBias}
            onChange={(e) =>
              onConfigChange({ ...config, gearBias: parseInt(e.target.value) })
            }
            disabled={disabled}
            className="f1-slider"
          />
          <p className="text-xs text-gray-600 mt-2 italic">
            Affects acceleration curve and max speed
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">
            Tyres
          </label>
          <select
            value={config.tyres}
            onChange={(e) =>
              onConfigChange({
                ...config,
                tyres: e.target.value as 'soft' | 'medium' | 'hard',
              })
            }
            disabled={disabled}
            className={`f1-select w-full ${tyreColors[config.tyres]}`}
          >
            <option value="soft">🔴 Soft (More grip, less durable)</option>
            <option value="medium">🟡 Medium (Balanced)</option>
            <option value="hard">🔵 Hard (Less grip, more durable)</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-gray-800 uppercase tracking-wide">
              Driving Style
            </label>
            <span className="f1-badge">{config.drivingStyle}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.drivingStyle}
            onChange={(e) =>
              onConfigChange({ ...config, drivingStyle: parseInt(e.target.value) })
            }
            disabled={disabled}
            className="f1-slider"
          />
          <p className="text-xs text-gray-600 mt-2 italic">
            Affects boost power and stability
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-gray-800 uppercase tracking-wide">
              Tactical Ability
            </label>
            <span className="f1-badge">{config.tacticalAbility}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={config.tacticalAbility}
            onChange={(e) =>
              onConfigChange({ ...config, tacticalAbility: parseInt(e.target.value) })
            }
            disabled={disabled}
            className="f1-slider"
          />
          <p className="text-xs text-gray-600 mt-2 italic">
            Strategic decision making and race craft
          </p>
        </div>
      </div>
    </div>
  );
};
