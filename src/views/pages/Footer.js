import React, { PureComponent } from 'react';
import { AppVersionNo } from '../../constants/common';
import { ContactUsUrl, WebSiteUrl } from '../../constants/urls';
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
                    <span>© 2016-{this.year} <a href={this.siteUrl} target="_blank" rel="noreferrer">Jira Assistant</a> v{AppVersionNo}</span>
                </div>
                {showSupport && <div className="pull-right" style={{ textAlign: 'right' }}>
                    {<span>
                        <i className="fa fa-youtube" />
                        <a href="https://www.youtube.com/embed/HsWq7cT3Qq0?rel=0&autoplay=1&showinfo=0&cc_load_policy=1" target="_blank" rel="noopener noreferrer"
                            title="Click to open YouTube video guiding you to setup Jira Assistant"> Help setup</a>
                    </span>} |
                    <span>
                        <i className="fa fa-phone margin-l-5" />
                        <a href={`${ContactUsUrl}?entry.1426640786=${AppVersionNo}&entry.972533768=${navigator.userAgent}`}
                            target="_blank" rel="noopener noreferrer" title="Click to report about any issues or ask a question"> Contact us</a>
                    </span>
                </div>}
            </div>
        );
    }
}

export default Footer;