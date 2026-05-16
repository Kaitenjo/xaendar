
const shadow = this.shadowRoot!;

const node0 = document.createElement("label");
node0.setAttribute('for', this.id);
node0.setAttribute('aria-label', this.label);
shadow.appendChild(node0);
const node0_c0 = document.createTextNode(this.label);
node0.appendChild(node0_c0);
const test = user.name;
if (this.id) {
  const test2 = user.name;
  const node2_t1 = document.createElement("span");
  shadow.appendChild(node2_t1);
  const node2_t1_c0 = document.createTextNode("Id is present");
  node2_t1.appendChild(node2_t1_c0);
} else {
  const node2_e0 = document.createElement("span");
  shadow.appendChild(node2_e0);
  const node2_e0_c0 = document.createTextNode("Id is missing");
  node2_e0.appendChild(node2_e0_c0);
}
for (const item of this.items) {
  const test3 = user.name;
  const node3_f1 = document.createElement("div");
  shadow.appendChild(node3_f1);
  const node3_f1_c0 = document.createTextNode(this.item);
  node3_f1.appendChild(node3_f1_c0);
}
switch (this.status) {
  case 'loading': {
    const node4_s0_0 = document.createElement("div");
    shadow.appendChild(node4_s0_0);
    const node4_s0_0_c0 = document.createTextNode("Loading...");
    node4_s0_0.appendChild(node4_s0_0_c0);
    break;
  }
  case 'error': {
    const node4_s0_0 = document.createElement("div");
    shadow.appendChild(node4_s0_0);
    const node4_s0_0_c0 = document.createTextNode("Error!");
    node4_s0_0.appendChild(node4_s0_0_c0);
    break;
  }
  default: {
    const node4_s0_0 = document.createElement("div");
    shadow.appendChild(node4_s0_0);
    const node4_s0_0_c0 = document.createTextNode("Content");
    node4_s0_0.appendChild(node4_s0_0_c0);
    break;
  }
}
const node5 = document.createElement("input");
node5.setAttribute('id', this.id);
node5.setAttribute('type', "text");
node5.setAttribute('value', this.value + '' + 'asd' + ' ' + "test" );
node5.setAttribute('placeholder', this.placeholder);
node5.addEventListener("change", this.onChange($event).bind(this));
shadow.appendChild(node5);