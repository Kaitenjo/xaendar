/**
 * A decorated subclass: it gets its own render function, and can reuse the template of its parent.
 */
@WebComponent({
  selector: 'ex-big-stepper',
  templateUrl: '../stepper/stepper.xd.component.html',
  styleUrl: './big-stepper.css'
})
export class BigStepperComponent extends StepperComponent {}
