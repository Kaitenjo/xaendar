import { Event } from "../decorators/event.decorator";
import { Property } from "../decorators/property.decorator";
import { WebComponent } from "../decorators/web-component/web-component.decorator";
import { BaseWebComponent } from "../directives/base-web-component";
import { Output } from "../models/event/output.type";

@WebComponent('mock-web-component')
export class MockWebComponent extends BaseWebComponent {
  
  @Property()
  public accessor mockProperty = 'default';

  @Event()
  public accessor mockEvent!: Output<string>;

  public template(): string {
    throw new Error("Method not implemented.");
  }

  public css(): string {
    throw new Error("Method not implemented.");
  }
}