import { appVersionNo } from '@/constants/build-info';

import { inject } from '@services';

export default function FeedbackPage() {
    const { $session } = inject('SessionService');
    const cUser = $session.CurrentUser as any;

    const feedbackUrl = cUser?.feedbackUrl
        ?.replace('{0}', encodeURIComponent(cUser?.displayName || ''))
        .replace('{1}', encodeURIComponent(cUser?.emailAddress || ''))
        .replace('{2}', encodeURIComponent(appVersionNo))
        .replace('{3}', encodeURIComponent(navigator.userAgent));

    return <iframe src={feedbackUrl} title="Contact Us" className="w-full h-[calc(100vh-58px)] overflow-auto border-0" />;
}
