// field.xd.component.ts
/**
 * A field with a tooltip, whose inputs and output are bound on the tag of the field.
 */
@WebComponent({
  selector: 'ex-field',
  hostDirectives: [{
    directive: TooltipDirective,
    properties: ['position', { name: 'text', alias: 'hint' }], // position as it is, text as hint
    events: [{ name: 'shown', alias: 'hintShown' }]            // dispatched on ex-field as hintShown
  }],
  templateUrl: './field.xd.component.html'
})
export class FieldComponent extends CustomElement {}
