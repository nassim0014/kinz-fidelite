import { describe, expect, it } from 'vitest';
import { buildRoadmap } from './roadmap';
import { PERKS } from './rules';

describe('buildRoadmap', () => {
  const r = buildRoadmap();

  it('splits the 50 levels into the seven titles', () => {
    expect(r.stages.map((s) => [s.from, s.title])).toEqual([
      [1, 'Graine'],
      [5, 'Pousse'],
      [8, 'Raquette'],
      [13, 'Fleur'],
      [21, 'Figue'],
      [34, 'Figuier'],
      [50, 'Légende du Figuier d’Or'],
    ]);
    expect(r.stages.at(-1)?.to).toBe(50);
  });

  it('marks the three multipliers where they start', () => {
    expect(r.stages.filter((s) => s.boost).map((s) => [s.from, s.boost])).toEqual([
      [13, 2],
      [21, 3],
      [34, 5],
    ]);
  });

  it('places every perk exactly once, in level order', () => {
    const perkLevels = r.milestones.filter((m) => m.perk).map((m) => m.level);
    expect(perkLevels).toEqual(PERKS.map((p) => p.level));
    const levels = r.milestones.map((m) => m.level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(new Set(levels).size).toBe(levels.length);
  });

  it('starts a stage on its own row even without a perk', () => {
    expect(r.milestones.find((m) => m.level === 8)).toMatchObject({ perk: null });
    expect(r.milestones.find((m) => m.level === 8)?.stage?.title).toBe('Raquette');
  });
});
