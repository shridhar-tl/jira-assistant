import { useState } from 'react';

import { pokerBasePath } from './constants';
import createGuestPokerContainer from './create-guest-container';
import PokerView from './PokerView';

export default function GuestPokerPage() {
    const [container] = useState(createGuestPokerContainer);

    return <PokerView container={container} basePath={pokerBasePath} className="h-screen" />;
}
