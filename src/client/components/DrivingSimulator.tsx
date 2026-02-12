import { useState, useEffect, useRef, useCallback } from 'react';
import type { CarSetup, TrackConfig, DailyModifier } from '../../shared/types';

type DrivingSimulatorProps = {
  carSetup: CarSetup;
  trackConfig: TrackConfig;
  modifier: DailyModifier;
  onLapComplete: (lapTime: number) => void;
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

export const DrivingSimulator = ({
  carSetup,
  trackConfig,
  modifier,
  onLapComplete,
  disabled = false,
}: DrivingSimulatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const startTimeRef = useRef<number | null>(null);
  const lapStartTimeRef = useRef<number | null>(null);

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
  const [checkpointProgress, setCheckpointProgress] = useState(0);

  // Track layout (circular track for simplicity)
  const trackRadius = 200;
  const trackCenterX = 400;
  const trackCenterY = 300;

  // Calculate performance modifiers from car setup
  const getPerformanceModifier = useCallback(() => {
    const downforceMod = (carSetup.downforce - 50) * 0.02; // -1 to +1
    const suspensionMod = (carSetup.suspension - 50) * 0.015;
    const gearRatioMod = (carSetup.gearRatio - 50) * 0.01;
    
    const modifierEffects: Record<DailyModifier, number> = {
      RAIN: -0.3,
      DIRTY_AIR: -0.1,
      HIGH_TYRE_WEAR: -0.15,
      SAFETY_CAR: -0.05,
      LOW_GRIP: -0.2,
    };

    return 1 + downforceMod + suspensionMod + gearRatioMod + modifierEffects[modifier];
  }, [carSetup, modifier]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
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
  }, [disabled]);

  // Game loop
  useEffect(() => {
    if (!canvasRef.current || disabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const performanceMod = getPerformanceModifier();
    const maxSpeed = 200 * performanceMod;
    const acceleration = 5 * performanceMod;
    const deceleration = 8;
    const turnSpeed = 0.05 * (1 + (carSetup.suspension - 50) * 0.01);

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

        // Check if car is on track (simple circular track check)
        const distFromCenter = Math.sqrt(
          Math.pow(newX - trackCenterX, 2) + Math.pow(newY - trackCenterY, 2)
        );
        const onTrack = distFromCenter > trackRadius - 30 && distFromCenter < trackRadius + 30;

        // Slow down if off track
        if (!onTrack) {
          newSpeed *= 0.8;
        }

        // Update checkpoint progress (simple circular progress)
        const angle = Math.atan2(newY - trackCenterY, newX - trackCenterX);
        const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
        setCheckpointProgress(normalizedAngle);

        // Check for lap completion (full circle)
        if (lapStartTimeRef.current && normalizedAngle > 0.95 && prev.speed > 10) {
          const currentTime = Date.now();
          const completedLapTime = (currentTime - lapStartTimeRef.current) / 1000;
          onLapComplete(completedLapTime);
          lapStartTimeRef.current = currentTime;
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

      // Draw UI overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 200, 120);

      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.fillText(`Speed: ${Math.round(carState.speed)} km/h`, 20, 35);
      ctx.fillText(`Lap Time: ${lapTime.toFixed(2)}s`, 20, 55);
      ctx.fillText(`Progress: ${Math.round(checkpointProgress * 100)}%`, 20, 75);
      ctx.fillText(`Modifier: ${modifier}`, 20, 95);
      ctx.fillText(
        `Controls: ↑/W=Gas ↓/S=Brake ←→/A/D=Steer`,
        20,
        115
      );
    };

    const gameLoop = () => {
      updateCar();
      draw();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    if (isDriving) {
      gameLoop();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [carState, isDriving, lapTime, checkpointProgress, modifier, getPerformanceModifier, disabled, onLapComplete]);

  // Update lap time
  useEffect(() => {
    if (!isDriving || !lapStartTimeRef.current) return;

    const interval = setInterval(() => {
      if (lapStartTimeRef.current) {
        setLapTime((Date.now() - lapStartTimeRef.current) / 1000);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [isDriving]);

  const startDriving = () => {
    setIsDriving(true);
    lapStartTimeRef.current = Date.now();
    startTimeRef.current = Date.now();
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
    setLapTime(0);
    setCheckpointProgress(0);
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
              Start Driving
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
              Use arrow keys or WASD to drive. Complete a full lap to record your time!
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
        </div>
      )}
    </div>
  );
};
