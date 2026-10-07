// Evaluates every component and directive module, so that each one gets defined, before rendering anything
import.meta.glob(['./**/*.xd.component.ts', './**/*.directive.ts', '!./**/*.lazy.xd.component.ts'], { eager: true });

document.body.append(document.createElement('my-app-root'));
