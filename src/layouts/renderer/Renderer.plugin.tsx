import { lazy } from 'react';

import { Route, Routes } from 'react-router';

import type { RendererProps } from './types';

const DefaultLayout = lazy(() => import('../default-layout/DefaultLayout'));
const OptionsPage = lazy(() => import('@pages/settings/global/GlobalSettings'));

export default function Renderer({ authInfo }: RendererProps) {
    const userId = authInfo && authInfo.userId;
    const layout = <DefaultLayout key={userId || undefined} />;

    return (
        <Routes>
            <Route path="/options" element={<OptionsPage />} />
            <Route path="/:userId/*" element={layout} />
        </Routes>
    );
}
