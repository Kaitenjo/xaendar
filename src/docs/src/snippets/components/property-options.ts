/**
 * An input whose default value is 0.
 */
@Property(0)
public accessor count!: InputSignal<number>;
/**
 * Bound as show-value="…" in templates.
 */
@Property(true, { alias: 'show-value' })
public accessor showValue!: InputSignal<boolean>;
/**
 * Normalized and compared through the options of the input.
 */
@Property<InputSignal<string[]>>([], {
  transform: (tags: string[]) => tags.map(tag => tag.trim()),                // applied to every incoming value
  equals: (left: string[], right: string[]) => left.join() === right.join(), // an equal value notifies nobody
  watched: () => console.log('first reader'),                                // the options of a signal: see Signal options
  unwatched: () => console.log('no readers left')
})
public accessor tags!: InputSignal<string[]>;
/**
 * Every template using the component must bind it.
 */
@Property.required()
public accessor name!: InputSignal<string>;
