import { State } from "../src/state/state";
import { SignalGlobalThis } from "./global-this.type";
import { computing, frozen, generation } from "./global-internal-slots";

export const signalGlobalThis = globalThis as SignalGlobalThis;

signalGlobalThis[frozen] = false;
signalGlobalThis[computing] = null;
signalGlobalThis[generation] = 0;
signalGlobalThis.Signal = {
  State: State
}