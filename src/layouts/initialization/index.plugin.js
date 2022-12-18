import React, { useEffect, useState } from 'react';
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

const dummyInstUrl = 'https://api.atlassian.net';

async function initializeApp() {
    try {
        const { $user } = inject('UserService');
        const user = await $user.getUsersList();

        if (!user.length) { // If no user is created in db so far, then create new user
            const { $request } = inject('AjaxRequestService');
            const profile = await $request.execute('GET', ApiUrls.mySelf.replace('~', dummyInstUrl));
            await $user.createUser(profile, dummyInstUrl);
        }

        return true;
    } catch (err) {
        console.error('Error setting up Jira Assistant:', err);
        return err.toString();
    }
}
