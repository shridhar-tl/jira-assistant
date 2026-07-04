import type { ComponentType } from 'react';

import { registerDepnServices } from '@services';

export function withInitParams<P>(App: ComponentType<P>): ComponentType<P> {
    registerDepnServices();
    return App;
}
