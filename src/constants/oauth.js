import { prepareUrlWithQueryString } from "../common/utils";
import { JAApiBasePath, JAWebRootUrl } from "./urls";

// #region Jira Cloud OAuth2
export const jiraCloudAuthorizeUrl = 'https://auth.atlassian.com/authorize';
export const jiraCloudScopes = 'offline_access read:jira-user read:jira-work write:jira-work read:sprint:jira-software read:issue-details:jira read:jql:jira read:board-scope:jira-software read:project:jira read:issue-meta:jira read:avatar:jira read:issue.changelog:jira';
export const jiraCloudClientId = 'WcuXzz2GICjwK6ZUMSlJwcDbTaIC31B6';
export const jiraCloudRedirectUrl = `${JAWebRootUrl}?oauth=jc`;
export const jaJiraTokenExchangeUrl = `${JAApiBasePath}/oauth/jira/token`;

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
        state: btoa(state)
    };

    return prepareUrlWithQueryString(jiraCloudAuthorizeUrl, params);
}
// #endregion

export const outlookRedirectUrl = `${JAApiBasePath}/oauth/outlook`;
export const outlookTokenExchangeUrl = `${JAApiBasePath}/oauth/outlook/token`;
export const pokerTokenExchangeUrl = `${JAApiBasePath}/oauth/poker/token`;