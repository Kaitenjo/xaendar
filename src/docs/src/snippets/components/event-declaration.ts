@Event()                                       // a CustomEvent named valueChange, carrying a number
public accessor valueChange!: Output<number>;

@Event({ bubbles: true, composed: true })      // the default options of every emission
public accessor closed!: Output;               // Output<void>: no detail

this.valueChange.emit(3);                      // detail 3, default options
this.valueChange.emit(3, { bubbles: true });   // detail 3, options for this emission only
this.closed.emit();                            // detail null
this.closed.emit({ composed: false });         // without a detail, the only argument is the options
