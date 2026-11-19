import { CustomElement, Query, WebComponent } from '@xaendar/core';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Clones a standard `<template>` element of its template with the API of the DOM, as code outside of Xaendar would.
 */
@WebComponent({
  selector: 'ex-standard-template',
  styleUrl: './standard-template.css',
  templateUrl: './standard-template.xd.component.html'
})
export class StandardTemplateComponent extends CustomElement {
  /**
   * The `<template>` element, named by the ref #row.
   */
  @Query.refRequired<HTMLTemplateElement>('row')
  public accessor row!: QuerySignal<HTMLTemplateElement>;
  /**
   * The list the clones are appended to, named by the ref #list.
   */
  @Query.refRequired<HTMLUListElement>('list')
  public accessor list!: QuerySignal<HTMLUListElement>;

  /**
   * Appends a clone of the content of the template to the list, numbering it.
   */
  public add(): void {
    const list = this.list();
    const clone = this.row().content.cloneNode(true) as DocumentFragment;
    clone.querySelector('.number')!.textContent = `${list.children.length + 1}`;
    list.append(clone);
  }
}
