# Changelog

## Unreleased

### Breaking changes

#### The variables of a template are values, not signals

The item of a `@for`, its implicit variables (`$index`, `$first`, `$last`, `$even`, `$odd`) and their aliases, a `@let` and the parameters of a `<template>` hold their values: read them without parentheses, in `track` too.

Before:

```html
@for (task of tasks(); track task().id; position = $index) {
  @let owner = task().owner;
  <li [class.odd]="{$odd()}">
    { position() + 1 }. { task().title }, { owner().name }
    @render badge(task().status)
  </li>
}

<template badge(status: string)>
  <b class="{status()}">{ status() }</b>
</template>
```

After:

```html
@for (task of tasks(); track task.id; position = $index) {
  @let owner = task.owner;
  <li [class.odd]="{$odd}">
    { position + 1 }. { task.title }, { owner.name }
    @render badge(task.status)
  </li>
}

<template badge(status: string)>
  <b class="{status}">{ status }</b>
</template>
```

To migrate:

- Remove the parentheses after every variable of the template. The compiler reports each call left, in the editor and in the build: `'task' is a template variable, not a signal: remove the parentheses and read it as task, since the variables of a template (@for, @let, parameters of a template) hold their values`. A variable whose value is a function, as a parameter typed `() => string`, is still called.
- A variable passed to a method is its value: `(click)="select(task)"` passes the item, no longer its signal. Type the parameters of such methods with the value (`select(task: Task)`).
- A `@let` is typed with its value (`@let total = price();` is a `number`, no longer a `Computed<number>`).
- `track task` keys the rows by the item itself, as a `@for` without `track` does: the parser error asking to call the item in `track` is gone.

Signals are read as before: `items()`, `user().address`, `count()`.

### Changes

- A binding is an effect only when it reads a signal. Every binding (texts, attributes, classes, conditional bindings, the conditions of `@if` and `@switch`, the items of `@for`, the arguments of `@render`, `@let`, `when` of `@defer` and `@hydrate`) tracks the signals its first run reads: reading some, it becomes an effect on exactly those signals; reading none, it keeps no `Computed` and no `Watcher`, only a small record in its scope when it reads variables of the template. The decision is taken again every time the binding runs, so a binding reading a signal only behind a condition becomes an effect when it starts reading it, and stops being one when it no longer does.
- A scope whose variables change (a row of `@for` reused for another item with the same key or moved, a `@let` computed again, an instance of a `<template>` receiving other arguments) runs again only the bindings the compiler found reading the variables that changed, and writes the DOM only where a value differs. A signal change runs only the effects reading it, without running any scope again. An event handler reads the current values of the variables when the event fires.
- Attribute and class bindings follow every signal they read at runtime, as texts always did, wherever the signal is read: a method or a function of another module or of a compiled package reading it, a member holding a signal returned by a function of the application. Such a binding used to be evaluated once; annotating the member with a type of `@xaendar/core/signals` is no longer needed for it to update (it still lets the type-check narrow the member in the conditions of `@if`).
- An attribute bound to `null` or `undefined` is removed, instead of being written as the text `"null"` or `"undefined"`, and the server leaves it out: `aria-describedby="{ error() ? 'hint' : null }"` is there only while there is an error, and `disabled="{ busy() || null }"` adds and removes a boolean attribute. `false` and `0` are still written as text.
- `@if (row.page)` narrows `row.page` inside its branch, since the item is a value.
- The rendering on the server and the hydration write and adopt the same HTML as before.

Measured on a table of 1000 rows × 10 cells (`@for` of rows, `@for` of columns, a class binding reading the alias of `$index` on each row), in Node with happy-dom, against 1.2.3:

| | 1.2.3 | Unreleased |
| --- | --- | --- |
| Retained heap of the rendered table (after `gc()`) | 85.9 MB | 77.3 MB |
| `Computed` nodes alive (effects included) | 12001 | 1002 |
| `Watcher`s alive | 12001 | 1002 |
| `State` nodes alive | 12003 | 3 |
| First render | ~290 ms | ~250 ms |
| A signal read by one cell changes | 0.01 ms | 0.01 ms |
| Every row moved (the list reversed) | 45.5 ms | 47.8 ms |
| Every item replaced by a copy with the same key | 40.5 ms | 21.5 ms |
