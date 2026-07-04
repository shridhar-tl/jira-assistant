import { memo, useEffect, useState, type ComponentType } from 'react';

import { inject } from '@services';

import { BlockLoading } from '@components';

interface AuthInfo {
    authenticated: boolean;
}

export default function withSimpleAuth<P extends object>(Component: ComponentType<P>): ComponentType<P> {
    return memo(function SimpleAuthWrapper(props: P) {
        const [authInfo, setAuthInfo] = useState<AuthInfo | false>(false);

        useEffect(() => {
            authenticateUser().then(setAuthInfo);
        }, []);

        if (!authInfo) {
            return <BlockLoading text="Loading... Please wait..." />;
        }

        return <Component {...props} authInfo={authInfo} />;
    }) as ComponentType<P>;
}

async function authenticateUser(): Promise<AuthInfo> {
    const { $auth } = inject('AuthService');
    const authenticated = await $auth.authenticate(undefined, false);
    return { authenticated };
}
