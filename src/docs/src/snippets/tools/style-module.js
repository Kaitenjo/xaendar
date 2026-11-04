// virtual:xaendar-style?path=…/user-card.xd.component.css — one module per CSS file
const sheet = new CSSStyleSheet();
sheet.replaceSync(":host{display:block}.name{font-weight:600}");

export { sheet };
