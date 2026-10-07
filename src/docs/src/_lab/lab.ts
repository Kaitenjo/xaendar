import.meta.glob(['./**/*.xd.component.ts', './**/*.directive.ts', '!./**/orphan*'], { eager: true });

const tag = new URLSearchParams(location.search).get('c') ?? 'lab-a';
document.body.append(document.createElement(tag));
