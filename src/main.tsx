import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { BrowserRouter, HashRouter } from 'react-router';

import { isQuickView, isWebBuild } from '@/constants/build-info';

import App from './App.tsx';
import './index.css';

const Router = isWebBuild ? BrowserRouter : HashRouter;

if (isQuickView) {
    document.body.classList.add('quick-view');
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Router>
            <App />
        </Router>
    </StrictMode>,
);
