window.ga = window.ga || function () { (window.ga.q = window.ga.q || []).push(arguments); };
const ga = window.ga;
ga.l = +new Date();

if (process.env.NODE_ENV === "production") {
    ga('create', 'UA-108841109-1', 'auto');
} else {
    ga('create', 'UA-108841109-2', 'auto');
}
ga('set', 'checkProtocolTask', null);