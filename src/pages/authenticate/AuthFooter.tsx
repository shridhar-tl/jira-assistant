import { appVersionNo } from '@/constants/build-info';
import { ContactUsUrl, WebSiteUrl } from '@/constants/urls';
import Link from '@/controls/Link';
import config from '@/customize';

const currentYear = new Date().getFullYear();
const showContactForm = config.modules.contactUs !== false;
const showYouTube = config.features.header.youtubeHelp !== false;
const showSupport = showContactForm || showYouTube;
const youtubeUrl = 'https://www.youtube.com/embed/HsWq7cT3Qq0?rel=0&autoplay=1&showinfo=0&cc_load_policy=1';
const contactUrl = `${ContactUsUrl}?entry.1426640786=${appVersionNo}&entry.972533768=${encodeURIComponent(navigator.userAgent)}`;

function AuthFooter() {
    return (
        <div className="px-6 sm:px-8 py-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]/60">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-[var(--text-tertiary)]">
                <span>
                    &copy; 2016-{currentYear}{' '}
                    <Link
                        href={showSupport ? WebSiteUrl : '#'}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        Jira Assistant
                    </Link>{' '}
                    v{appVersionNo}
                </span>
                {showSupport && (
                    <div className="flex items-center gap-4">
                        {showYouTube && (
                            <Link
                                href={youtubeUrl}
                                className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors flex items-center gap-1"
                            >
                                <i className="fa fa-play-circle" /> Help
                            </Link>
                        )}
                        {showContactForm && (
                            <Link
                                href={contactUrl}
                                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                            >
                                <i className="fa fa-envelope" /> Contact
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AuthFooter;
