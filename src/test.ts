import { compile } from "@xaendar/compiler";
import { BaseWebComponent, Property, WebComponent } from "@xaendar/core";
import { loadSignals } from "@xaendar/signals";
import { writeFileSync } from "fs";
loadSignals();

let value = '';
const template = `
  <label for={id} aria-label={label} {placeholder} @input>
    {label}
  </label>
  @const test = user.name;
  
  @if ((a || b) && c || id !== 'boolean' || pippo instanceof HTMLElement || id && id.length > 0) {
    @const test2 = user.name;
    @const test3 = user.name;
    <span>Id is present</span>
  } @else if (true) {
    <span>Id is missing</span>
    @if ((a || b) && c || id !== 'boolean' || pippo instanceof HTMLElement || id && id.length > 0) {
      @const test2 = user.name;
      @const test3 = user.name;
      <span>Id is present</span>
    } @else {
      <span>Id is missing</span>
      @if ((a || b) && c || id !== 'boolean' || pippo instanceof HTMLElement || id && id.length > 0) {
        @const test2 = user.name;
        @const test3 = user.name;
        <span>Id is present</span>
      } @else {
        <span>Id is missing</span>
      }
    }
  }
      
  @for (item of items; track item.id; $index = i) {
    @const test3 = user.name;
    <div>{item}</div>
  }

  @switch (status) {
    @case ('loading')
    @case ('error') {
      <div>Loading...</div>
    }
    
    @default {
      <div>Content</div>
    }
  }

  @switch (status) {
    @case ('loading') {
      <div>Loading...</div>
    }
    
    @case ('error') {
      <div>Error!</div>
    }
    
    @default {
      <div>Content</div>
    }
  }
  <input id={id} type="text" value={value + 'test'} placeholder={placeholder} @change="onChange($event)" />
  `
const filePath = 'test.js'
writeFileSync(filePath, compile(template, ''));

@WebComponent({
  selector: 'backoffice-root',
  styleUrl: './backoffice-root.xd.component.css',
  templateUrl: './backoffice-root.xd.component.html'
})
export class BackofficeRootComponent extends BaseWebComponent {
  @Property()
  public label!: Signal.State<string>
  
  placeholder: string = '';
  value: string = 'stocazzo';

  onClick() {
    this.label.set(this.value);
  }

  onInput(event: InputEvent) {
    this.value = (event.target as HTMLInputElement).value;
  }
}