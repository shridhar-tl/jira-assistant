import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import './common/extensions';
import './common/linq';
import App from './App';
import './index.scss';
import '@atlaskit/css-reset';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Router><App /></Router>);
