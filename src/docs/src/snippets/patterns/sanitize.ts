// HTML coming from users, or from any source you do not control, must be sanitized before it is rendered.
// With a library such as DOMPurify:
import DOMPurify from 'dompurify';

public readonly html = computed(() => DOMPurify.sanitize(this.comment()));
