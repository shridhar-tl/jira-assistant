import React, { useEffect, useState } from 'react';
import { inject } from '../../services/injector-service';
import getLoader from '../../components/loader';
import '../../scss/_custom.scss';

const withAuthInfo = function (Component) {
    const AuthComponent = function (props) {
        const [authInfo, setAuthInfo] = useState(false);

        useEffect(() => { authenticateUser().then(setAuthInfo); }, []); // eslint-disable-line react-hooks/exhaustive-deps

        if (!authInfo) {
            return getLoader('Loading... Please wait...');
        }

        return (<Component {...props} authInfo={authInfo} />);
    };

    return React.memo(AuthComponent);
};

export default withAuthInfo;

async function authenticateUser() {
    const { $auth } = inject('AuthService');

    const authenticated = await $auth.authenticate(null, false);
    return { authenticated };
}