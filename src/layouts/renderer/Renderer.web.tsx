import { lazy } from 'react';

import { Route, Routes } from 'react-router-dom';

import type { RendererProps } from './types';

const DefaultLayout = lazy(() => import('../default-layout/DefaultLayout'));
const AuthenticatePage = lazy(() => import('@pages/authenticate/AuthenticatePage'));
const IntegratePage = lazy(() => import('@pages/integrate/IntegratePage'));
const BasicAuthPage = lazy(() => import('@pages/authenticate/BasicAuthPage'));
const OptionsPage = lazy(() => import('@pages/settings/global/GlobalSettings'));
const PokerPage = lazy(() => import('@pages/poker/PokerPage'));

export default function Renderer({ initValue, authInfo, authTypeChosen, contextProps }: RendererProps) {
    const isExtnValid = initValue?.isExtnValid ?? false;
    const extnUnavailable = initValue?.extnUnavailable ?? true;
    const authType = initValue?.authType;
    const userId = authInfo && authInfo.userId;

    return (
        <Routes>
            <Route
                path="/integrate"
                element={
                    <AuthenticatePage
                        isExtnValid={isExtnValid}
                        extnUnavailable={extnUnavailable}
                        needIntegration={initValue?.needIntegration}
                        onAuthTypeChosen={authTypeChosen}
                    />
                }
            />
            <Route path="/integrate/extn" element={<IntegratePage setAuthType={authTypeChosen} />} />
            <Route path="/integrate/basic" element={<BasicAuthPage setAuthType={authTypeChosen} />} />
            <Route path="/integrate/basic/:store" element={<BasicAuthPage setAuthType={authTypeChosen} />} />
            <Route path="/options" element={<OptionsPage />} />
            <Route path="/poker/*" element={<PokerPage hasExtensionSupport={isExtnValid} />} />
            {!!authType && !!userId && <Route path="/:userId/*" element={<DefaultLayout key={userId} />} />}
        </Routes>
    );
}
