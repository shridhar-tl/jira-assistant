import React, { useCallback } from 'react';

export function ShowMoreLink({ showMore, setShowMore }) {
    const toggleMore = useCallback(() => setShowMore(!showMore), [showMore, setShowMore]);
    return (<div onClick={toggleMore} className="show-more-link">
        <span className={showMore ? 'fa fa-caret-down' : 'fa fa-caret-right'} />
        <span className="link">{showMore ? 'Hide options' : 'Show more options'}</span>
    </div>);
}