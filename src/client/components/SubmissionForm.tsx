import { useState } from 'react';
import type { DriverSubmission } from '../../shared/types';

type SubmissionFormProps = {
  onSubmit: (submission: {
    carSetup: DriverSubmission['carSetup'];
    strategy: DriverSubmission['strategy'];
  }) => Promise<void>;
  disabled?: boolean;
  sessionType: string;
  onSetupChange?: (setup: DriverSubmission['carSetup']) => void;
};

export const SubmissionForm = ({
  onSubmit,
  disabled = false,
  sessionType,
  onSetupChange,
}: SubmissionFormProps) => {
  const [carSetup, setCarSetup] = useState({
    downforce: 50,
    suspension: 50,
    gearRatio: 50,
    tirePressure: 50,
    brakeBias: 50,
  });

  const [strategy, setStrategy] = useState({
    fuelLoad: 50,
    tireCompound: 'medium' as 'soft' | 'medium' | 'hard',
    pitStrategy: 'no-pit' as 'no-pit' | 'one-stop' | 'two-stop',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit({ carSetup, strategy });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Car Setup</h3>
        <div className="space-y-4">
          {Object.entries(carSetup).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}: {value}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => {
                  const newSetup = { ...carSetup, [key]: parseInt(e.target.value) };
                  setCarSetup(newSetup);
                  onSetupChange?.(newSetup);
                }}
                disabled={disabled || loading}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Race Strategy</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Fuel Load: {strategy.fuelLoad}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={strategy.fuelLoad}
              onChange={(e) =>
                setStrategy({ ...strategy, fuelLoad: parseInt(e.target.value) })
              }
              disabled={disabled || loading}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tire Compound</label>
            <select
              value={strategy.tireCompound}
              onChange={(e) =>
                setStrategy({
                  ...strategy,
                  tireCompound: e.target.value as 'soft' | 'medium' | 'hard',
                })
              }
              disabled={disabled || loading}
              className="w-full p-2 border rounded"
            >
              <option value="soft">Soft</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Pit Strategy</label>
            <select
              value={strategy.pitStrategy}
              onChange={(e) =>
                setStrategy({
                  ...strategy,
                  pitStrategy: e.target.value as 'no-pit' | 'one-stop' | 'two-stop',
                })
              }
              disabled={disabled || loading}
              className="w-full p-2 border rounded"
            >
              <option value="no-pit">No Pit</option>
              <option value="one-stop">One Stop</option>
              <option value="two-stop">Two Stop</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <button
        type="submit"
        disabled={disabled || loading}
        className="w-full bg-[#d93900] text-white py-3 px-6 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Submitting...' : `Submit ${sessionType}`}
      </button>
    </form>
  );
};
