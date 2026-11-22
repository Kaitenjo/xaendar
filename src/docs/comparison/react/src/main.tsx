import { createRoot } from 'react-dom/client';
import '../../shared/base.css';
import '../../shared/button.css';
import '../../shared/field.css';
import '../../shared/page.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
