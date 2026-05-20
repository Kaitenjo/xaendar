
const shadow = this.shadowRoot!;

if (this.status === 1) {
  const node0_t_c0 = document.createElement("div");
  shadow.appendChild(node0_t_c0);
  const node0_t_c0_c0 = document.createTextNode("One");
  node0_t_c0.appendChild(node0_t_c0_c0);
} else if (this.status === 2) {
  const node0_e_c0 = document.createElement("div");
  shadow.appendChild(node0_e_c0);
  const node0_e_c0_c0 = document.createTextNode("Two");
  node0_e_c0.appendChild(node0_e_c0_c0);
} else if (this.status === 3) {
  const node0_e_c0 = document.createElement("div");
  shadow.appendChild(node0_e_c0);
  const node0_e_c0_c0 = document.createTextNode("Three");
  node0_e_c0.appendChild(node0_e_c0_c0);
} else {
  const node0_e_c0 = document.createElement("div");
  shadow.appendChild(node0_e_c0);
  const node0_e_c0_c0 = document.createTextNode("Other");
  node0_e_c0.appendChild(node0_e_c0_c0);
}