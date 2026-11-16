import { appVersionNo } from '@/constants/build-info';
import { ContactUsUrl, SetupVideoUrl, WebSiteUrl } from '@/constants/urls';
import Link from '@/controls/Link';
import config from '@/customize';

const currentYear = new Date().getFullYear();
const showContactForm = config.modules.contactUs !== false;
const showYouTube = config.features.header.youtubeHelp !== false;
const showSupport = showContactForm || showYouTube;

function IntegrateFooter() {
    return (
        <div className="px-4 py-2.5 sm:px-8 sm:py-4 border-t border-(--border-primary) bg-(--bg-secondary)">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                <span>
                    &copy; 2016-{currentYear} <Link href={showSupport ? WebSiteUrl : '#'}>Jira Assistant</Link> v{appVersionNo}
                </span>
                {showSupport && (
                    <div className="flex items-center gap-4">
                        {showYouTube && (
                            <Link
                                href={SetupVideoUrl}
                                className="inline-flex items-center gap-1 whitespace-nowrap hover:text-(--text-primary) transition-colors"
                            >
                                <i className="fa-brands fa-youtube" /> Help setup
                            </Link>
                        )}
                        {showContactForm && (
                            <Link
                                href={`${ContactUsUrl}?entry.1426640786=${appVersionNo}&entry.972533768=${navigator.userAgent}`}
                                className="inline-flex items-center gap-1 whitespace-nowrap hover:text-(--text-primary) transition-colors"
                            >
                                <i className="fa fa-phone" /> Contact us
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default IntegrateFooter;
