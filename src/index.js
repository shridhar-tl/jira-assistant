import React from 'react';
import ReactDOM from 'react-dom';
import './common/extensions';
import './common/linq';
import './index.scss';
import App from './App';
import { HashRouter } from 'react-router-dom';
import * as serviceWorker from './serviceWorker';

if (window.name === "oAuthHandler") {
    const opener = window.opener;
    if (opener) {
        const handler = opener["oAuthHandler"];
        handler(window.location.hash);
        window.close();
    }
}

ReactDOM.render(<HashRouter><App /></HashRouter>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
