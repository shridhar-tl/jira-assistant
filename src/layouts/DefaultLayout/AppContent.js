import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import routes from '../../routes';
import { withRouter } from '../../pollyfills';
import './AppContent.scss';

function AppContent(props) {
    return (
        <DndProvider backend={HTML5Backend}>
            <section role="main" className="content-body">
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
            </section>
        </DndProvider>
    );
}

export default React.memo(AppContent);