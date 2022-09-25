import { Avatar } from 'primereact/avatar';
import { useState } from 'react';
import { Avatars, FallbackAvarar } from "./constants";
import { connect } from "./store";

function MemberAvatar({ avatarUrl, name, avatarId, onClick }) {
    const useEmogi = avatarId > 0 || avatarId === 0;
    const Icon = (useEmogi ? Avatars[avatarId] : FallbackAvarar);

    const emoji = (<Avatar label={Icon} shape="circle" size="xlarge" onClick={onClick} />);

    const [fb, setFallback] = useState({});

    if (!avatarUrl || getPathName(avatarUrl).length < 3) { return emoji || null; }

    const useFallbackEl = (el) => setFallback({ avatarUrl, fallback: true });

    if (fb.fallback && fb.avatarUrl === avatarUrl) {
        return emoji;
    }

    if (useEmogi) {
        return emoji;
    } else {
        return (<Avatar image={avatarUrl} shape="circle" size="xlarge" imageAlt={name} onImageError={useFallbackEl} onClick={onClick} />);
    }
}

export { MemberAvatar as Avatar };

export default connect(MemberAvatar, ({ sid, members }) => (members.filter(m => m.id === sid)[0]));

function getPathName(src) {
    try {
        return new URL(src).pathname;
    }
    catch (err) {
        console.warn('Invalid URL Passed: ', src, err);
    }
    return '';
}