import { useEffect } from "react";
import {
    useLocation,
    useNavigate,
    useParams
} from "react-router-dom";

function withRouter(Component) {
    function ComponentWithRouterProp(props) {
        const location = useLocation();
        const navigate = useNavigate();
        const params = useParams();
        const match = { params };
        const history = { push: navigate };

        return (
            <Component
                {...props}
                location={location}
                match={match}
                navigate={navigate}
                history={history}
            />
        );
    }

    return ComponentWithRouterProp;
}
function getWatcher(onChange) {
    if (typeof onChange !== 'function') {
        throw Error('onChange handler is required and should be a function');
    }

    return function UrlWatcher() {
        const location = useLocation();

        useEffect(() => onChange(location), [location]);

        return null;
    };
}

export { withRouter, getWatcher };
