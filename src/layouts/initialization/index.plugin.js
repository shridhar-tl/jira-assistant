import React, { useEffect, useState } from 'react';
import { requestJira } from '@forge/bridge';
import { ApiUrls } from '../../constants/api-urls';
import { inject, registerDepnServices } from '../../services';
import getLoader from '../../components/loader';
import './common.scss';

// Takes care of initializing the cloud app with first time local db creation
const withInitParams = function (Component) {
    registerDepnServices();

    return React.memo(function ({ jiraContext, ...props }) {
        const [initValue, setInitValue] = useState(false);

        useEffect(() => {
            initializeApp(jiraContext).then(setInitValue);
        }, []);// eslint-disable-line react-hooks/exhaustive-deps

        if (initValue === true) {
            return (<Component jiraContext={jiraContext} {...props} />);
        } else if (typeof initValue === 'string') {
            return (<div className="setup-error">
                <div className="header-msg">Setup Failed</div>
                <div className="details">Error Details :- {initValue}</div>
            </div>);
        } else {
            return getLoader('Setting up... Please wait...');
        }
    });
};

export default withInitParams;


async function initializeApp(jiraContext) {
    try {
        const { $user } = inject('UserService');
        const users = await $user.getUsersList();
        console.log('Count of user found in cache:', users.length);

        if (!users.length) { // If no user is created in db so far, then create new user
            const { $request } = inject('AjaxRequestService');

            let jiraUrl = jiraContext.siteUrl;
            if (!jiraUrl) {
                jiraUrl = await getInstanceUrl();
            }
            const profile = await $request.execute('GET', ApiUrls.mySelf.replace('~', jiraUrl));
            console.log('User profile pulled from Jira');
            await $user.createUser(profile, jiraUrl);
            console.log('User created in browser cache');
        }

        return true;
    } catch (err) {
        console.error('Error setting up Jira Assistant:', err);
        return err.toString();
    }
}

const dummyInstUrl = 'https://api.atlassian.net';

async function getInstanceUrl() {
    try {
        const response = await requestJira('/rest/api/3/serverInfo'); // XML Response: `/rest/applinks/latest/manifest`
        const result = await response.json();
        return result.baseUrl.clearEnd('/') || dummyInstUrl;
    } catch {
        console.error('Fetching server info failed. Falling back to: ', dummyInstUrl);
        return dummyInstUrl;
    }
}