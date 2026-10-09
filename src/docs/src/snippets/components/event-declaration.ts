/**
 * A CustomEvent named valueChange, carrying a number.
 */
@Event()
public accessor valueChange!: Output<number>;
/**
 * An Output<void>, with no detail. The options are the defaults of every emission.
 */
@Event({ bubbles: true, composed: true })
public accessor closed!: Output;

this.valueChange.emit(3);                      // detail 3, default options
this.valueChange.emit(3, { bubbles: true });   // detail 3, options for this emission only
this.closed.emit();                            // detail null
this.closed.emit({ composed: false });         // without a detail, the only argument is the options
