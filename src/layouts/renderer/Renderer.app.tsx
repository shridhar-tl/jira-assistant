import { lazy } from 'react';

import { Route, Routes } from 'react-router-dom';

import type { RendererProps } from './types';

const DefaultLayout = lazy(() => import('../default-layout/DefaultLayout'));
const AuthenticatePage = lazy(() => import('@pages/authenticate/AuthenticatePage'));
const BasicAuthPage = lazy(() => import('@pages/authenticate/BasicAuthPage'));
const OptionsPage = lazy(() => import('@pages/settings/global/GlobalSettings'));
const PokerPage = lazy(() => import('@pages/poker/PokerPage'));

export default function Renderer({ authInfo, authTypeChosen, contextProps }: RendererProps) {
    const userId = authInfo && authInfo.userId;

    return (
        <Routes>
            <Route path="/integrate" element={<AuthenticatePage onAuthTypeChosen={authTypeChosen} />} />
            <Route path="/integrate/basic" element={<BasicAuthPage />} />
            <Route path="/integrate/basic/:store" element={<BasicAuthPage />} />
            <Route path="/options" element={<OptionsPage />} />
            <Route path="/poker/*" element={<PokerPage hasExtensionSupport />} />
            {!!userId && <Route path="/:userId/*" element={<DefaultLayout key={userId} />} />}
        </Routes>
    );
}
