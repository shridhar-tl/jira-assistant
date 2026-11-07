import classNames from 'classnames';
import type { ServiceContainer } from 'fluxo-ui/services';

import { PokerApp } from 'planning-poker/ui';
import 'planning-poker/styles.css';
import './poker-theme.css';

interface PokerViewProps {
    container: ServiceContainer;
    basePath: string;
    className: string;
}

export default function PokerView({ container, basePath, className }: PokerViewProps) {
    return (
        <div className={classNames('flex w-full flex-col', className)}>
            <PokerApp container={container} basePath={basePath} />
        </div>
    );
}
