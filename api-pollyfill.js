const pushState = history.pushState;
const replaceState = history.replaceState;
function ja_disp() { window.dispatchEvent(new Event('ja-locationchange')); }
history.pushState = function () {
    pushState.apply(history, arguments);
    ja_disp();
};
history.replaceState = function () {
    replaceState.apply(history, arguments);
    ja_disp();
};
window.addEventListener('popstate', ja_disp);