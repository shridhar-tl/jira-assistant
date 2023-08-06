import { Link as RouterLink } from 'react-router-dom';
import { router } from '@forge/bridge';

const Link = function ({ href, newTab, children, ...others }) {
    if (newTab !== false) {
        others.target = '_blank';
        others.rel = 'noreferrer';

        return (<a href={href} {...others} onClick={stopPropagation}>{children}</a>);
    } else {
        return (<RouterLink to={href} {...others}>{children}</RouterLink>);
    }
};

export default Link;

function stopPropagation(e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.currentTarget.href) {
        router.open(e.currentTarget.href).catch(console.error);
    }
}