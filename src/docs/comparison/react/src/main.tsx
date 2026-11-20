import { createRoot } from 'react-dom/client';
import '../../shared/base.css';
import '../../shared/button.css';
import '../../shared/field.css';
import '../../shared/page.css';
import { mountTelemetry } from '../../shared/telemetry';
import { App } from './App';

mountTelemetry('React');
createRoot(document.getElementById('root')!).render(<App />);
