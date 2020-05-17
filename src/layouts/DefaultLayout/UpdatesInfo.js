import React, { PureComponent } from 'react';
import { inject } from '../../services/injector-service';

class UpdatesInfo extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "UserUtilsService");
    }

    render() {
        const { updates } = this.props;

        return (
            <div className="release-history">
                {updates.map((u, i) => (<div key={i} className="release">
                    <span className="version-no">{u.version}</span>
                    {u.publishDate && <span> (published: <b>{this.$userutils.formatDate(u.publishDate)}</b>)</span>}
                    {!u.publishDate && u.expectedOn && <span> (expected: <b>{this.$userutils.formatDate(u.expectedOn)}</b>)</span>}
                    <span className="changelog-header">Changelog:</span>
                    <ul className="changelogs">
                        {u.whatsnew.map((n, j) => <li key={j}>{n}</li>)}
                    </ul>
                    {u.bugs && u.bugs.length > 0 && <>
                        <span className="changelog-header">Bugs:</span>
                        <ul className="changelogs">
                            {u.bugs.map((n, j) => <li key={j}>{n}</li>)}
                        </ul></>
                    }
                </div>))}
            </div>
        );
    }
}

export default UpdatesInfo;