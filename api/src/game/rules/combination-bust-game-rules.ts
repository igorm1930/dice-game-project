import type { DiceRoll, DieValue } from '../domain/dice-roller';
import type { GameRules, RollOutcome } from '../domain/game-rules';

type NormalizedDiceCombination = `${DieValue}-${DieValue}`;

function normalizeDiceCombination(dice: DiceRoll): NormalizedDiceCombination {
  const lower = Math.min(dice[0], dice[1]) as DieValue;
  const higher = Math.max(dice[0], dice[1]) as DieValue;

  return `${lower}-${higher}`;
}

export class CombinationBustGameRules implements GameRules {
  readonly id: string;
  private readonly bustCombinationKeys: ReadonlySet<NormalizedDiceCombination>;

  constructor(id: string, bustCombinations: readonly DiceRoll[]) {
    if (id.trim() === '') {
      throw new Error('A game rule set requires a non-empty ID.');
    }

    const normalizedCombinations = bustCombinations.map(
      normalizeDiceCombination,
    );
    const uniqueCombinations = new Set(normalizedCombinations);

    if (uniqueCombinations.size !== normalizedCombinations.length) {
      throw new Error(
        'A game rule set cannot configure the same unordered dice combination more than once.',
      );
    }

    this.id = id;
    this.bustCombinationKeys = uniqueCombinations;
  }

  evaluateRoll(dice: DiceRoll): RollOutcome {
    return this.bustCombinationKeys.has(normalizeDiceCombination(dice))
      ? { type: 'BUST' }
      : { type: 'SCORE', points: dice[0] + dice[1] };
  }
}
