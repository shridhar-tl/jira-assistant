import React, { useEffect } from "react";
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

        return (
            <Component
                {...props}
                location={location}
                match={match}
                navigate={navigate}
            />
        );
    }

    return React.memo(ComponentWithRouterProp);
}

const UrlWatcher = React.memo(function UrlWatcher({ onChange }) {
    const location = useLocation();

    useEffect(() => {
        onChange(location);
    }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
});

export { withRouter, UrlWatcher };
