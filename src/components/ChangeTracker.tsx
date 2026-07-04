import { useEffect } from 'react';

interface ChangeTrackerProps {
    enabled?: boolean;
    onChange: () => void;
}

function ChangeTracker({ enabled = true, onChange }: ChangeTrackerProps) {
    useEffect(() => {
        if (enabled) {
            onChange();
        }
    }, []);

    return null;
}

export default ChangeTracker;
