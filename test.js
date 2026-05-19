
const shadow = this.shadowRoot!;

const node0 = document.createElement("label");
node0.setAttribute('for', this.id);
node0.setAttribute('aria-label', this.label);
shadow.appendChild(node0);
const node0_c0 = document.createTextNode(this.label);
node0.appendChild(node0_c0);
const test = user.name;
if ((this.a || this.b) && this.c || this.id !== 'boolean' || this.pippo instanceof HTMLElement || this.id && this.id.length > 0) {
  const test2 = user.name;
  const test3 = user.name;
  const node2_t2 = document.createElement("span");
  shadow.appendChild(node2_t2);
  const node2_t2_c0 = document.createTextNode("Id is present");
  node2_t2.appendChild(node2_t2_c0);
} else {
  const node2_e0 = document.createElement("span");
  shadow.appendChild(node2_e0);
  const node2_e0_c0 = document.createTextNode("Id is missing");
  node2_e0.appendChild(node2_e0_c0);
  if ((this.a || this.b) && this.c || this.id !== 'boolean' || this.pippo instanceof HTMLElement || this.id && this.id.length > 0) {
    const test2 = user.name;
    const test3 = user.name;
    const node2_e1_t2 = document.createElement("span");
    shadow.appendChild(node2_e1_t2);
    const node2_e1_t2_c0 = document.createTextNode("Id is present");
    node2_e1_t2.appendChild(node2_e1_t2_c0);
  } else {
    const node2_e1_e0 = document.createElement("span");
    shadow.appendChild(node2_e1_e0);
    const node2_e1_e0_c0 = document.createTextNode("Id is missing");
    node2_e1_e0.appendChild(node2_e1_e0_c0);
    if ((this.a || this.b) && this.c || this.id !== 'boolean' || this.pippo instanceof HTMLElement || this.id && this.id.length > 0) {
      const test2 = user.name;
      const test3 = user.name;
      const node2_e1_e1_t2 = document.createElement("span");
      shadow.appendChild(node2_e1_e1_t2);
      const node2_e1_e1_t2_c0 = document.createTextNode("Id is present");
      node2_e1_e1_t2.appendChild(node2_e1_e1_t2_c0);
    } else {
      const node2_e1_e1_e0 = document.createElement("span");
      shadow.appendChild(node2_e1_e1_e0);
      const node2_e1_e1_e0_c0 = document.createTextNode("Id is missing");
      node2_e1_e1_e0.appendChild(node2_e1_e1_e0_c0);
    }
  }
}
const node3_items = this.items;
for (let $i_node3 = 0; $i_node3 < node3_items.length; $i_node3++) {
  const item = node3_items[$i_node3];
  const i = $i_node3;
  const $first = $i_node3 === 0;
  const $last = $i_node3 === node3_items.length - 1;
  const $even = $i_node3 % 2 === 0;
  const $odd = $i_node3 % 2 !== 0;
  
  const test3 = user.name;
  const node3_f1 = document.createElement("div");
  shadow.appendChild(node3_f1);
  const node3_f1_c0 = document.createTextNode(item);
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