import type { DiceRoll } from './dice-roller';

export type RollOutcome =
  | { readonly type: 'SCORE'; readonly points: number }
  | { readonly type: 'BUST' };

export interface GameRules {
  readonly id: string;
  evaluateRoll(dice: DiceRoll): RollOutcome;
}
