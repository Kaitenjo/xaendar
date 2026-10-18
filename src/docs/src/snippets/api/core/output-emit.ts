/**
 * A booking, emitted as the detail: an object with a cancelable key of its own.
 */
@Event()
public accessor booked!: Output<{ seats: number; cancelable: boolean }>;
/**
 * An event without a detail.
 */
@Event()
public accessor closed!: Output;

// All of it is the detail: the event is not cancelable
this.booked.emit({ seats: 2, cancelable: true });
// The options of the emission follow the detail
this.booked.emit({ seats: 2, cancelable: true }, new EventOptions({ cancelable: true }));
// An instance of EventOptions as the only argument: the options of the emission
this.closed.emit(new EventOptions({ bubbles: true }));
// A plain object is never taken for the options
this.closed.emit({ bubbles: true });
// ✗ Argument of type '[{ bubbles: true; }]' is not assignable to parameter of type '[] | [EventOptions]'.
