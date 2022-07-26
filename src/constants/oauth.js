import { prepareUrlWithQueryString } from "../common/utils";
import { JAApiBasePath } from "./urls";

// #region Jira Cloud OAuth2
export const jiraCloudAuthorizeUrl = 'https://auth.atlassian.com/authorize';
export const jiraCloudScopes = 'offline_access read:jira-user read:jira-work write:jira-work';
export const jiraCloudClientId = 'WcuXzz2GICjwK6ZUMSlJwcDbTaIC31B6';
export const jiraCloudRedirectUrl = 'https://app.jiraassistant.com?oauth=jc';

export const jaJiraTokenExchangeUrl = `${JAApiBasePath}/jira/oauth/token`;

const jiraCloudState = 'WEB';

export function getJiraCloudOAuthAuthorizeUrl(state) {
    if (typeof state === 'object') {
        state = JSON.stringify(state);
    }

    const params = {
        audience: 'api.atlassian.com',
        response_type: 'code',
        prompt: 'consent',
        client_id: jiraCloudClientId,
        scope: jiraCloudScopes,
        redirect_uri: jiraCloudRedirectUrl,
        state: state || jiraCloudState
    };

    return prepareUrlWithQueryString(jiraCloudAuthorizeUrl, params);
}
// #endregion