import { view } from '@forge/bridge';
import withInitParams from "../../layouts/initialization";
import withAuthInfo from '../../layouts/authorization/simple-auth';
import UserGroup from "../../components/user-group/UserGroup";
import 'moment-timezone/builds/moment-timezone-with-data.min.js';

const UserGroupModal = function ({ jiraContext: { extension: { modal: { groups } } } }) {
    const onDone = (userGroups) => view.close({ userGroups });

    return (<div style={{ minHeight: '600px' }}>
        <UserGroup isPlugged={true} groups={groups} onDone={onDone} />
    </div>);
};

export default withInitParams(withAuthInfo(UserGroupModal));