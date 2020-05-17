import React from 'react';
import ReactDOM from 'react-dom';
import './common/extensions';
import './common/linq';
import './index.scss';
import App from './App';
import { HashRouter } from 'react-router-dom';
//import * as serviceWorker from './serviceWorker';

window.ga = window.ga || function () { (window.ga.q = window.ga.q || []).push(arguments); };
const ga = window.ga;
ga.l = +new Date();

if (process.env.NODE_ENV === "production") {
    ga('create', 'UA-108841109-1', 'auto');
} else {
    ga('create', 'UA-108841109-2', 'auto');
}
ga('set', 'checkProtocolTask', null);

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
//serviceWorker.unregister();
