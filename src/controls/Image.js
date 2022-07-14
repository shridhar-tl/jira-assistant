import React, { PureComponent } from 'react';
import classNames from 'classnames';

class Image extends PureComponent {
    render() {
        const { src } = this.props;

        if (!src || getPathName(src).length < 3) { return null; }

        const { alt = "", className, title } = this.props;

        return (
            <img src={src} alt={alt} title={title}
                className={classNames('img-x16', className)}
            />
        );
    }
}

export default Image;

function getPathName(src) {
    try {
        return new URL(src).pathname;
    }
    catch (err) {
        console.warn('Invalid URL Passed: ', src, err);
    }
    return '';
}