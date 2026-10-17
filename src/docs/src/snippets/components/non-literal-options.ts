/**
 * The path of the template.
 */
const TEMPLATE = './rating.xd.component.html';

/**
 * ✗ The template is not a string literal: the build fails.
 */
@WebComponent({ selector: 'ex-rating', templateUrl: TEMPLATE })
export class RatingComponent extends CustomElement {}
