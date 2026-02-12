import { describe, it, expect } from 'vitest';
import { generateDailyTrack } from '../trackGenerator';

describe('Daily Track Generator', () => {
  it('should generate deterministic tracks for the same trackId', () => {
    const trackId = '20240101';
    const track1 = generateDailyTrack(trackId);
    const track2 = generateDailyTrack(trackId);

    expect(track1).toEqual(track2);
  });

  it('should generate different tracks for different trackIds', () => {
    const track1 = generateDailyTrack('20240101');
    const track2 = generateDailyTrack('20240102');

    expect(track1.trackId).not.toBe(track2.trackId);
  });

  it('should generate valid track configurations', () => {
    const track = generateDailyTrack('20240101');

    expect(track.trackId).toBe('20240101');
    expect(track.length).toBeGreaterThanOrEqual(3000);
    expect(track.length).toBeLessThanOrEqual(7000);
    expect(track.cornerDensity).toBeGreaterThanOrEqual(20);
    expect(track.cornerDensity).toBeLessThanOrEqual(80);
    expect(track.straightRatio).toBeGreaterThanOrEqual(30);
    expect(track.straightRatio).toBeLessThanOrEqual(70);
    expect(track.width).toBeGreaterThanOrEqual(10);
    expect(track.width).toBeLessThanOrEqual(15);
    expect(track.surfaceGrip).toBeGreaterThanOrEqual(60);
    expect(track.surfaceGrip).toBeLessThanOrEqual(95);
    expect(track.weatherProbability).toBeGreaterThanOrEqual(0);
    expect(track.weatherProbability).toBeLessThanOrEqual(30);
    expect(Array.isArray(track.elevationProfile)).toBe(true);
    expect(track.elevationProfile.length).toBeGreaterThan(0);
  });
});
