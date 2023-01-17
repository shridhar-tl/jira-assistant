import React, { PureComponent } from 'react';
import { TextBox, Button, SelectBox } from '../../controls';
import { getUserName } from '../../common/utils';
import Link from '../../controls/Link';
import { inject } from '../../services';

class UserRow extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, 'UserUtilsService');
        const { user: { timeZone, costPerHour = 0 } } = props;
        this.state = { timeZone: timeZone || "", costPerHour };
    }

    timeZoneChanged = (timeZone) => {
        const { user } = this.props;
        user.timeZone = timeZone;
        this.setState({ timeZone });
    };

    costChanged = (costPerHour) => {
        const { user } = this.props;
        user.costPerHour = costPerHour || 0;
        this.setState({ costPerHour });
    };

    onRemove = () => {
        this.props.onRemove(this.props.index);
    };

    render() {
        const {
            timeZoneChanged, costChanged, onRemove,
            props: { user, userTimezones }
        } = this;
        const isActive = user.active !== false;

        return (<tr title={!isActive && "User is inactive"}>
            <td>
                <div className="group-user">
                    <img src={user.avatarUrls['32x32'] || user.avatarUrls['48x48']} alt="" height={32} width={32} className="pull-left" />
                    <Link href={this.$userutils.getProfileUrl(user)}
                        className={isActive ? "link" : "link strike-out"}>{user.displayName}</Link>
                </div>
            </td>
            <td>{user.emailAddress}</td>
            <td>{getUserName(user)}</td>
            <td><SelectBox dataset={userTimezones} value={user.timeZone} displayField="label" valueField="value"
                onChange={timeZoneChanged} className="width-perc-100" filter={true} /></td>
            <td><TextBox value={user.costPerHour} onChange={costChanged} keyfilter="num" /></td>
            <td><Button type="danger" icon="fa fa-times" onClick={onRemove} style={{ marginTop: 0 }} /></td>
        </tr>
        );
    }
}

export default UserRow;