---
paths:
  - "**/*.xd.component.html"
  - "src/docs/src/snippets/**/*.html"
---

# Templates

Applies to every Xaendar template (`*.xd.component.html`), including the template fragments in `src/docs/src/snippets`.

## Order inside an opening tag

After the tag name, write the items of the opening tag in this order:

1. template variable: `#name`
2. conditional structural directives: `@if (…) { *name(…) }`
3. structural directives: `*name(…)`
4. conditional directives: `@if (…) { @@name(…) }`
5. directives: `@@name(…)`
6. conditional attributes (and component inputs): `@if (…) { name="…" }`
7. attributes (and component inputs), then class bindings: `name="…"`, `[class.name]="{…}"`
8. conditional events: `@if (…) { (name)="…" }`
9. events: `(name)="…"`

"Conditional" means any block inside the tag: `@if` / `@else if` / `@else` and `@switch`.

- The last four groups keep the same order inside the parentheses of a directive: conditional attributes, attributes, conditional events, events.
- Keep each conditional block to a single group when you can. When the branches of one condition need different groups (attributes in one, listeners in the other), keep a single `@if` / `@else` and never split it into `@if (x)` … `@if (!x)` (see Conditions): the block goes in the position of its first group.
- Inside a block, its items follow the same order.

```html
<button
  *exVisibleWhen(condition="{shown()}")
  @if (highlighted()) {
    @@exTint(color="#fde68a")
  }
  @@exTooltip(text="{hint()}" (opened)="track($event)")
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

## @let

Use a `@let` to name a part of a signal the template reads several times, instead of a getter that only shortens the access. Computations stay in the class (`computed`, getters, methods).

```html
<!-- ✓ -->
@let address = user().address;
<p>{ address().street }, { address().city }</p>

<!-- ✗ logic belongs in the class -->
@let total = price() * quantity();
```

## Spaces

The language server formats the templates (Format Document, `xaendar.format.printWidth` for the width of the lines) and applies these rules:
- An interpolation in a property binding has no spaces inside its braces: `title="{title()}"`, not `title="{ title() }"`. This holds in the parentheses of a directive too.
- An interpolation in the text has one space on each side: `{ title() }`, not `{title()}`.
- A control-flow keyword is followed by a space before its parenthesis: `@if (x)`, not `@if(x)`. The braces follow JavaScript: `{` after a space on the line of the keyword, `}` on a line of its own, except the one before an `@else` (`} @else {`).

## Names

Never use one-letter names in templates either: `@for` items and aliases (`@for (row of rows(); track row().id; index = $index)`, not `r` / `i`).

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

- Every element and block starts on a line of its own after another node, also when the template had them on one line (`</button> <button>`): the formatter writes a line break there and the space is dropped, so write `{ ' ' }` when it matters. A text is never separated from the element that follows it (`Use <code>x</code>.` stays on one line), and nothing is moved next to a comment or inside `<pre>`.
- An element that contains only text and interpolations stays on one line (`<span class="count">{ total() } items</span>`), as long as its opening tag is short and the line stays within about 120 characters. Otherwise, the text goes on its own line, indented one level. Exception: text that already touches both tags (`<x-card>Text</x-card>`) stays inline even when long, because on its own line it would gain spaces at both ends, and they are visible when the content flows inline (slotted next to other content, for example).
- An opening tag that does not fit the line (`xaendar.format.printWidth`) is wrapped like the default HTML formatter does: the items fill each line up to the width, the next lines indented one level, and `>` (or `/>`) ends the last line. A tag that contains a conditional block has one item per line instead, indented one level, and ends with `>` (or `/>`) on its own line, as in the example above.
- Control-flow blocks, inside a tag or between elements, are never inline: one block per line, with its content indented.

Xaendar keeps the line breaks inside a text, as HTML does, and drops whitespace-only text holding a line break; a space between two elements or interpolations on the same line stays. As a result:
- wrapped lines of text keep their words apart;
- two elements separated only by a line break render joined: write `{ ' ' }` between them when the space matters;
- punctuation that follows an element stays on that element's line (`<code>a</code>,`). On a line of its own, it would get a space before it.
