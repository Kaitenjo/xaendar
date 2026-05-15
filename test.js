
const shadow = this.shadowRoot!;

const node0 = document.createElement("label");
node0.setAttribute('for', this.id);
node0.setAttribute('aria-label', this.label);
shadow.appendChild(node0);
const node0_c0 = document.createTextNode(String(this.label));
node0.appendChild(node0_c0);
if (this.id) {
  const node1_t0 = document.createElement("span");
  shadow.appendChild(node1_t0);
  const node1_t0_c0 = document.createTextNode("Id is present");
  node1_t0.appendChild(node1_t0_c0);
} else {
  const node1_e0 = document.createElement("span");
  shadow.appendChild(node1_e0);
  const node1_e0_c0 = document.createTextNode("Id is missing");
  node1_e0.appendChild(node1_e0_c0);
}
for (const item of this.items) {
  const node2_f0 = document.createElement("div");
  shadow.appendChild(node2_f0);
  const node2_f0_c0 = document.createTextNode(String(this.item));
  node2_f0.appendChild(node2_f0_c0);
}
switch (this.status) {
  case 'loading': {
    const node3_s0_0 = document.createElement("div");
    shadow.appendChild(node3_s0_0);
    const node3_s0_0_c0 = document.createTextNode("Loading...");
    node3_s0_0.appendChild(node3_s0_0_c0);
    break;
  }
  case 'error': {
    const node3_s0_0 = document.createElement("div");
    shadow.appendChild(node3_s0_0);
    const node3_s0_0_c0 = document.createTextNode("Error!");
    node3_s0_0.appendChild(node3_s0_0_c0);
    break;
  }
  default: {
    const node3_s0_0 = document.createElement("div");
    shadow.appendChild(node3_s0_0);
    const node3_s0_0_c0 = document.createTextNode("Content");
    node3_s0_0.appendChild(node3_s0_0_c0);
    break;
  }
}
const node4 = document.createElement("input");
node4.setAttribute('id', this.id);
node4.setAttribute('type', "text");
node4.setAttribute('value', this.value + '' + 'asd' + ' ' + "test" );
node4.setAttribute('placeholder', this.placeholder);
node4.addEventListener("change", this.onChange($event).bind(this));
shadow.appendChild(node4);