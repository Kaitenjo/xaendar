---
paths:
  - "**/*.xd.component.html"
  - "src/docs/src/snippets/**/*.html"
---

# Templates

Applies to every Xaendar template (`*.xd.component.html`), including the template fragments in `src/docs/src/snippets`.

## Order inside an opening tag

After the tag name, write the items of the opening tag in this order:

1. conditional structural directives: `@if (…) { *name(…) }`
2. structural directives: `*name(…)`
3. conditional directives: `@if (…) { @@name(…) }`
4. directives: `@@name(…)`
5. conditional attributes (and component inputs): `@if (…) { name="…" }`
6. attributes (and component inputs): `name="…"`
7. conditional events: `@if (…) { (name)="…" }`
8. events: `(name)="…"`

"Conditional" means any block inside the tag: `@if` / `@else if` / `@else` and `@switch`.

- The last four groups keep the same order inside the parentheses of a directive: conditional attributes, attributes, conditional events, events.
- Keep each conditional block to a single group when you can. When the branches of one condition need different groups (attributes in one, listeners in the other), keep a single `@if` / `@else` and never split it into `@if (x)` … `@if (!x)` (see Conditions): the block goes in the position of its first group.
- Inside a block, its items follow the same order.

```html
<button
  *exVisibleWhen(condition="{ shown() }")
  @if (highlighted()) {
    @@exTint(color="#fde68a")
  }
  @@exTooltip(text="{ hint() }" (opened)="track($event)")
  @if (locked()) {
    disabled
  }
  type="button"
  class="{`btn ${kind()}`}"
  @if (editable()) {
    (click)="edit()"
  }
  (focus)="select()"
>
  Edit
</button>
```

## Conditions

Between elements and inside a tag alike:

- Never write a block for a condition and another for its negation (`@if (x) { … }` … `@if (!x) { … }`): write one `@if (x) { … } @else { … }`.
- Never compare the same expression with several values, in separate blocks (`@if (status() === 'draft') { … }` … `@if (status() === 'done') { … }`) or in an `@else if` chain: write a `@switch (status())` with one `@case` per value (stacked `@case`s share a branch) and a `@default` when the other values need handling too. `@switch` also avoids the generated names shared by `@else if` branches.

```html
@switch (status()) {
  @case ('draft')
  @case ('review') {
    <p>In progress</p>
  }
  @case ('done') {
    <p>Done</p>
  }
  @default {
    <p>Unknown</p>
  }
}
```

## Names

Never use one-letter names in templates either: `@for` items and aliases (`@for (row of rows(); track row.id; index = $index)`, not `r` / `i`).

## Self-closing tags

Self-close every element without content, native ones included: `<div class="spacer" />`, not `<div class="spacer"></div>`. Void elements require it (`<input />`).

## Line breaks

- `<pre>` keeps its content exactly as written: never reformat inside it.
- An element that contains another element puts each child on its own line, indented one level, and its closing tag on its own line:

  ```html
  <tr>
    <td>
      <code>onInit()</code>
    </td>
    <td>Every connection, before the render</td>
  </tr>
  ```

- An element that contains only text and interpolations stays on one line (`<span class="count">{ total() } items</span>`), as long as its opening tag is short and the line stays within about 120 characters. Otherwise, the text goes on its own line, indented one level. Exception: text that already touches both tags (`<x-card>Text</x-card>`) stays inline even when long, because on its own line it would gain spaces at both ends, and they are visible when the content flows inline (slotted next to other content, for example).
- An opening tag that does not fit on one line, or contains a conditional block, has one item per line, indented one level, and ends with `>` (or `/>`) on its own line, as in the example above.
- Control-flow blocks, inside a tag or between elements, are never inline: one block per line, with its content indented.

Xaendar removes the newlines from text and drops whitespace-only text between two elements. As a result:
- indented lines of text still keep their words apart;
- two elements separated only by a line break render joined: write `{ ' ' }` between them when the space matters;
- punctuation that follows an element stays on that element's line (`<code>a</code>,`). On a line of its own, it would get a space before it.
