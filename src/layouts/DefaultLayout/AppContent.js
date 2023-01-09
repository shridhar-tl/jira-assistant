import React, { PureComponent, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import routes from '../../routes';
import { withRouter } from '../../pollyfills';

class AppContent extends PureComponent {
    render() {
        return (
            <DndProvider backend={HTML5Backend}>
                <div className="container-fluid">
                    <Suspense fallback={this.props.loader()}>
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
            </DndProvider>
        );
    }
}

export default AppContent;