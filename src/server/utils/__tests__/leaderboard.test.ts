import { describe, it, expect } from 'vitest';
import { sortRaceResults, assignPositions } from '../leaderboard';
import type { RaceResult } from '../../../shared/types';

describe('Leaderboard Sorting', () => {
  const createResult = (
    userId: string,
    lapTime: number,
    timestamp: number
  ): RaceResult => ({
    userId,
    username: userId,
    submission: {
      userId,
      username: userId,
      carSetup: {
        downforce: 50,
        suspension: 50,
        gearRatio: 50,
        tirePressure: 50,
        brakeBias: 50,
      },
      strategy: {
        fuelLoad: 50,
        tireCompound: 'medium',
        pitStrategy: 'no-pit',
      },
      timestamp,
    },
    lapTime,
    position: 0,
    points: 0,
    timestamp,
  });

  it('should sort results by lap time ascending', () => {
    const results = [
      createResult('user1', 120.5, 1000),
      createResult('user2', 115.2, 2000),
      createResult('user3', 130.1, 3000),
    ];

    const sorted = sortRaceResults(results);

    expect(sorted[0].lapTime).toBe(115.2);
    expect(sorted[1].lapTime).toBe(120.5);
    expect(sorted[2].lapTime).toBe(130.1);
  });

  it('should use timestamp as tie-breaker for equal lap times', () => {
    const results = [
      createResult('user1', 120.0, 2000), // Later timestamp
      createResult('user2', 120.0, 1000), // Earlier timestamp wins
    ];

    const sorted = sortRaceResults(results);

    expect(sorted[0].userId).toBe('user2');
    expect(sorted[1].userId).toBe('user1');
  });

  it('should assign positions correctly', () => {
    const results = [
      createResult('user1', 115.2, 1000),
      createResult('user2', 120.5, 2000),
      createResult('user3', 130.1, 3000),
    ];

    const sorted = sortRaceResults(results);
    const withPositions = assignPositions(sorted);

    expect(withPositions[0].position).toBe(1);
    expect(withPositions[1].position).toBe(2);
    expect(withPositions[2].position).toBe(3);
  });

  it('should maintain stable ordering', () => {
    const results = [
      createResult('user1', 120.0, 1000),
      createResult('user2', 120.0, 2000),
      createResult('user3', 120.0, 3000),
    ];

    const sorted1 = sortRaceResults(results);
    const sorted2 = sortRaceResults(results);

    expect(sorted1.map((r) => r.userId)).toEqual(sorted2.map((r) => r.userId));
  });
});
