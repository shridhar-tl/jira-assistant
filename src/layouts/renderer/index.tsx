import { Suspense, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { CustomDialog } from '@dialogs';

import { AppContextProvider } from '@/common/context';

import type SessionService from '@services/session-service';

import { BlockLoading } from '@components';

import Renderer from './Renderer';
import type { AppContextValue, RendererProps } from './types';

interface RootContextProps extends RendererProps {
    switchUser?: (url: string) => void;
    $session?: SessionService;
}

export default function RootContext({ $session, switchUser, ...otherProps }: RootContextProps) {
    const location = useLocation();
    const navigate = useNavigate();

    const [contextProps] = useState<AppContextValue>(() => ({
        switchUser: (userId: number) => {
            let url = location.pathname.substring(2);
            url = url.substring(url.indexOf('/'));
            url = `/${userId}${url}`;
            switchUser?.(url);
        },
        navigate: (url: string, userbased?: boolean) => {
            navigate(userbased ? `/${$session?.userId}${url}` : url);
        },
    }));

    return (
        <AppContextProvider value={contextProps}>
            <Suspense fallback={<BlockLoading text="Loading... Please wait..." />}>
                <Renderer contextProps={contextProps} {...otherProps} />
                <CustomDialog />
            </Suspense>
        </AppContextProvider>
    );
}
