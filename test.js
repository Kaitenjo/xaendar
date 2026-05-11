
const shadow = this.shadowRoot!;

const node0 = document.createElement("label");
node0.setAttribute('for', this.id);
node0.setAttribute('aria-label', this.label);
shadow.appendChild(node0);
if (this.id) {
  const node1_t0 = document.createElement("span");
  shadow.appendChild(node1_t0);
} else {
  const node1_e0 = document.createElement("span");
  shadow.appendChild(node1_e0);
}
for (const item of this.items) {
  const node2_f0 = document.createElement("div");
  shadow.appendChild(node2_f0);
}
switch (this.status) {
  case 'loading': {
    const node3_s0_0 = document.createElement("div");
    shadow.appendChild(node3_s0_0);
    break;
  }
  case 'error': {
    const node3_s0_0 = document.createElement("div");
    shadow.appendChild(node3_s0_0);
    break;
  }
  default: {
    const node3_s0_0 = document.createElement("div");
    shadow.appendChild(node3_s0_0);
    break;
  }
}
const node4 = document.createElement("input");
node4.setAttribute('id', this.id);
node4.setAttribute('type', "text");
node4.setAttribute('value', this.value + '' + 'asd' + ' ' + "test" );
node4.setAttribute('placeholder', this.placeholder);
node4.addEventListener(change, this.onChange($event).bind(this));
shadow.appendChild(node4);