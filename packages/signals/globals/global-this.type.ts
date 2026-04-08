import { State } from "../src/state/state";
import { computing, frozen, generation } from "./global-internal-slots";

export type SignalGlobalThis = Window & typeof globalThis & {
  [frozen]: boolean;
  [computing]: State<unknown> | null;
  [generation]: number;
  Signal: {
    State: typeof State
  }
}