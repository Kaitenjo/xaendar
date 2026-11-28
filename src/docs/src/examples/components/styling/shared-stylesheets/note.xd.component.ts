import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A note: the shared base stylesheet, then a background of its own.
 */
@WebComponent({
  selector: 'ex-note',
  styleUrl: ['./base.css', './note.css'],
  templateUrl: './note.xd.component.html'
})
export class NoteComponent extends CustomElement { }
