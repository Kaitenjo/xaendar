---
paths:
  - "**/*.xd.component.html"
  - "src/docs/src/snippets/**/*.html"
---

# Templates

Every Xaendar template, the fragments in `src/docs/src/snippets` included.

## Order inside an opening tag

1. element ref: `#name`
2. conditional structural directives: `@if (…) { *name(…) }`
3. structural directives: `*name(…)`
4. conditional directives: `@if (…) { @@name(…) }`
5. directives: `@@name(…)`
6. conditional attributes and inputs: `@if (…) { name="…" }`
7. attributes and inputs (two-way bindings, `class`, `style` and `part` included): `name="…"`, `[(name)]="signal"`, `class="…"`, `style="…"`, `part="…"`, `class.name="{…}"`, `style.name="{…}"`, `part.name="{…}"`
8. conditional events: `@if (…) { (name)="…" }`
9. events: `(name)="…"`

"Conditional" means any block in the tag (`@if`/`@else if`/`@else`, `@switch`). The last four groups keep this order inside a directive's parentheses, and items inside a block follow it too. Keep each conditional block to one group when you can; when the branches of one condition need different groups, keep a single `@if`/`@else` (never `@if (x)` … `@if (!x)`) in the position of its first group.

Inside each group, sort the items alphabetically, comparing the full name as written, prefixes included: `attr.aria-hidden` before `attr.data-p`, `@@pBind` before `@@pRipple`, `(blur)` before `(click)`.

- `class`, `style` and `part` are not a group of their own: they are sorted alphabetically among the attributes and inputs (`aria-label`, `class`, `data-p`). `class.x`, `style.x` and `part.x` bindings go right after `class` / `style` / `part` when present (before the other attributes that follow alphabetically), and in the alphabetical position `class` / `style` / `part` would have when absent.
- The same alphabetical order applies to the inputs and listeners between the parentheses of a directive, within their own groups.
- Conditional blocks (`@if`/`@else`/`@switch` inside the tag) keep the position of their first group and are not reordered by name.

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
  class="{`btn ${kind()}`}"
  type="button"
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

- Never a block for a condition and another for its negation: one `@if (x) { … } @else { … }`.
- Never compare one expression with several values in separate blocks or an `@else if` chain: one `@switch` with a `@case` per value (stacked `@case`s share a branch) and a `@default` when needed. `@switch` also avoids the generated names shared by `@else if` branches.

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

Use a `@let` (template variable) to name a part of a signal read several times, instead of a getter only shortening the access. Computations stay in the class (`computed`, getters, methods).

```html
<!-- ✓ -->
@let address = user().address;
<p>{ address.street }, { address.city }</p>

<!-- ✗ logic belongs in the class -->
@let total = price() * quantity();
```

## Spaces

The language server formats templates (Format Document, width `xaendar.format.printWidth`) with these rules:
- Property-binding interpolations have no inner spaces (`title="{title()}"`), in directive parentheses too; text interpolations have one on each side (`{ title() }`).
- A control-flow keyword is followed by a space (`@if (x)`). Braces follow JavaScript: `{` after a space on the keyword's line, `}` on its own line, except before `@else`, `@empty`, `@placeholder`, `@catch`, `@loading`, `@error` (`} @else {`, `} @empty {`, `} @placeholder {`, `} @catch (error) {`, `} @loading {`, `} @error (error) {`).

## Names and self-closing

- No one-letter names: `@for (row of rows(); track row.id; index = $index)`, not `r`/`i`.
- Self-close every element without content, native ones included (`<div class="spacer" />`); void elements require it (`<input />`).

## Line breaks

- Never reformat inside `<pre>`.
- An element containing another element puts each child on its own line, indented, and its closing tag on its own line:

  ```html
  <tr>
    <td>
      <code>onInit()</code>
    </td>
    <td>Every connection, before the render</td>
  </tr>
  ```
- Every element and block starts on its own line after another node, even if written on one line (`</button> <button>`): the formatter breaks the line and drops the space, so write `{ ' ' }` when it matters. A text is never separated from the element following it (`Use <code>x</code>.` stays on one line), and nothing is moved next to a comment or into `<pre>`.
- An element with only text and interpolations stays on one line (`<span class="count">{ total } items</span>`) while its opening tag is short and the line within ~120 characters; otherwise the text goes on its own indented line, unless it already touches both tags (`<x-card>Text</x-card>`): on its own line it would gain spaces at both ends, visible when the content flows inline.
- An opening tag over the width wraps like the default HTML formatter: items fill each line up to the width, next lines indented, `>` (or `/>`) ending the last. A tag containing a conditional block has one item per line and `>` (or `/>`) on its own line, as above.
- Control-flow blocks, in a tag or between elements, are never inline: one block per line, content indented.

Xaendar keeps line breaks inside a text, as HTML does, and drops whitespace-only text holding a line break; a space between two elements or interpolations on the same line stays. So:
- wrapped lines of text keep their words apart;
- two elements separated only by a line break render joined: write `{ ' ' }` when the space matters;
- punctuation after an element stays on its line (`<code>a</code>,`): on its own line it would get a space before it.
