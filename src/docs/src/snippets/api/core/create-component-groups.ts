createComponent(BadgeComponent, {
  target: this.list,
  properties: [
    // Bound as long as the component lives
    { label: () => this.label() },
    // Bound only while the condition holds: then count goes back to its default value
    { condition: () => this.showCount(), count: () => this.count() }
  ],
  events: [
    // An output of the component, with its detail typed
    { selected: event => this.select(event.detail) },
    // A native event, listened to only while the condition holds
    { condition: () => this.editable(), dblclick: () => this.edit() }
  ]
});
