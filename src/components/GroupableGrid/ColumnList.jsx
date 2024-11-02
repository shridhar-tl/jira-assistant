import React, { PureComponent } from 'react';
import { Checkbox } from '../../controls';

class ColumnList extends PureComponent {
    constructor(props) {
        super(props);
        this.state = this.getState(props);
    }

    getState(props) {
        const { displayColumns } = props;

        return {
            columns: this.props.columns.map(({ id, displayText }) => (
                {
                    id, displayText,
                    selected: !displayColumns || !!~displayColumns.indexOf(id)
                }
            ))
        };
    }

    hideColumns = () => {
        let { columns } = this.state;

        let displayColumns = columns.filter(c => c.selected);
        displayColumns = (displayColumns.length === columns.length) ? null : displayColumns.map(c => c.id);
        columns = null;
        this.props.onChange(displayColumns);
    };

    selectionChanged = (index, selected) => {
        let { columns } = this.state;
        columns = [...columns];
        columns[index] = { ...columns[index], selected };
        this.setState({ columns });
    };

    render() {
        const { columns } = this.state;

        return (
            <div className="columns-list-container">
                <div className="columns-list">
                    <div className="column-list-title">
                        <span className="fa fa-times" onClick={this.hideColumns} />
                        <span>Choose Columns</span>
                    </div>
                    <div className="columns-list-items">
                        {columns.map((c, i) => <div key={i} className="column-list-item">
                            <Checkbox label={c.displayText} checked={c.selected}
                                onChange={(val) => this.selectionChanged(i, val)} />
                        </div>)}
                    </div>
                </div>
            </div>
        );
    }
}

export default ColumnList;