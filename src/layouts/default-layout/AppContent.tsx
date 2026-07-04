import { Suspense, memo } from 'react';

import { Route, Routes } from 'react-router-dom';

import { DragDropProvider } from 'fluxo-ui';

import { BlockLoading } from '@/components/Loading';

import routes from '../../routes';

function AppContent() {
    return (
        <DragDropProvider>
            <Suspense fallback={<BlockLoading />}>
                <Routes>
                    {routes.map((route, idx: number) => {
                        const Component = route.component;
                        return <Route key={idx} path={route.path} element={<Component />} />;
                    })}
                </Routes>
            </Suspense>
        </DragDropProvider>
    );
}

export default memo(AppContent);
