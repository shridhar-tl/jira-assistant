import React, { useEffect, useState } from 'react';
import { requestJira } from '@forge/bridge';
import { ApiUrls } from '../../constants/api-urls';
import { inject, registerDepnServices } from '../../services';
import getLoader from '../../components/loader';
import './common.scss';

// Takes care of initializing the cloud app with first time local db creation
const withInitParams = function (Component) {
    registerDepnServices();

    return React.memo(function () {
        const [initValue, setInitValue] = useState(false);

        useEffect(() => {
            initializeApp().then(setInitValue);
        }, []);// eslint-disable-line react-hooks/exhaustive-deps

        if (initValue === true) {
            return (<Component />);
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


async function initializeApp() {
    try {
        const { $user } = inject('UserService');
        const users = await $user.getUsersList();

        if (!users.length) { // If no user is created in db so far, then create new user
            const { $request } = inject('AjaxRequestService');
            const jiraUrl = await getInstanceUrl();
            const profile = await $request.execute('GET', ApiUrls.mySelf.replace('~', jiraUrl));
            await $user.createUser(profile, jiraUrl);
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
        return dummyInstUrl;
    }
}