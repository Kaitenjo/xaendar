@Property(0, { transform: (value: string) => Number(value) })
public accessor size!: InputSignal<number>;

// In a template: size="21"
// ✗ Type 'string' does not satisfy the expected type 'number'.
// The template is checked against InputSignal<number>: the type accepted by transform is not considered.
