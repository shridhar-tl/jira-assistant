import type { SprintCloser } from './sprint-closer';

interface SprintCloserCellProps {
    closer?: SprintCloser;
}

function SprintCloserCell({ closer }: SprintCloserCellProps) {
    if (!closer) {
        return null;
    }
    if (!closer.url) {
        return closer.name;
    }
    return (
        <a href={closer.url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            {closer.name}
        </a>
    );
}

export default SprintCloserCell;
