// Listed in the setupFiles of the Vitest configuration: it runs before every spec file, and before its imports
import { loadSignals } from '@xaendar/signals';

loadSignals();
