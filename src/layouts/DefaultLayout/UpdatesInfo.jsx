import React, { PureComponent } from 'react';
import Link from '../../controls/Link';
import { inject } from '../../services/injector-service';

class UpdatesInfo extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "UserUtilsService");
    }

    getDescription(desc, i) {
        let id, text = desc;

        if (typeof desc === "object") {
            id = desc.id;
            text = desc.text;
        }

        return <li key={i}>{!!id && <Link href={`https://github.com/shridhar-tl/jira-assistant/issues/${id}`}>#{id} - </Link>}{text}</li>;
    }

    render() {
        const { updates } = this.props;

        return (
            <div className="release-history">
                {updates.map((u, i) => (<div key={i} className="release">
                    <span className="version-no">{u.version}</span>
                    {u.publishDate && <span> (published: <b>{this.$userutils.formatDate(u.publishDate)}</b>)</span>}
                    {!u.publishDate && u.expectedOn && <span> (expected: <b>{this.$userutils.formatDate(u.expectedOn)}</b>)</span>}
                    {u.availableNow && <span className={`badge bg-${u.isBeta ? 'warning text-dark' : 'success'}`}
                        title="Download this version from web store">now available</span>}
                    <span className="changelog-header">Changelog:</span>
                    <ul className="changelogs">
                        {u.whatsnew.map(this.getDescription)}
                    </ul>
                    {u.bugs && u.bugs.length > 0 && <>
                        <span className="changelog-header">Bugs:</span>
                        <ul className="changelogs">
                            {u.bugs.map(this.getDescription)}
                        </ul></>
                    }
                </div>))}
            </div>
        );
    }
}

export default UpdatesInfo;