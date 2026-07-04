import { lazy } from 'react';

import { Route, Routes } from 'react-router-dom';

import type { RendererProps } from './types';

const DefaultLayout = lazy(() => import('../default-layout/DefaultLayout'));
const IntegratePage = lazy(() => import('@pages/integrate/IntegratePage'));
const BasicAuthPage = lazy(() => import('@pages/authenticate/BasicAuthPage'));
const OptionsPage = lazy(() => import('@pages/settings/global/GlobalSettings'));

export default function Renderer({ authInfo }: RendererProps) {
    const userId = authInfo && authInfo.userId;

    return (
        <Routes>
            <Route path="/integrate" element={<IntegratePage />} />
            <Route path="/integrate/basic" element={<BasicAuthPage />} />
            <Route path="/integrate/basic/:store" element={<BasicAuthPage />} />
            <Route path="/options" element={<OptionsPage />} />
            {!!userId && <Route path="/:userId/*" element={<DefaultLayout key={userId} />} />}
        </Routes>
    );
}
