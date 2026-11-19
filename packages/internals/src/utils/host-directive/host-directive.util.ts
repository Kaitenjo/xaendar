/**
 * Describes a host directive declared more than once along the chain of classes of a component. Shared by the compiler,
 * which reports it, and by the runtime, which throws it, so that the build and the browser give the same message.
 *
 * @param className - The name of the class of the component.
 * @param directiveName - The name of the class of the directive.
 * @returns The message.
 */
export function describeDuplicateHostDirective(className: string, directiveName: string | undefined): string {
  return `${className} declares the host directive ${directiveName} more than once`;
}

/**
 * Describes why an input of a host directive cannot be exposed on its component, checking in order that the directive
 * declares it, that no input of the component nor another exposed input has the name, and that no member of the
 * component has it, since the component gets an accessor with that name. Shared by the compiler, which reports the
 * message, and by the runtime, which throws it, so that both check the same rules in the same order.
 *
 * @param declared - Whether the directive declares the input, by the name the templates bind it with.
 * @param input - Whether the component, or another host directive, already has an input with the name.
 * @param member - Whether the component already has a member with the name.
 * @param name - The name of the input in the directive.
 * @param alias - The name it is exposed with.
 * @param className - The name of the class of the component.
 * @param directiveName - The name of the class of the directive.
 * @returns The message, `undefined` when the input can be exposed.
 */
export function describeInputExposure(declared: boolean, input: boolean, member: boolean, name: string, alias: string, className: string, directiveName: string | undefined): string | undefined {
  if (!declared) {
    return `${directiveName} does not declare an input named "${name}"`;
  }

  if (input) {
    return `${className} already has an input named "${alias}", which ${directiveName} cannot expose`;
  }

  return member ? `${className} already has a member named "${alias}", which ${directiveName} cannot expose as an input` : undefined;
}

/**
 * Describes why an event of a host directive cannot be exposed on its component, checking in order that the directive
 * declares it and that no event of the component nor another exposed event has the name. Shared by the compiler and by
 * the runtime, as {@link describeInputExposure}.
 *
 * @param declared - Whether the directive declares the event.
 * @param event - Whether the component, or another host directive, already has an event with the name.
 * @param name - The name of the event in the directive.
 * @param alias - The name it is exposed with.
 * @param className - The name of the class of the component.
 * @param directiveName - The name of the class of the directive.
 * @returns The message, `undefined` when the event can be exposed.
 */
export function describeEventExposure(declared: boolean, event: boolean, name: string, alias: string, className: string, directiveName: string | undefined): string | undefined {
  if (!declared) {
    return `${directiveName} does not declare an event named "${name}"`;
  }

  return event ? `${className} already has an event named "${alias}", which ${directiveName} cannot expose` : undefined;
}
