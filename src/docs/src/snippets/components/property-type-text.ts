// todo.type.ts
export type Todo = { title: string; done: boolean };

// todo-item.xd.component.ts
import type { Todo } from './todo.type';

@Property.required()
public accessor todo!: InputSignal<Todo>;   // ✗ the parent templates cannot see Todo

@Property.required()
public accessor todo!: InputSignal<{ title: string; done: boolean }>;   // ✓ written inline
