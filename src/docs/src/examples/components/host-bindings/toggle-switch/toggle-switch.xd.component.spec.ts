import { afterEach, describe, expect, it } from 'vitest';
import { ToggleComponent } from './toggle.xd.component';
import { ToggleSwitchComponent } from './toggle-switch.xd.component';

/**
 * Waits for the effects, which run again in a microtask.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the example in the document.
 */
function mount(): { element: ToggleSwitchComponent, airplane: ToggleComponent, wifi: ToggleComponent } {
  const element = document.createElement('ex-toggle-switch');
  if (!(element instanceof ToggleSwitchComponent)) {
    throw new Error('ex-toggle-switch is not defined');
  }

  document.body.append(element);
  const [airplane, wifi] = Array.from(element.shadowRoot!.querySelectorAll('ex-toggle'));
  if (!(airplane instanceof ToggleComponent) || !(wifi instanceof ToggleComponent)) {
    throw new Error('ex-toggle is not defined');
  }

  return { element, airplane, wifi };
}

/**
 * Reads the attributes of a host bound by the example.
 */
function attributesOf(toggle: ToggleComponent) {
  return {
    role: toggle.getAttribute('role'),
    checked: toggle.getAttribute('aria-checked'),
    disabled: toggle.getAttribute('aria-disabled'),
    tabindex: toggle.getAttribute('tabindex'),
    locked: toggle.getAttribute('locked'),
    on: toggle.classList.contains('on')
  };
}

describe('ToggleSwitchComponent', () => {
  afterEach(() => document.body.replaceChildren());

  it('writes the role, the state and the focus order on the hosts once connected', () => {
    const { airplane } = mount();

    expect(attributesOf(airplane)).toEqual({ role: 'switch', checked: 'false', disabled: 'false', tabindex: '0', locked: null, on: false });
  });

  it('turns a switch on with a click on its host, and tells the parent', async () => {
    const { element, airplane } = mount();

    airplane.click();
    await flush();

    expect(airplane.on()).toBe(true);
    expect(element.airplane()).toBe(true);
    expect(attributesOf(airplane)).toMatchObject({ checked: 'true', on: true });
  });

  it('hears the clicks on the projected label, which bubble to the host', async () => {
    const { airplane } = mount();
    const label = document.createElement('b');
    airplane.append(label);

    label.click();
    await flush();

    expect(airplane.on()).toBe(true);
  });

  it('toggles with Space and Enter, preventing the default action, and ignores the other keys', () => {
    const { wifi } = mount();
    const space = new KeyboardEvent('keydown', { key: ' ', cancelable: true });

    wifi.dispatchEvent(space);
    expect(wifi.on()).toBe(true);
    expect(space.defaultPrevented).toBe(true);

    wifi.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(wifi.on()).toBe(false);

    wifi.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', cancelable: true }));
    expect(wifi.on()).toBe(false);
  });

  it('reflects the locked input on the host, and ignores the clicks while locked', async () => {
    const { airplane, wifi } = mount();

    airplane.click();
    await flush();
    expect(attributesOf(wifi)).toMatchObject({ locked: '', disabled: 'true', tabindex: '-1' });

    wifi.click();
    await flush();
    expect(wifi.on()).toBe(false);

    airplane.click();
    await flush();
    expect(attributesOf(wifi)).toMatchObject({ locked: null, disabled: 'false', tabindex: '0' });
  });

  it('removes the attributes, the class and the listeners when disconnected, and binds them again when connected', async () => {
    const { airplane } = mount();
    airplane.click();
    await flush();
    const parent = airplane.parentNode!;

    airplane.remove();
    expect(attributesOf(airplane)).toEqual({ role: null, checked: null, disabled: null, tabindex: null, locked: null, on: false });
    airplane.click();
    expect(airplane.on()).toBe(true);

    parent.append(airplane);
    expect(attributesOf(airplane)).toMatchObject({ role: 'switch', checked: 'true', on: true });
    airplane.click();
    await flush();
    expect(airplane.on()).toBe(false);
  });
});
