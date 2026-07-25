import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Telegram detection is done in index.html inline script.
// This just renders the app.
// App.tsx will check localStorage for telegram data.

createRoot(document.getElementById('root')!).render(<App />);
