interface ShowMoreLinkProps {
    showMore: boolean;
    setShowMore: (value: boolean) => void;
}

export function ShowMoreLink({ showMore, setShowMore }: ShowMoreLinkProps) {
    return (
        <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
        >
            <i className={showMore ? 'fa fa-caret-down' : 'fa fa-caret-right'} />
            <span>{showMore ? 'Hide options' : 'Show more options'}</span>
        </button>
    );
}
