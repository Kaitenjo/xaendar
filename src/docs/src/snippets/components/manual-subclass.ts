/**
 * A subclass registered by hand, without @WebComponent: it has no render function of its own.
 */
class PlainStepper extends StepperComponent {}
customElements.define('plain-stepper', PlainStepper);

document.body.append(document.createElement('plain-stepper'));
// ✗ Error: PlainStepper does not seems to have a Render Function
