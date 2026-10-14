/**
 * A decorated subclass: it gets its own render function, and can reuse the template of its parent.
 */
@WebComponent({
  selector: 'ex-big-stepper',
  styleUrl: './big-stepper.css',
  templateUrl: '../stepper/stepper.xd.component.html'
})
export class BigStepperComponent extends StepperComponent {}
