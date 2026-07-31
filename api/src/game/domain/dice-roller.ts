export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

export type DiceRoll = readonly [DieValue, DieValue];

export type DiceRoller = () => DiceRoll;
