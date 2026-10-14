/**
 * A five-star rating.
 */
@WebComponent({
  selector: 'ex-rating',                      // the custom element name: lowercase, with a hyphen, unique
  styleUrl: './rating.css',                   // optional, a .css file relative to this file
  templateUrl: './rating.xd.component.html'   // required, relative to this file
})
export class RatingComponent extends CustomElement {}
