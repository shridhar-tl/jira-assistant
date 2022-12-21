import React, { PureComponent } from 'react';
import { AppVersionNo } from '../../constants/common';
import { ContactUsUrl, WebSiteUrl } from '../../constants/urls';
import Link from '../../controls/Link';
import config from '../../customize';

const showContactForm = config.modules.contactUs !== false;
const showYouTube = config.features.header.youtubeHelp !== false;
const showSupport = showContactForm || showYouTube;

class Footer extends PureComponent {
    year = new Date().getFullYear();
    siteUrl = showSupport ? WebSiteUrl : undefined;

    render() {
        return (
            <div className="card-footer p-4">
                <div className="pull-left">
                    <span>© 2016-{this.year} <Link href={this.siteUrl}>Jira Assistant</Link> v{AppVersionNo}</span>
                </div>
                {showSupport && <div className="pull-right" style={{ textAlign: 'right' }}>
                    {<span>
                        <i className="fa fa-youtube" />
                        <Link href="https://www.youtube.com/embed/HsWq7cT3Qq0?rel=0&autoplay=1&showinfo=0&cc_load_policy=1"
                            title="Click to open YouTube video guiding you to setup Jira Assistant"> Help setup</Link>
                    </span>} |
                    <span>
                        <i className="fa fa-phone margin-l-5" />
                        <Link href={`${ContactUsUrl}?entry.1426640786=${AppVersionNo}&entry.972533768=${navigator.userAgent}`}
                            title="Click to report about any issues or ask a question"> Contact us</Link>
                    </span>
                </div>}
            </div>
        );
    }
}

export default Footer;