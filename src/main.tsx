import { StrictMode } from 'react'
import './i18n'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')!;
const app = <StrictMode><App /></StrictMode>;
const path = window.location.pathname.replace(/\/$/, '') || '/';
if (root.dataset.prerenderPath === path && root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
