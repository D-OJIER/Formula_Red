import { useState, useEffect, useRef, useCallback } from 'react';
import type { CarConfig, TrackConfig } from '../../shared/types';

type DrivingSimulatorProps = {
  carConfig: CarConfig;
  trackConfig: TrackConfig;
  mode: 'practice' | 'official';
  lapsRequired?: number;
  onRaceComplete?: (totalTime: number, lapTimes: number[], checkpointTimes: number[], replayHash: string) => void;
  disabled?: boolean;
};

type CarState = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  throttle: number;
  brake: number;
  steering: number;
};

type Checkpoint = {
  id: number;
  x: number;
  y: number;
  passed: boolean;
  time: number | null;
};

export const DrivingSimulator = ({
  carConfig,
  trackConfig,
  mode,
  lapsRequired = 3,
  onRaceComplete,
  disabled = false,
}: DrivingSimulatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const lapStartTimeRef = useRef<number | null>(null);
  const raceStartTimeRef = useRef<number | null>(null);
  const checkpointTimesRef = useRef<number[]>([]);
  const replayDataRef = useRef<Array<{ time: number; x: number; y: number; speed: number }>>([]);

  const [carState, setCarState] = useState<CarState>({
    x: 400,
    y: 300,
    angle: 0,
    speed: 0,
    throttle: 0,
    brake: 0,
    steering: 0,
  });

  const [lapTime, setLapTime] = useState<number>(0);
  const [isDriving, setIsDriving] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [currentLap, setCurrentLap] = useState(0);
  const [bestLapTime, setBestLapTime] = useState<number | null>(null);
  const [lapTimes, setLapTimes] = useState<number[]>([]);
  const [raceStartTime, setRaceStartTime] = useState<number | null>(null);
  const [totalRaceTime, setTotalRaceTime] = useState<number>(0);

  // Track layout (circular track for simplicity)
  const trackRadius = 200;
  const trackCenterX = 400;
  const trackCenterY = 300;

  // Initialize checkpoints around the track
  useEffect(() => {
    const numCheckpoints = Math.max(4, Math.floor(trackConfig.cornerDensity / 20));
    const newCheckpoints: Checkpoint[] = [];
    
    for (let i = 0; i < numCheckpoints; i++) {
      const angle = (i / numCheckpoints) * Math.PI * 2;
      newCheckpoints.push({
        id: i,
        x: trackCenterX + Math.cos(angle) * trackRadius,
        y: trackCenterY + Math.sin(angle) * trackRadius,
        passed: false,
        time: null,
      });
    }
    
    setCheckpoints(newCheckpoints);
  }, [trackConfig.cornerDensity]);

  // Calculate performance modifiers from car config
  const getPerformanceModifier = useCallback(() => {
    const downforceMod = (carConfig.downforce - 50) * 0.02; // -1 to +1
    const gearBiasMod = (carConfig.gearBias - 50) * 0.015;
    const drivingStyleMod = (carConfig.drivingStyle - 50) * 0.01;
    
    const tyreMods: Record<string, number> = {
      soft: 0.05, // More grip
      medium: 0,
      hard: -0.03, // Less grip but more durable
    };

    return 1 + downforceMod + gearBiasMod + drivingStyleMod + (tyreMods[carConfig.tyres] || 0);
  }, [carConfig]);

  // Generate replay hash
  const generateReplayHash = useCallback((replayData: Array<{ time: number; x: number; y: number; speed: number }>): string => {
    // Simple hash function (in production, use crypto.subtle.digest)
    const dataString = JSON.stringify(replayData);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || !isDriving) return;
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [disabled, isDriving]);

  // Game loop
  useEffect(() => {
    if (!canvasRef.current || disabled || !isDriving) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const performanceMod = getPerformanceModifier();
    const maxSpeed = 200 * performanceMod * (trackConfig.surfaceGrip / 100);
    const acceleration = 5 * performanceMod;
    const deceleration = 8;
    const turnSpeed = 0.05 * (1 + (carConfig.downforce - 50) * 0.01);

    const updateCar = () => {
      setCarState((prev) => {
        const keys = keysRef.current;
        let throttle = 0;
        let brake = 0;
        let steering = 0;

        // Controls: Arrow keys or WASD
        if (keys.has('arrowup') || keys.has('w')) throttle = 1;
        if (keys.has('arrowdown') || keys.has('s')) brake = 1;
        if (keys.has('arrowleft') || keys.has('a')) steering = -1;
        if (keys.has('arrowright') || keys.has('d')) steering = 1;

        let newSpeed = prev.speed;
        let newAngle = prev.angle;

        // Apply throttle/brake
        if (throttle > 0 && newSpeed < maxSpeed) {
          newSpeed = Math.min(newSpeed + acceleration, maxSpeed);
        } else if (brake > 0) {
          newSpeed = Math.max(newSpeed - deceleration, 0);
        } else {
          // Natural deceleration
          newSpeed = Math.max(newSpeed - 0.5, 0);
        }

        // Apply steering (only when moving)
        if (Math.abs(newSpeed) > 5) {
          newAngle += steering * turnSpeed * (newSpeed / maxSpeed);
        }

        // Update position based on speed and angle
        const newX = prev.x + Math.cos(newAngle) * (newSpeed * 0.1);
        const newY = prev.y + Math.sin(newAngle) * (newSpeed * 0.1);

        // Check checkpoints
        setCheckpoints((prevCheckpoints) => {
          const updated = prevCheckpoints.map((checkpoint) => {
            if (checkpoint.passed) return checkpoint;
            
            const dist = Math.sqrt(
              Math.pow(newX - checkpoint.x, 2) + Math.pow(newY - checkpoint.y, 2)
            );
            
            if (dist < 30) {
              const currentTime = Date.now();
              const checkpointTime = lapStartTimeRef.current
                ? (currentTime - lapStartTimeRef.current) / 1000
                : 0;
              
              checkpointTimesRef.current.push(checkpointTime);
              
              return {
                ...checkpoint,
                passed: true,
                time: checkpointTime,
              };
            }
            
            return checkpoint;
          });
          
          return updated;
        });

        // Check if car is on track
        const distFromCenter = Math.sqrt(
          Math.pow(newX - trackCenterX, 2) + Math.pow(newY - trackCenterY, 2)
        );
        const onTrack = distFromCenter > trackRadius - 30 && distFromCenter < trackRadius + 30;

        // Slow down if off track
        if (!onTrack) {
          newSpeed *= 0.8;
        }

        // Record replay data
        if (lapStartTimeRef.current) {
          const currentTime = Date.now();
          const replayTime = (currentTime - lapStartTimeRef.current) / 1000;
          replayDataRef.current.push({
            time: replayTime,
            x: newX,
            y: newY,
            speed: newSpeed,
          });
        }

        // Check for lap completion (all checkpoints passed)
        const allCheckpointsPassed = checkpoints.every((cp) => cp.passed);
        if (allCheckpointsPassed && lapStartTimeRef.current && prev.speed > 10) {
          const currentTime = Date.now();
          const completedLapTime = (currentTime - lapStartTimeRef.current) / 1000;
          
          // Update lap times
          setLapTimes((prev) => [...prev, completedLapTime]);
          
          // Update best lap time in practice mode
          if (mode === 'practice') {
            if (bestLapTime === null || completedLapTime < bestLapTime) {
              setBestLapTime(completedLapTime);
            }
          }
          
          // Check if race is complete (all required laps done)
          const newLapNumber = currentLap + 1;
          const raceComplete = mode === 'official' && newLapNumber >= lapsRequired;
          
          if (raceComplete && raceStartTimeRef.current) {
            // Race is complete - calculate total time
            const totalTime = (currentTime - raceStartTimeRef.current) / 1000;
            setTotalRaceTime(totalTime);
            
            // Generate replay hash
            const replayHash = generateReplayHash(replayDataRef.current);
            
            // Call onRaceComplete with all lap times (async, don't block)
            setTimeout(() => {
              if (onRaceComplete) {
                const allLapTimes = [...lapTimes, completedLapTime];
                // Use checkpoint times from final lap
                onRaceComplete(totalTime, allLapTimes, [...checkpointTimesRef.current], replayHash);
              }
              setIsDriving(false);
            }, 100);
          }
          
          // Reset for next lap (or continue if race not complete)
          if (!raceComplete) {
            lapStartTimeRef.current = currentTime;
            checkpointTimesRef.current = [];
            replayDataRef.current = [];
            setCheckpoints((prev) => prev.map((cp) => ({ ...cp, passed: false, time: null })));
            setCurrentLap(newLapNumber);
          }
        }

        return {
          x: newX,
          y: newY,
          angle: newAngle,
          speed: newSpeed,
          throttle,
          brake,
          steering,
        };
      });
    };

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw track
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 60;
      ctx.beginPath();
      ctx.arc(trackCenterX, trackCenterY, trackRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw track surface
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 50;
      ctx.beginPath();
      ctx.arc(trackCenterX, trackCenterY, trackRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw checkpoints
      checkpoints.forEach((checkpoint) => {
        ctx.fillStyle = checkpoint.passed ? '#00ff00' : '#ffff00';
        ctx.beginPath();
        ctx.arc(checkpoint.x, checkpoint.y, 15, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw track markings
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.arc(trackCenterX, trackCenterY, trackRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw car
      const car = carState;
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      // Car body
      ctx.fillStyle = '#d93900';
      ctx.fillRect(-15, -8, 30, 16);

      // Car details
      ctx.fillStyle = '#000';
      ctx.fillRect(-10, -6, 20, 12);

      // Speed indicator
      ctx.fillStyle = car.speed > maxSpeed * 0.8 ? '#00ff00' : '#ffff00';
      ctx.fillRect(-12, -10, (car.speed / maxSpeed) * 24, 2);

      ctx.restore();

      // Draw UI overlay with gradient background
      const gradient = ctx.createLinearGradient(10, 10, 10, mode === 'practice' ? 200 : 220);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
      ctx.fillStyle = gradient;
      ctx.fillRect(10, 10, 280, mode === 'practice' ? 200 : 220);
      
      // Border
      ctx.strokeStyle = mode === 'official' ? '#d93900' : '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 280, mode === 'practice' ? 200 : 220);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`${mode === 'practice' ? '🏎️ PRACTICE' : '🏁 OFFICIAL RACE'}`, 20, 35);
      
      ctx.font = '14px monospace';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`Speed: ${Math.round(carState.speed)} km/h`, 20, 55);
      
      ctx.fillStyle = '#fff';
      ctx.fillText(`Lap Time: ${lapTime.toFixed(2)}s`, 20, 75);
      
      if (mode === 'official') {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText(`Lap: ${currentLap + 1} / ${lapsRequired}`, 20, 95);
        ctx.fillStyle = '#4ecdc4';
        if (raceStartTimeRef.current) {
          const elapsed = (Date.now() - raceStartTimeRef.current) / 1000;
          ctx.fillText(`Race Time: ${elapsed.toFixed(2)}s`, 20, 115);
        }
        if (lapTimes.length > 0) {
          ctx.fillStyle = '#95e1d3';
          ctx.fillText(`Lap Times: ${lapTimes.map(t => t.toFixed(2)).join(', ')}`, 20, 135);
        }
      } else {
        ctx.fillStyle = '#fff';
        ctx.fillText(`Lap: ${currentLap + 1}`, 20, 95);
        if (bestLapTime !== null) {
          ctx.fillStyle = '#ffd700';
          ctx.fillText(`Best: ${bestLapTime.toFixed(2)}s`, 20, 115);
        }
      }
      
      ctx.fillStyle = '#a0a0a0';
      ctx.fillText(`Checkpoints: ${checkpoints.filter((cp) => cp.passed).length}/${checkpoints.length}`, 20, mode === 'practice' ? 135 : 155);
      
      ctx.font = '11px monospace';
      ctx.fillStyle = '#888';
      ctx.fillText(
        `↑/W=Gas ↓/S=Brake ←→/A/D=Steer`,
        20,
        mode === 'practice' ? 155 : 175
      );
      
      // Progress bar for official race
      if (mode === 'official') {
        const progress = Math.min(currentLap / lapsRequired, 1);
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 185, 260, 8);
        ctx.fillStyle = progress >= 1 ? '#00ff00' : '#d93900';
        ctx.fillRect(20, 185, 260 * progress, 8);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(20, 185, 260, 8);
      }
    };

    const gameLoop = () => {
      updateCar();
      draw();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [carState, isDriving, lapTime, checkpoints, currentLap, bestLapTime, mode, getPerformanceModifier, trackConfig, generateReplayHash, onLapComplete]);

  // Update lap time
  useEffect(() => {
    if (!isDriving || !lapStartTimeRef.current) return;

    const interval = setInterval(() => {
      if (lapStartTimeRef.current) {
        setLapTime((Date.now() - lapStartTimeRef.current) / 1000);
      }
      if (raceStartTimeRef.current && mode === 'official') {
        setTotalRaceTime((Date.now() - raceStartTimeRef.current) / 1000);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [isDriving, mode]);

  const startDriving = () => {
    setIsDriving(true);
    const now = Date.now();
    lapStartTimeRef.current = now;
    raceStartTimeRef.current = now;
    checkpointTimesRef.current = [];
    replayDataRef.current = [];
    setCheckpoints((prev) => prev.map((cp) => ({ ...cp, passed: false, time: null })));
    setLapTime(0);
    setCurrentLap(0);
    setLapTimes([]);
    setTotalRaceTime(0);
  };

  const stopDriving = () => {
    setIsDriving(false);
    setCarState({
      x: 400,
      y: 300,
      angle: 0,
      speed: 0,
      throttle: 0,
      brake: 0,
      steering: 0,
    });
    lapStartTimeRef.current = null;
    raceStartTimeRef.current = null;
    setLapTime(0);
    setCurrentLap(0);
    setLapTimes([]);
    setTotalRaceTime(0);
    checkpointTimesRef.current = [];
    replayDataRef.current = [];
    setCheckpoints((prev) => prev.map((cp) => ({ ...cp, passed: false, time: null })));
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-auto"
        />
        {!isDriving && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <button
              onClick={startDriving}
              disabled={disabled}
              className="bg-[#d93900] text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-[#b83000] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start {mode === 'practice' ? 'Practice' : 'Race'}
            </button>
          </div>
        )}
      </div>

      {isDriving && (
        <div className="flex gap-4">
          <button
            onClick={stopDriving}
            className="bg-red-600 text-white px-6 py-2 rounded font-semibold hover:bg-red-700"
          >
            Stop
          </button>
          <div className="flex-1 bg-gray-100 p-3 rounded">
            <div className="text-sm text-gray-600">
              {mode === 'practice' 
                ? 'Practice mode: Unlimited laps, times shown locally only.'
                : `Official race mode: Complete ${lapsRequired} laps to submit your time! (Lap ${currentLap + 1}/${lapsRequired})`}
            </div>
          </div>
        </div>
      )}

      {!isDriving && (
        <div className="bg-blue-50 p-4 rounded">
          <h4 className="font-semibold mb-2">Controls:</h4>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>↑ or W - Accelerate</li>
            <li>↓ or S - Brake</li>
            <li>← → or A D - Steer</li>
          </ul>
          {mode === 'practice' && (
            <p className="text-sm text-gray-600 mt-2">
              Practice mode allows unlimited laps. Your best time is tracked locally.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
