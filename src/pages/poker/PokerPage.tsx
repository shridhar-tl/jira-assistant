import { useEffect, useState } from 'react';

import { useParams } from 'react-router';

import type { ServiceContainer } from 'fluxo-ui/services';

import { BlockLoading } from '@components';

import { pokerBasePath } from './constants';
import createPokerHostContainer from './create-container';
import PokerView from './PokerView';

const startFailureMessage = 'Planning poker could not start. Please reload the page.';

export default function PokerPage() {
    const { userId } = useParams();
    const [container, setContainer] = useState<ServiceContainer | null>(null);
    const [failure, setFailure] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        createPokerHostContainer()
            .then((created) => {
                if (active) {
                    setContainer(created);
                }
            })
            .catch((error) => {
                console.error('Planning poker could not start', error);
                if (active) {
                    setFailure(startFailureMessage);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    if (failure) {
        return <div className="p-6 text-(--text-primary)">{failure}</div>;
    }

    if (container === null) {
        return <BlockLoading text="Loading planning poker..." />;
    }

    return <PokerView container={container} basePath={`/${userId}${pokerBasePath}`} className="h-[calc(100vh-3rem)]" />;
}
