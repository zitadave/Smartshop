import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Telegram detection is done in index.html inline script (runs sooner)
// main.tsx just renders the app
createRoot(document.getElementById('root')!).render(<App />);
