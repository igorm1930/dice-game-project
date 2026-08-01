import { CombinationBustGameRules } from './combination-bust-game-rules';
import {
  DOUBLE_SIX_RULE_SET_ID,
  GameRulesRegistry,
  UnknownGameRulesError,
  doubleSixV1GameRules,
} from './game-rules.registry';

describe('game rules', () => {
  it.each([
    [[6, 6] as const, { type: 'BUST' }],
    [[5, 6] as const, { type: 'SCORE', points: 11 }],
    [[6, 5] as const, { type: 'SCORE', points: 11 }],
    [[2, 5] as const, { type: 'SCORE', points: 7 }],
    [[5, 2] as const, { type: 'SCORE', points: 7 }],
    [[3, 4] as const, { type: 'SCORE', points: 7 }],
  ])('evaluates %p through double-six-v1', (dice, outcome) => {
    expect(doubleSixV1GameRules.evaluateRoll(dice)).toEqual(outcome);
  });

  it('supports several unordered bust combinations configured once each', () => {
    const configuredCombinations = [
      [6, 6],
      [5, 6],
      [2, 5],
    ] as const;
    const gameRules = new CombinationBustGameRules(
      'multiple-busts-test',
      configuredCombinations,
    );

    expect(configuredCombinations).toHaveLength(3);
    expect(gameRules.evaluateRoll([6, 6])).toEqual({ type: 'BUST' });
    expect(gameRules.evaluateRoll([5, 6])).toEqual({ type: 'BUST' });
    expect(gameRules.evaluateRoll([6, 5])).toEqual({ type: 'BUST' });
    expect(gameRules.evaluateRoll([2, 5])).toEqual({ type: 'BUST' });
    expect(gameRules.evaluateRoll([5, 2])).toEqual({ type: 'BUST' });
    expect(gameRules.evaluateRoll([3, 4])).toEqual({
      type: 'SCORE',
      points: 7,
    });
  });

  it('rejects duplicate unordered combinations and duplicate rule IDs', () => {
    expect(
      () =>
        new CombinationBustGameRules('duplicate-combination-test', [
          [5, 6],
          [6, 5],
        ]),
    ).toThrow('same unordered dice combination');
    expect(
      () =>
        new GameRulesRegistry(
          [doubleSixV1GameRules, doubleSixV1GameRules],
          DOUBLE_SIX_RULE_SET_ID,
        ),
    ).toThrow('IDs must be unique');
  });

  it('resolves only registered rules and fails safely for unknown IDs', () => {
    const registry = new GameRulesRegistry(
      [doubleSixV1GameRules],
      DOUBLE_SIX_RULE_SET_ID,
    );

    expect(registry.defaultRules).toBe(doubleSixV1GameRules);
    expect(registry.resolve(DOUBLE_SIX_RULE_SET_ID)).toBe(doubleSixV1GameRules);
    expect(() => registry.resolve('unknown-v1')).toThrow(UnknownGameRulesError);
  });
});
