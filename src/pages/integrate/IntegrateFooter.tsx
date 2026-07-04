import { appVersionNo } from '@/constants/build-info';
import { ContactUsUrl, WebSiteUrl } from '@/constants/urls';
import Link from '@/controls/Link';
import config from '@/customize';

const currentYear = new Date().getFullYear();
const showContactForm = config.modules.contactUs !== false;
const showYouTube = config.features.header.youtubeHelp !== false;
const showSupport = showContactForm || showYouTube;

function IntegrateFooter() {
    return (
        <div className="px-6 py-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                <span>
                    &copy; 2016-{currentYear} <Link href={showSupport ? WebSiteUrl : '#'}>Jira Assistant</Link> v{appVersionNo}
                </span>
                {showSupport && (
                    <div className="flex items-center gap-3">
                        {showYouTube && (
                            <Link
                                href="https://www.youtube.com/embed/HsWq7cT3Qq0?rel=0&autoplay=1&showinfo=0&cc_load_policy=1"
                                className="hover:text-[var(--text-primary)] transition-colors"
                            >
                                <i className="fa-brands fa-youtube mr-1" /> Help setup
                            </Link>
                        )}
                        {showContactForm && (
                            <Link
                                href={`${ContactUsUrl}?entry.1426640786=${appVersionNo}&entry.972533768=${navigator.userAgent}`}
                                className="hover:text-[var(--text-primary)] transition-colors"
                            >
                                <i className="fa fa-phone mr-1" /> Contact us
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default IntegrateFooter;
