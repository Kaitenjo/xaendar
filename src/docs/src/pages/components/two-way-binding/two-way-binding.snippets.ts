import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `model-declaration.ts`, shown by the page components/two-way-binding and the API reference of core.
 */
export const MODEL_DECLARATION: SourceFile = {
  name: 'model-declaration.ts',
  lang: 'ts',
  code: `/**
 * A model named value: the parent binds it with [(value)]="quantity", and its event of change is valueChange.
 */
@Model(0)
public accessor value!: ModelSignal<number>;
/**
 * A required model bound by its alias, [(on)]="enabled": its event of change is onChange, and it bubbles.
 */
@Model.required({ alias: 'on', event: { bubbles: true } })
public accessor checked!: Aliased<ModelSignal<boolean>, 'on'>;

this.value();                           // reads it, as any input
this.value.set(3);                      // writes 3, and dispatches valueChange with detail 3
this.value.update(value => value + 1);  // writes 4, and dispatches valueChange with detail 4
this.value.set(4);                      // the same value: nothing changes, and no event is dispatched`
};