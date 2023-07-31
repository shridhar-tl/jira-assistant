import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { DndProvider } from 'src/controls';
import routes from '../../routes';
import { withRouter } from '../../pollyfills';

function AppContent(props) {
    return (
        <DndProvider>
            <main className="main">
                <div className="container-fluid">
                    <Suspense fallback={props.loader()}>
                        <Routes>
                            {routes.map((route, idx) => {
                                const Component = withRouter(route.component);
                                return (
                                    <Route
                                        key={idx}
                                        path={route.path}
                                        exact={route.exact || false}
                                        name={route.name}
                                        element={<Component />} />
                                );
                            })}
                        </Routes>
                    </Suspense>
                </div>
            </main>
        </DndProvider>
    );
}

export default React.memo(AppContent);