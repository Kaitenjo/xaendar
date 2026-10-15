// picker.xd.component.ts
@WebComponent({
  selector: 'ex-picker',
  templateUrl: './picker.xd.component.html'
})
export class PickerComponent<Item extends { id: number }, Key = string> extends CustomElement {
  @Property([]) accessor items!: InputSignal<Item[]>;
  @Event() accessor picked!: Output<Key>;
  @Event() accessor selected!: Output<Item>;
}
