createComponent(BadgeComponent, {
  target: this.list,
  directives: [
    // Applied as long as the component lives
    TooltipDirective,
    // Applied while the condition holds, a new instance each time it holds again
    {
      directive: HighlightDirective,
      condition: () => this.highlighted(),
      properties: [{ color: () => this.color() }],
      events: [{ toggled: event => this.onToggled(event.detail) }]
    }
  ]
});
