import React from 'react';
import { Image } from '../controls';
import BaseControl from './BaseControl';

class UserDisplay extends BaseControl {
    renderControl(badge) {
        const { value, user = value, settings, imgClassName = 'img-x32' } = this.props;

        if (!user) { return badge; }

        if (typeof user === 'string') {
            return user;
        }

        const imageUrl = !!settings?.showImage && (user.avatarUrls?.['32x32'] || user.avatarUrls?.['48x48']);
        const valueType = settings?.valueType;

        let disp = user.displayName;

        if (valueType === 'email') {
            disp = user.emailAddress;
        }
        else if (valueType === 'both') {
            disp = (<>{user.displayName} ({user.emailAddress})</>);
        }

        return (<>{!!imageUrl && <Image className={`${imgClassName} rounded-circle me-2`} src={imageUrl} />}{disp}{badge}</>);
    }
}

export default UserDisplay;