---
paths:
  - "packages/internals/**"
---

# @xaendar/internals

The logic several packages of Xaendar must apply alike, written once: a peerDependency of every package using it (pinned to the release, like the other peers), so that an application has one copy and never declares it. Not a public API: no page on the site, no stability across versions; applications import `@xaendar/common`, never this package. No `@xaendar/*` dependency.

- Styling (`CSS_UNITS`, `toCssPropertyName`, `splitClasses`, `parseStyleDeclarations`, `stylePriority`, `styleValue`): the compiler, core, `@xaendar/directives`, ssr and language-core.
- URLs (`isUrlAttribute`, `holdsUrls`, `holdsUnsafeUrl`, `everySrcsetUrl`, `cleanUrl`, `readUrlScheme`, `readUrlOrigin`, `isMediaDataUrl`, `isUnsafeUrl`, `isResourceUrlAttribute`, `isUntrustedResourceUrl`): the compiler, core (`_checkUrl`, `checkHostUrl`) and `@xaendar/directives` (`sanitizeHtml`).
- Unsafe bindings (`describeUnsafeAttribute` on any element, `describeUnsafeElementAttribute(tag, name, AttributeReader)` for iframe restrictions, SVG animations, meta pragmas): the reasons the compiler reports (`Binding x …`) and core throws for `@HostAttribute` (`@HostAttribute('x') …`), so that the template and the host attributes agree.
- HTML serialization (`escapeText`, `escapeAttribute`, `escapeRawText`, `isVoidElement`, `isRawTextElement`, `dropsLeadingNewline`): the compiler, ssr and ssr-compiler.
- Custom element names (`isValidCustomElementName`, `matchesCustomElementPattern`, `NOT_ALLOWED_TAGS`): the cli, the compiler, ssr and ssr-compiler. `acceptsShadowRoot` (the native tags a customized built-in element may render a template into): the compiler, mirrored by the type `ShadowHostTagName` of core.
- Key events (`parseKeyEvent`, `KEY_MODIFIERS`, `KeyEventFilter`): the compiler, `@HostListener` and language-core.
- Models (`MODEL_CHANGE_SUFFIX`, `toModelChangeEvent`, `toModelName`): the compiler, core and language-core.
- Host directives (`describeDuplicateHostDirective`, `describeInputExposure`, `describeEventExposure`): the rules, their order and the messages, which the compiler reports and core throws, so that the build and the browser agree.

A check or a rule two packages apply (the compiler and the runtime, the client and the server) is written here once, each package keeping only the code reading its own sources; never a copy in each.
