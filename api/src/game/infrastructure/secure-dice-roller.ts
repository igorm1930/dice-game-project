import { randomInt } from 'node:crypto';
import type { DiceRoller, DieValue } from '../domain/dice-roller';

function rollDie(): DieValue {
  return randomInt(1, 7) as DieValue;
}

export const secureDiceRoller: DiceRoller = () => [rollDie(), rollDie()];
