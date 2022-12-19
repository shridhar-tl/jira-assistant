import { router } from '@forge/bridge';

const Link = function ({ href, newTab, children, ...others }) {
    if (newTab !== false) {
        others.target = '_blank';
        others.rel = 'noreferrer';
    }

    return (<a href={href} {...others} onClick={stopPropagation}>{children}</a>);
};

export default Link;

function stopPropagation(e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.currentTarget.href) {
        router.open(e.currentTarget.href).catch(console.error);
    }
}