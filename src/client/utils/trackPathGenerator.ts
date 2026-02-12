import type { TrackConfig } from '../../shared/types';

type TrackPoint = {
  x: number;
  y: number;
  angle: number; // Angle of the track at this point
};

type TrackPath = {
  points: TrackPoint[];
  checkpoints: { x: number; y: number; angle: number }[];
};

/**
 * Generate a deterministic track path based on track config
 * Uses trackId as seed to ensure same track for everyone on the same day
 */
export function generateTrackPath(trackConfig: TrackConfig, canvasWidth: number, canvasHeight: number): TrackPath {
  // Use trackId as seed for deterministic generation
  const seed = trackConfig.trackId;
  
  // Simple hash function for seeding
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Create a simple RNG from seed
  let rngState = Math.abs(hash);
  const random = () => {
    rngState = (rngState * 9301 + 49297) % 233280;
    return rngState / 233280;
  };
  
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  // Base radius based on track length (scaled to canvas)
  const baseRadius = Math.min(canvasWidth, canvasHeight) * 0.25 + (trackConfig.length / 1000) * 5;
  
  // Number of segments based on corner density
  const numSegments = Math.max(8, Math.floor(trackConfig.cornerDensity / 5));
  
  // Straight ratio affects how many segments are straight
  const straightSegments = Math.floor(numSegments * (trackConfig.straightRatio / 100));
  const cornerSegments = numSegments - straightSegments;
  
  const points: TrackPoint[] = [];
  const checkpoints: { x: number; y: number; angle: number }[] = [];
  
  // Generate track points
  let currentAngle = random() * Math.PI * 2; // Random starting angle
  let currentX = centerX;
  let currentY = centerY;
  
  for (let i = 0; i < numSegments; i++) {
    const isStraight = i < straightSegments || random() < (trackConfig.straightRatio / 100);
    
    let segmentLength: number;
    let angleChange: number;
    
    if (isStraight) {
      // Straight segment
      segmentLength = baseRadius * (0.8 + random() * 0.4);
      angleChange = (random() - 0.5) * 0.1; // Small random variation
    } else {
      // Corner segment
      const cornerSharpness = trackConfig.cornerDensity / 100; // 0.2 to 0.8
      segmentLength = baseRadius * (0.5 + random() * 0.3);
      angleChange = (random() - 0.5) * (Math.PI / 3) * cornerSharpness; // -60° to +60° scaled by density
    }
    
    // Apply elevation profile variation (affects radius slightly)
    const elevationIndex = Math.floor((i / numSegments) * trackConfig.elevationProfile.length);
    const elevation = trackConfig.elevationProfile[elevationIndex] || 0;
    const elevationFactor = 1 + (elevation / 100) * 0.1; // ±10% radius variation
    
    currentAngle += angleChange;
    const adjustedLength = segmentLength * elevationFactor;
    
    currentX += Math.cos(currentAngle) * adjustedLength;
    currentY += Math.sin(currentAngle) * adjustedLength;
    
    // Keep track within canvas bounds
    const margin = 50;
    currentX = Math.max(margin, Math.min(canvasWidth - margin, currentX));
    currentY = Math.max(margin, Math.min(canvasHeight - margin, currentY));
    
    points.push({
      x: currentX,
      y: currentY,
      angle: currentAngle,
    });
    
    // Add checkpoint every few segments
    if (i % Math.max(2, Math.floor(numSegments / Math.max(4, Math.floor(trackConfig.cornerDensity / 20)))) === 0) {
      checkpoints.push({
        x: currentX,
        y: currentY,
        angle: currentAngle,
      });
    }
  }
  
  // Close the track by connecting back to start
  if (points.length > 0) {
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    
    // Calculate angle to close the loop
    const closeAngle = Math.atan2(firstPoint.y - lastPoint.y, firstPoint.x - lastPoint.x);
    points.push({
      x: firstPoint.x,
      y: firstPoint.y,
      angle: closeAngle,
    });
  }
  
  // Ensure we have at least 4 checkpoints
  while (checkpoints.length < 4 && points.length > checkpoints.length) {
    const index = Math.floor((checkpoints.length / 4) * points.length);
    if (index < points.length) {
      checkpoints.push({
        x: points[index].x,
        y: points[index].y,
        angle: points[index].angle,
      });
    } else {
      break;
    }
  }
  
  return { points, checkpoints };
}

/**
 * Generate a simpler oval/elliptical track for high straight ratio
 */
export function generateOvalTrack(trackConfig: TrackConfig, canvasWidth: number, canvasHeight: number): TrackPath {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  // Base radius based on track length
  const baseRadius = Math.min(canvasWidth, canvasHeight) * 0.25 + (trackConfig.length / 1000) * 5;
  
  // Create an oval shape
  const radiusX = baseRadius * (1 + (trackConfig.straightRatio / 100) * 0.3);
  const radiusY = baseRadius * (1 - (trackConfig.straightRatio / 100) * 0.2);
  
  const numPoints = Math.max(16, Math.floor(trackConfig.cornerDensity / 3));
  const points: TrackPoint[] = [];
  const checkpoints: { x: number; y: number; angle: number }[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radiusX;
    const y = centerY + Math.sin(angle) * radiusY;
    
    // Calculate angle for this point
    const nextAngle = ((i + 1) / numPoints) * Math.PI * 2;
    const nextX = centerX + Math.cos(nextAngle) * radiusX;
    const nextY = centerY + Math.sin(nextAngle) * radiusY;
    const pointAngle = Math.atan2(nextY - y, nextX - x);
    
    points.push({ x, y, angle: pointAngle });
    
    // Add checkpoints at regular intervals
    if (i % Math.floor(numPoints / Math.max(4, Math.floor(trackConfig.cornerDensity / 20))) === 0) {
      checkpoints.push({ x, y, angle: pointAngle });
    }
  }
  
  return { points, checkpoints };
}

/**
 * Main function to generate track path - chooses layout based on track config
 */
export function getTrackPath(trackConfig: TrackConfig, canvasWidth: number, canvasHeight: number): TrackPath {
  // Use oval track for high straight ratio, complex track for high corner density
  if (trackConfig.straightRatio > 60) {
    return generateOvalTrack(trackConfig, canvasWidth, canvasHeight);
  } else {
    return generateTrackPath(trackConfig, canvasWidth, canvasHeight);
  }
}
