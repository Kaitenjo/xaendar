_render() {
  const label0 = document.createElement("label");
  label0.setAttribute('for', this.id);
  label0.setAttribute('aria-label', this.label);
  label0.setAttribute('placeholder', this.placeholder);
  label0.addEventListener("input", ($event) => this.onInput.bind(this));
  this._root.appendChild(label0);
  const label0_text0 = document.createTextNode(this.label);
  label0.appendChild(label0_text0);
  
  const test = this.user.name;
  
  this.control_flow_if_2();
  
  this.control_flow_for_3();
  
  this.control_flow_switch_4();
  
  this.control_flow_switch_5();
  
  const input6 = document.createElement("input");
  input6.setAttribute('id', this.id);
  input6.setAttribute('type', "text");
  input6.setAttribute('value', this.`${value} asd test`);
  input6.setAttribute('placeholder', this.placeholder);
  input6.addEventListener("change", ($event) => this.onChange($event).bind(this));
  this._root.appendChild(input6);
  
}

control_flow_if_2() {
  if ((this.a || this.b) && this.c || this.id !== 'boolean' || this.pippo instanceof HTMLElement || this.id && this.id.length > 0) {
    const test2 = this.user.name;
    const test3 = this.user.name;
    const span2_2 = document.createElement("span");
    this._root.appendChild(span2_2);
    const span2_2_text0 = document.createTextNode("Id is present");
    span2_2.appendChild(span2_2_text0);
  } else if (true) {
    const span2_0 = document.createElement("span");
    this._root.appendChild(span2_0);
    const span2_0_text0 = document.createTextNode("Id is missing");
    span2_0.appendChild(span2_0_text0);
    this.control_flow_if_2_1();
  }
}

control_flow_for_3() {
  const items3 = this.items;
  for (let i3 = 0; i3 < items3.length; i3++) {
    const item = items3[i3];
    const i = i3;
    const $first = i3 === 0;
    const $last = i3 === items3.length - 1;
    const $even = i3 % 2 === 0;
    const $odd = i3 % 2 !== 0;
    
    const test3 = this.user.name;
    const div3_1 = document.createElement("div");
    this._root.appendChild(div3_1);
    const div3_1_text0 = document.createTextNode(item);
    div3_1.appendChild(div3_1_text0);
  }
}

control_flow_switch_4() {
  switch (this.status) {
    case 'loading':
    case 'error': {
      const div4_0_0 = document.createElement("div");
      this._root.appendChild(div4_0_0);
      const div4_0_0_text0 = document.createTextNode("Loading...");
      div4_0_0.appendChild(div4_0_0_text0);
      break;
    }
    default: {
      const div4_0_0 = document.createElement("div");
      this._root.appendChild(div4_0_0);
      const div4_0_0_text0 = document.createTextNode("Content");
      div4_0_0.appendChild(div4_0_0_text0);
      break;
    }
  }
}

control_flow_switch_5() {
  switch (this.status) {
    case 'loading': {
      const div5_0_0 = document.createElement("div");
      this._root.appendChild(div5_0_0);
      const div5_0_0_text0 = document.createTextNode("Loading...");
      div5_0_0.appendChild(div5_0_0_text0);
      break;
    }
    case 'error': {
      const div5_0_0 = document.createElement("div");
      this._root.appendChild(div5_0_0);
      const div5_0_0_text0 = document.createTextNode("Error!");
      div5_0_0.appendChild(div5_0_0_text0);
      break;
    }
    default: {
      const div5_0_0 = document.createElement("div");
      this._root.appendChild(div5_0_0);
      const div5_0_0_text0 = document.createTextNode("Content");
      div5_0_0.appendChild(div5_0_0_text0);
      break;
    }
  }
}

control_flow_if_2_1() {
  if ((this.a || this.b) && this.c || this.id !== 'boolean' || this.pippo instanceof HTMLElement || this.id && this.id.length > 0) {
    const test2 = this.user.name;
    const test3 = this.user.name;
    const span2_1_2 = document.createElement("span");
    this._root.appendChild(span2_1_2);
    const span2_1_2_text0 = document.createTextNode("Id is present");
    span2_1_2.appendChild(span2_1_2_text0);
  } else {
    const span2_1_0 = document.createElement("span");
    this._root.appendChild(span2_1_0);
    const span2_1_0_text0 = document.createTextNode("Id is missing");
    span2_1_0.appendChild(span2_1_0_text0);
    this.control_flow_if_2_1_1();
  }
}

control_flow_if_2_1_1() {
  if ((this.a || this.b) && this.c || this.id !== 'boolean' || this.pippo instanceof HTMLElement || this.id && this.id.length > 0) {
    const test2 = this.user.name;
    const test3 = this.user.name;
    const span2_1_1_2 = document.createElement("span");
    this._root.appendChild(span2_1_1_2);
    const span2_1_1_2_text0 = document.createTextNode("Id is present");
    span2_1_1_2.appendChild(span2_1_1_2_text0);
  } else {
    const span2_1_1_0 = document.createElement("span");
    this._root.appendChild(span2_1_1_0);
    const span2_1_1_0_text0 = document.createTextNode("Id is missing");
    span2_1_1_0.appendChild(span2_1_1_0_text0);
  }
}