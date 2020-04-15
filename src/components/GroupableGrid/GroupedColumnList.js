import React, { PureComponent } from 'react';
import { Sortable } from 'jsd-report';
import PropTypes from 'prop-types';

const emptyGroupPlaceholder = <div className="empty-group-msg">Drag and drop column here to group data</div>;
const addGroupItemPlaceholder = <span>Drag and drop more columns here</span>;

class GroupedColumnList extends PureComponent {
    toggleSort = (i, desc) => {
        const { groupBy: grpBy, foldable, onChange } = this.props;
        const groupBy = [...grpBy];
        groupBy[i] = { ...groupBy[i], sortDesc: desc };
        onChange(groupBy, foldable, "sort");
    }

    removeGroup = (i) => {
        const { groupBy: grpBy, foldable, onChange } = this.props;
        const groupBy = [...grpBy];
        groupBy.splice(i, 1);
        onChange(groupBy, foldable, "remove");
    }

    toggleMode = (newValue) => {
        const { groupBy, foldable, onChange } = this.props;

        if (!!foldable === newValue) {
            return;
        }
        onChange(groupBy, newValue, "mode");
    }

    columnReordered = (groupBy) => {
        const { foldable, onChange } = this.props;
        onChange(groupBy, foldable, "rearrange");
    }

    render() {
        const { groupBy, foldable, toggleColumns, showColumns } = this.props;

        return (
            <div className="group-bar">
                <span className={`fa group-mode-icon fa-columns${showColumns ? " active" : ""}`}
                    onClick={toggleColumns} title="Click to choose what column to display" />

                {groupBy.length > 0 && <span className={`fa group-mode-icon fa-th-list${foldable ? "" : " active"}`}
                    onClick={() => this.toggleMode(false)} title="Display group values in columns" />}
                {groupBy.length > 0 && <span className={`fa group-mode-icon fa-indent${foldable ? " active" : ""}`}
                    onClick={() => this.toggleMode(true)} title="Display group values in foldable row" />}

                <span className="group-label">Group by:</span>
                <div className="group-list-container">
                    <Sortable className="group-list" items={groupBy} itemType="column" onChange={this.columnReordered} accepts={["column"]}
                        placeholder={groupBy.length ? addGroupItemPlaceholder : emptyGroupPlaceholder}>
                        {(g, i, dropProps) => <GroupedColumn key={i} group={g} index={i} toggleSort={this.toggleSort} removeGroup={this.removeGroup} dropProps={dropProps} />}
                    </Sortable>
                </div>
            </div>
        );
    }
}

GroupedColumnList.propTypes = {
    groupBy: PropTypes.array.isRequired
};

export default GroupedColumnList;

class GroupedColumn extends PureComponent {
    removeGroup = () => this.props.removeGroup(this.props.index)
    sortAsc = () => this.props.toggleSort(this.props.index, false)
    sortDesc = () => this.props.toggleSort(this.props.index, true)

    setRef = (el) => {
        this.el = el;
        const { dropProps: { dropConnector } = {} } = this.props;

        if (dropConnector) {
            dropConnector(el);
        }
    }

    render() {
        const { group: g } = this.props;

        return (
            <div ref={this.setRef} className="group-list-item">
                {!g.sortDesc && <span className="fa fa-sort-amount-asc sort-icon" onClick={this.sortDesc} />}
                {!!g.sortDesc && <span className="fa fa-sort-amount-desc sort-icon" onClick={this.sortAsc} />}
                {g.displayText}
                <span className="fa fa-times" onClick={this.removeGroup} />
            </div>
        );
    }
}
