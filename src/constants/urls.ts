export function getGitHubIssueUrl(issueNumber: string): string {
    const num = issueNumber.replace('#', '');
    return `https://github.com/shridhar-tl/jira-assistant/issues/${num}`;
}

export const WebSiteUrl = 'https://jiraassistant.com';
export const messagesUrl = `${WebSiteUrl}/messages.json`;
export const ContactUsUrl = `${WebSiteUrl}/contact-us`;

export const feedbackUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScJvQtHZI_yZr1xd4Z8TwWgvtFss33hW5nJp4gePCgI2ScNvg/viewform';

export const AnalyticsUrl = 'https://www.google-analytics.com/collect';

export const CHROME_WS_URL = 'https://chrome.google.com/webstore/detail/jira-assistant/momjbjbjpbcbnepbgkkiaofkgimihbii';
export const FF_STORE_URL = 'https://addons.mozilla.org/en-US/firefox/addon/jira-assistant/';
export const EDGE_STORE_URL = 'https://microsoftedge.microsoft.com/addons/detail/aoenpdbabcjnjbjpegeenodfknllmaoi';
export const OPERA_STORE_URL = 'https://addons.opera.com/en/extensions/details/jira-assistant/';
export const CLOUD_INSTALL_URL =
    'https://developer.atlassian.com/console/install/3864d3bc-aad3-4650-ac35-e15af61fd92d/?signature=50284775421a3ea30543ccd56a6b1bf125c3784aab7398c35b85d9e9719e4cd1&product=jira';

export const StoreUrls = {
    chrome: CHROME_WS_URL,
    firefox: FF_STORE_URL,
    edge: EDGE_STORE_URL,
    opera: OPERA_STORE_URL,
};

export const UNINSTALL_URL = '';

export const GITHUB_HOME_URL = 'https://github.com/shridhar-tl/jira-assistant';

export const ATLASSIAN_MARKETPLACE_URL = 'https://marketplace.atlassian.com/apps/1221570/jassistant';

export const JAWebRootUrl = 'https://app.jiraassistant.com';

export const JAWebLaunchUrl = `${JAWebRootUrl}?authType=1`;

export const JAApiBasePath = `${WebSiteUrl}/api`;

export const ApiTokenHelpPage = 'https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account';
