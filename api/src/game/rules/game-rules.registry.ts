import type { GameRules } from '../domain/game-rules';
import { CombinationBustGameRules } from './combination-bust-game-rules';

export const DOUBLE_SIX_RULE_SET_ID = 'double-six-v1';

export const doubleSixV1GameRules = new CombinationBustGameRules(
  DOUBLE_SIX_RULE_SET_ID,
  [[6, 6]],
);

export class UnknownGameRulesError extends Error {
  constructor(ruleSetId: string) {
    super(`No approved game rules are registered for ${ruleSetId}.`);
    this.name = 'UnknownGameRulesError';
  }
}

export class GameRulesRegistry {
  private readonly rulesById: ReadonlyMap<string, GameRules>;

  constructor(
    rules: readonly GameRules[],
    private readonly defaultRuleSetId: string,
  ) {
    const entries = rules.map(
      (gameRules) => [gameRules.id, gameRules] as const,
    );

    if (new Set(entries.map(([id]) => id)).size !== entries.length) {
      throw new Error('Game rule set IDs must be unique.');
    }

    this.rulesById = new Map(entries);
    this.resolve(defaultRuleSetId);
  }

  get defaultRules(): GameRules {
    return this.resolve(this.defaultRuleSetId);
  }

  resolve(ruleSetId: string): GameRules {
    const gameRules = this.rulesById.get(ruleSetId);

    if (!gameRules) {
      throw new UnknownGameRulesError(ruleSetId);
    }

    return gameRules;
  }
}

export const productionGameRulesRegistry = new GameRulesRegistry(
  [doubleSixV1GameRules],
  DOUBLE_SIX_RULE_SET_ID,
);
