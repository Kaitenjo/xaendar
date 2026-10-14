// each.directive.ts
@Directive({ selector: 'exEach' })
export class EachDirective<Item extends { id: number }, Key = string> extends CustomDirective<HTMLElement> {
  @Property([]) accessor items!: InputSignal<Item[]>;
  @Event() accessor picked!: Output<Key>;
}
