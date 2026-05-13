
import { describe, expect, it } from "vitest";
import { MyButtonComponent } from './myButton.xd.component';

describe('MyButtonComponent', () => {
  it('should create', () => {
    const component = new MyButtonComponent();
    expect(component).toBeTruthy();
  });
});
