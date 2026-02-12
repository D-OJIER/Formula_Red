import { useState, useEffect, useRef, useCallback } from 'react';
import type { CarConfig, TrackConfig } from '../../shared/types';
import { getTrackPath } from '../utils/trackPathGenerator';

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
  const lapTimesRef = useRef<number[]>([]); // Track lap times in ref to avoid stale closures

  const [carStartPosition, setCarStartPosition] = useState<{ x: number; y: number; angle: number }>({ x: 400, y: 300, angle: 0 });
  
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
  const [activeCheckpointIndex, setActiveCheckpointIndex] = useState<number>(0);
  const [trackPath, setTrackPath] = useState<{ points: Array<{ x: number; y: number; angle: number }>; checkpoints: Array<{ x: number; y: number; angle: number }> } | null>(null);

  // Generate track path based on track config
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const path = getTrackPath(trackConfig, canvas.width, canvas.height);
    setTrackPath(path);
    
    // Set car starting position to first checkpoint or first track point
    if (path.checkpoints.length > 0) {
      const start = path.checkpoints[0];
      if (start) {
        setCarStartPosition({ x: start.x, y: start.y, angle: start.angle });
      }
    } else if (path.points.length > 0) {
      const start = path.points[0];
      if (start) {
        setCarStartPosition({ x: start.x, y: start.y, angle: start.angle });
      }
    }
    
    // Initialize checkpoints from track path
    const newCheckpoints: Checkpoint[] = path.checkpoints.map((cp, i) => ({
      id: i,
      x: cp.x,
      y: cp.y,
      passed: false,
      time: null,
    }));
    
    setCheckpoints(newCheckpoints);
    setActiveCheckpointIndex(0); // Reset to first checkpoint
    
    // Reset car position to start
    setCarState({
      x: carStartPosition.x,
      y: carStartPosition.y,
      angle: carStartPosition.angle,
      speed: 0,
      throttle: 0,
      brake: 0,
      steering: 0,
    });
  }, [trackConfig]);

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
        const maxReverseSpeed = 80 * performanceMod * (trackConfig.surfaceGrip / 100); // Slower reverse
        const acceleration = 5 * performanceMod;
        const deceleration = 8;
        const reverseAcceleration = 3 * performanceMod; // Slower reverse acceleration
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

        // Apply throttle/brake/reverse
        if (throttle > 0) {
          // Forward acceleration
          if (newSpeed < 0) {
            // If moving backward, brake first
            newSpeed = Math.min(newSpeed + deceleration, 0);
          } else {
            // Normal forward acceleration
            newSpeed = Math.min(newSpeed + acceleration, maxSpeed);
          }
        } else if (brake > 0) {
          // Brake or reverse
          if (newSpeed > 0) {
            // Braking while moving forward
            newSpeed = Math.max(newSpeed - deceleration, 0);
          } else {
            // Reverse acceleration (when stopped or moving backward)
            newSpeed = Math.max(newSpeed - reverseAcceleration, -maxReverseSpeed);
          }
        } else {
          // Natural deceleration
          if (newSpeed > 0) {
            newSpeed = Math.max(newSpeed - 0.5, 0);
          } else if (newSpeed < 0) {
            newSpeed = Math.min(newSpeed + 0.5, 0);
          }
        }

        // Apply steering (only when moving, works in reverse too)
        if (Math.abs(newSpeed) > 5) {
          const speedRatio = Math.abs(newSpeed) / maxSpeed;
          // Reverse steering is slightly less responsive
          const reverseMultiplier = newSpeed < 0 ? 0.7 : 1;
          newAngle += steering * turnSpeed * speedRatio * reverseMultiplier;
        }

        // Update position based on speed and angle
        let newX = prev.x + Math.cos(newAngle) * (newSpeed * 0.1);
        let newY = prev.y + Math.sin(newAngle) * (newSpeed * 0.1);

        // Boundary checks - keep car within canvas (accounting for car size ~15px radius)
        const carRadius = 15;
        const canvasWidth = 800; // Canvas width from canvas element
        const canvasHeight = 600; // Canvas height from canvas element
        
        // Clamp X position
        const clampedX = Math.max(carRadius, Math.min(canvasWidth - carRadius, newX));
        
        // Clamp Y position
        const clampedY = Math.max(carRadius, Math.min(canvasHeight - carRadius, newY));
        
        // If car hits boundary, slow down significantly
        if (clampedX !== newX || clampedY !== newY) {
          newSpeed *= 0.3; // Slow down significantly when hitting boundary
        }
        
        // Use clamped positions
        newX = clampedX;
        newY = clampedY;

        // Check checkpoints - only check the active checkpoint
        setCheckpoints((prevCheckpoints) => {
          if (activeCheckpointIndex >= prevCheckpoints.length) {
            return prevCheckpoints; // All checkpoints passed
          }
          
          const activeCheckpoint = prevCheckpoints[activeCheckpointIndex];
          if (activeCheckpoint && !activeCheckpoint.passed) {
            const dist = Math.sqrt(
              Math.pow(newX - activeCheckpoint.x, 2) + Math.pow(newY - activeCheckpoint.y, 2)
            );
            
            if (dist < 30) {
              const currentTime = Date.now();
              const checkpointTime = lapStartTimeRef.current
                ? (currentTime - lapStartTimeRef.current) / 1000
                : 0;
              
              checkpointTimesRef.current.push(checkpointTime);
              
              // Mark this checkpoint as passed and activate the next one
              const updated = prevCheckpoints.map((cp, idx) => {
                if (idx === activeCheckpointIndex) {
                  return {
                    ...cp,
                    passed: true,
                    time: checkpointTime,
                  };
                }
                return cp;
              });
              
              // Activate next checkpoint
              if (activeCheckpointIndex < prevCheckpoints.length - 1) {
                setActiveCheckpointIndex(activeCheckpointIndex + 1);
              }
              
              return updated;
            }
          }
          
          return prevCheckpoints;
        });

        // Check if car is on track (simplified check - distance to nearest track point)
        let onTrack = false;
        if (trackPath && trackPath.points.length > 0) {
          let minDist = Infinity;
          for (const point of trackPath.points) {
            const dist = Math.sqrt(Math.pow(newX - point.x, 2) + Math.pow(newY - point.y, 2));
            minDist = Math.min(minDist, dist);
          }
          // Track width from config (scaled to pixels, ~30-50px)
          const trackWidthPixels = (trackConfig.width / 10) * 3;
          onTrack = minDist < trackWidthPixels;
        }

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

        // Check for lap completion (all checkpoints passed - check if active index is beyond last checkpoint)
        const allCheckpointsPassed = activeCheckpointIndex >= checkpoints.length || checkpoints.every((cp) => cp.passed);
        let raceComplete = false;
        
        if (allCheckpointsPassed && lapStartTimeRef.current && prev.speed > 10) {
          const currentTime = Date.now();
          const completedLapTime = (currentTime - lapStartTimeRef.current) / 1000;
          
          // Validate lap time before adding
          if (completedLapTime > 0 && completedLapTime < 1000) {
            // Update lap times in both state and ref
            lapTimesRef.current.push(completedLapTime);
            setLapTimes([...lapTimesRef.current]);
            
            // Update best lap time in practice mode
            if (mode === 'practice') {
              if (bestLapTime === null || completedLapTime < bestLapTime) {
                setBestLapTime(completedLapTime);
              }
            }
            
            // Check if race is complete (all required laps done)
            const newLapNumber = currentLap + 1;
            raceComplete = mode === 'official' && newLapNumber >= lapsRequired;
            
            if (raceComplete && raceStartTimeRef.current) {
              // Race is complete - calculate total time
              const totalTime = (currentTime - raceStartTimeRef.current) / 1000;
              setTotalRaceTime(totalTime);
              
              // Generate replay hash
              const replayHash = generateReplayHash(replayDataRef.current);
              
              // Call onRaceComplete with all lap times (use ref to get latest values)
              setTimeout(() => {
                if (onRaceComplete) {
                  const allLapTimes = [...lapTimesRef.current]; // Use ref for latest values
                  
                  // Validate lap times
                  const validLapTimes = allLapTimes.filter(lt => lt > 0 && lt < 1000);
                  
                  if (validLapTimes.length === 0) {
                    console.error('No valid lap times found!', allLapTimes);
                    return;
                  }
                  
                  // Use checkpoint times from final lap, ensure we have at least one
                  const finalCheckpointTimes = checkpointTimesRef.current.length > 0 
                    ? [...checkpointTimesRef.current] 
                    : [completedLapTime * 0.5, completedLapTime]; // Fallback if no checkpoints
                  
                  onRaceComplete(totalTime, validLapTimes, finalCheckpointTimes, replayHash);
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
              setActiveCheckpointIndex(0); // Reset to first checkpoint
              setCurrentLap(newLapNumber);
            }
          } else {
            console.warn('Invalid lap time detected:', completedLapTime);
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

      // Draw track path
      if (trackPath && trackPath.points.length > 0) {
        const trackWidthPixels = (trackConfig.width / 10) * 3; // Scale track width to pixels
        
        // Draw track outer edge (grass/barrier)
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = trackWidthPixels + 20;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        trackPath.points.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        // Close the loop
        if (trackPath.points.length > 0 && trackPath.points[0]) {
          ctx.lineTo(trackPath.points[0].x, trackPath.points[0].y);
        }
        ctx.stroke();

        // Draw track surface
        ctx.strokeStyle = '#444';
        ctx.lineWidth = trackWidthPixels;
        ctx.beginPath();
        trackPath.points.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        // Close the loop
        if (trackPath.points.length > 0 && trackPath.points[0]) {
          ctx.lineTo(trackPath.points[0].x, trackPath.points[0].y);
        }
        ctx.stroke();

        // Draw center line
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        trackPath.points.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        // Close the loop
        if (trackPath.points.length > 0 && trackPath.points[0]) {
          ctx.lineTo(trackPath.points[0].x, trackPath.points[0].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Fallback: draw simple circle if track path not ready
        const trackCenterX = canvas.width / 2;
        const trackCenterY = canvas.height / 2;
        const trackRadius = 200;
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 60;
        ctx.beginPath();
        ctx.arc(trackCenterX, trackCenterY, trackRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#444';
        ctx.lineWidth = 50;
        ctx.beginPath();
        ctx.arc(trackCenterX, trackCenterY, trackRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw checkpoints - only show the active checkpoint
      checkpoints.forEach((checkpoint, index) => {
        // Only show if it's the active checkpoint or if it's been passed
        if (index === activeCheckpointIndex || checkpoint.passed) {
          ctx.fillStyle = checkpoint.passed ? '#00ff00' : '#ffff00';
          ctx.beginPath();
          ctx.arc(checkpoint.x, checkpoint.y, 15, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw a pulsing effect for active checkpoint
          if (!checkpoint.passed && index === activeCheckpointIndex) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(checkpoint.x, checkpoint.y, 20 + Math.sin(Date.now() / 200) * 5, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });

      // Track markings are now drawn above as part of the track path

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
      const speedRatio = maxSpeed > 0 ? Math.abs(car.speed) / maxSpeed : 0;
      ctx.fillStyle = speedRatio > 0.8 ? '#00ff00' : '#ffff00';
      ctx.fillRect(-12, -10, speedRatio * 24, 2);

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
      ctx.fillStyle = carState.speed < 0 ? '#ff6b6b' : '#ffd700';
      const speedDisplay = carState.speed < 0 ? `R ${Math.round(Math.abs(carState.speed))}` : `${Math.round(carState.speed)}`;
      ctx.fillText(`Speed: ${speedDisplay} km/h`, 20, 55);
      
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
  }, [carState, isDriving, lapTime, checkpoints, currentLap, bestLapTime, lapTimes, totalRaceTime, mode, lapsRequired, getPerformanceModifier, trackConfig, generateReplayHash, onRaceComplete, trackPath, activeCheckpointIndex]);

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
    lapTimesRef.current = []; // Reset ref too
    setCheckpoints((prev) => prev.map((cp) => ({ ...cp, passed: false, time: null })));
    setActiveCheckpointIndex(0); // Reset to first checkpoint
    setLapTime(0);
    setCurrentLap(0);
    setLapTimes([]);
    setTotalRaceTime(0);
    // Reset car to start position
    setCarState({
      x: carStartPosition.x,
      y: carStartPosition.y,
      angle: carStartPosition.angle,
      speed: 0,
      throttle: 0,
      brake: 0,
      steering: 0,
    });
  };

  const resetPractice = () => {
    if (mode === 'practice') {
      setIsDriving(false);
      setCarState({
        x: carStartPosition.x,
        y: carStartPosition.y,
        angle: carStartPosition.angle,
        speed: 0,
        throttle: 0,
        brake: 0,
        steering: 0,
      });
      lapStartTimeRef.current = null;
      raceStartTimeRef.current = null;
      checkpointTimesRef.current = [];
      replayDataRef.current = [];
      lapTimesRef.current = [];
      setCheckpoints((prev) => prev.map((cp) => ({ ...cp, passed: false, time: null })));
      setActiveCheckpointIndex(0);
      setLapTime(0);
      setCurrentLap(0);
      setLapTimes([]);
      setTotalRaceTime(0);
      setBestLapTime(null);
    }
  };

  const stopDriving = () => {
    setIsDriving(false);
    setCarState({
      x: carStartPosition.x,
      y: carStartPosition.y,
      angle: carStartPosition.angle,
      speed: 0,
      throttle: 0,
      brake: 0,
      steering: 0,
    });
    lapStartTimeRef.current = null;
    raceStartTimeRef.current = null;
    lapTimesRef.current = []; // Reset ref too
    setLapTime(0);
    setCurrentLap(0);
    setLapTimes([]);
    setTotalRaceTime(0);
    checkpointTimesRef.current = [];
    replayDataRef.current = [];
    setCheckpoints((prev) => prev.map((cp) => ({ ...cp, passed: false, time: null })));
    setActiveCheckpointIndex(0);
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
          {mode === 'practice' && (
            <button
              onClick={resetPractice}
              className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700"
            >
              Reset
            </button>
          )}
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
            <li>↓ or S - Brake / Reverse (hold while stopped to reverse)</li>
            <li>← → or A D - Steer</li>
          </ul>
          {mode === 'practice' && (
            <>
              <p className="text-sm text-gray-600 mt-2">
                Practice mode allows unlimited laps. Your best time is tracked locally.
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Use the Reset button to restart your practice session.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
