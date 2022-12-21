const Link = function ({ href, newTab, children, ...others }) {
    if (newTab !== false) {
        others.target = '_blank';
        others.rel = 'noreferrer';
    }

    return (<a href={href} {...others} onClick={stopPropagation}>{children}</a>);
};

export default Link;

function stopPropagation(e) { e.stopPropagation(); }