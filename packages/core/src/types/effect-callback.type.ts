/**
 * A callback run by an effect, again whenever a signal it read changes: it receives the arguments the effect was
 * created with, so that a callback declared once serves many effects, each one holding its own data instead of a
 * closure.
 *
 * @template First - The type of the first argument.
 * @template Second - The type of the second argument.
 * @template Third - The type of the third argument.
 */
export type EffectCallback<First, Second, Third> = (first: First, second: Second, third: Third) => void;
