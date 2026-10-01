import { CARD_STOPS, MAX_LEVEL, multiplier, PERKS, type Perk, title } from './rules';

/** A stretch of levels sharing one title (Graine, Pousse, …). */
export interface Stage {
  from: number;
  to: number;
  title: string;
  /** Pépins multiplier that starts with this stage, if it changes here. */
  boost: number | null;
}

/** One row of the printed branch: a level where something happens. */
export interface Milestone {
  level: number;
  stage: Stage | null;
  perk: Perk | null;
}

export interface Roadmap {
  stages: Stage[];
  milestones: Milestone[];
  cardStops: typeof CARD_STOPS;
}

/** Everything the posters show, derived from the game rules so print never drifts from the app. */
export function buildRoadmap(): Roadmap {
  const stages: Stage[] = [];
  for (let level = 1; level <= MAX_LEVEL; level++) {
    const t = title(level);
    const last = stages.at(-1);
    if (last && last.title === t) {
      last.to = level;
      continue;
    }
    const boost =
      multiplier(level) !== multiplier(level - 1) && level > 1 ? multiplier(level) : null;
    stages.push({ from: level, to: level, title: t, boost });
  }

  const levels = [...new Set([...stages.map((s) => s.from), ...PERKS.map((p) => p.level)])].sort(
    (a, b) => a - b,
  );
  const milestones = levels.map((level) => ({
    level,
    stage: stages.find((s) => s.from === level) ?? null,
    perk: PERKS.find((p) => p.level === level) ?? null,
  }));

  return { stages, milestones, cardStops: CARD_STOPS };
}
