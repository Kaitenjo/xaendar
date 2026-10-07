@Property(0)                                      // the default value
public accessor count!: InputSignal<number>;

@Property(true, { alias: 'show-value' })          // bound as show-value="…" in templates
public accessor showValue!: InputSignal<boolean>;

@Property([] as string[], {
  transform: (tags: string[]) => tags.map(tag => tag.trim()),    // applied to every incoming value
  equals: (a: string[], b: string[]) => a.join() === b.join(),   // an equal value notifies nobody
  watched: () => console.log('first reader'),                    // the options of a signal: see Signal options
  unwatched: () => console.log('no readers left')
})
public accessor tags!: InputSignal<string[]>;

@Property.required()                              // every template using the component must bind it
public accessor name!: InputSignal<string>;
