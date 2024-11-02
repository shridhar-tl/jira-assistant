import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, BrowserRouter } from 'react-router-dom';
import './common/extensions';
import './common/linq';
import App from './App';
import { isWebBuild } from './constants/build-info';
import './scss/style.scss';

const root = ReactDOM.createRoot(document.getElementById('root'));
const Router = isWebBuild && !window.location.hash ? BrowserRouter : HashRouter;
root.render(<Router><App /></Router>);
