const TEMPLATE = './rating.xd.component.html';

@WebComponent({ selector: 'ex-rating', templateUrl: TEMPLATE })  // ✗ not a string literal: the plugin skips the class
export class RatingComponent extends CustomElement {}
