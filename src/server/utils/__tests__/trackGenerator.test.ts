import { describe, it, expect } from 'vitest';
import { generateTrack, generateTrackSeed } from '../trackGenerator';

describe('Track Generator', () => {
  it('should generate deterministic tracks for the same seed', () => {
    const seed = 'test-track-seed';
    const track1 = generateTrack(seed);
    const track2 = generateTrack(seed);

    expect(track1).toEqual(track2);
  });

  it('should generate different tracks for different seeds', () => {
    const track1 = generateTrack('seed1');
    const track2 = generateTrack('seed2');

    expect(track1.seed).not.toBe(track2.seed);
  });

  it('should generate valid track configurations', () => {
    const track = generateTrack('test-seed');

    expect(track.seed).toBe('test-seed');
    expect(track.length).toBeGreaterThanOrEqual(3000);
    expect(track.length).toBeLessThanOrEqual(7000);
    expect(track.corners).toBeGreaterThanOrEqual(8);
    expect(track.corners).toBeLessThanOrEqual(20);
    expect(track.elevation).toBeGreaterThanOrEqual(0);
    expect(track.elevation).toBeLessThanOrEqual(150);
    expect(['asphalt', 'concrete', 'mixed']).toContain(track.surface);
    expect(track.difficulty).toBeGreaterThanOrEqual(20);
    expect(track.difficulty).toBeLessThanOrEqual(90);
  });

  it('should generate track seed for date', () => {
    const seed = generateTrackSeed('20240101');
    expect(seed).toBe('track:20240101');
  });
});
