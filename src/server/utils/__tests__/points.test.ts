import { describe, it, expect } from 'vitest';
import { calculatePoints, getPointsTable } from '../points';

describe('Points System', () => {
  it('should calculate correct points for positions', () => {
    expect(calculatePoints(1)).toBe(25);
    expect(calculatePoints(2)).toBe(18);
    expect(calculatePoints(3)).toBe(15);
    expect(calculatePoints(4)).toBe(12);
    expect(calculatePoints(5)).toBe(10);
    expect(calculatePoints(6)).toBe(8);
    expect(calculatePoints(7)).toBe(6);
    expect(calculatePoints(8)).toBe(4);
    expect(calculatePoints(9)).toBe(2);
    expect(calculatePoints(10)).toBe(1);
  });

  it('should return 0 points for positions outside top 10', () => {
    expect(calculatePoints(11)).toBe(0);
    expect(calculatePoints(20)).toBe(0);
    expect(calculatePoints(100)).toBe(0);
  });

  it('should return points table', () => {
    const table = getPointsTable();
    expect(table[1]).toBe(25);
    expect(table[10]).toBe(1);
    expect(Object.keys(table).length).toBe(10);
  });
});
