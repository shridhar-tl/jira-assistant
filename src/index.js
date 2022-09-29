import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, BrowserRouter } from 'react-router-dom';
import './common/extensions';
import './common/linq';
import App from './App';
import { isWebBuild } from './constants/build-info';
import './index.scss';
//import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
const Router = isWebBuild && !window.location.hash ? BrowserRouter : HashRouter;
root.render(<Router><App /></Router>);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
