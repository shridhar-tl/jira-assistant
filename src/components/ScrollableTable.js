import React, { PureComponent, createContext } from 'react';
import "./ScrollableTable.scss";
import { EventEmitter } from 'events';

var TableContext = createContext({});

export class ScrollableTable extends PureComponent {
    constructor(props) {
        super(props);
        this.eventEmitter = new EventEmitter();
        this.eventEmitter.setMaxListeners(20);
        this.state = { dataset: props.dataset };
    }

    componentWillReceiveProps(newProps) {
        if (newProps.dataset !== this.state.dataset) {
            this.setState({ dataset: newProps.dataset });
        }
    }

    sharedProps = {
        getData: () => this.state.dataset,
        sortBy: (sortBy) => {
            var { sortBy: oldSortBy, isDesc } = this.state;

            if (sortBy === oldSortBy) { isDesc = !isDesc; }
            else { isDesc = false; }

            if (sortBy) {
                this.setState({ sortBy, isDesc });
                this.eventEmitter.emit("sortChanged", sortBy, isDesc);
            }
            else {
                return this.state.sortBy;
            }
        },
        onSortFieldChanged: (callback) => {
            this.eventEmitter.on("sortChanged", callback);
            return () => this.eventEmitter.off("sortChanged", callback);
        }
    };

    render() {
        return (
            <div className="scroll-table-container" ref={el => this.container = el}>
                <TableContext.Provider value={this.sharedProps}>
                    <table ref={el => this.table = el} className="scroll-table table-bordered" {...this.props}>

                    </table>
                </TableContext.Provider>
            </div>
        );
    }
}

export class THead extends PureComponent {
    static contextType = TableContext;

    render() {
        return (
            <thead {...this.props}>

            </thead>
        );
    }
}

export class TBody extends PureComponent {
    static contextType = TableContext;

    render() {
        var { children } = this.props;
        var data = this.context.getData();
        var toRender = null;

        if (data && data.length === 0) {
            return null;
        }

        if (typeof children === "function") {
            toRender = data && data.length > 0 && data.map(children);
        } else {
            toRender = children;
        }

        return (
            <tbody>{toRender}</tbody>
        );
    }
}

export class NoDataRow extends PureComponent {
    static contextType = TableContext;

    render() {
        var { children, span } = this.props;
        var data = this.context.getData();

        if (!data || data.length > 0) {
            return null;
        }

        return (
            <tbody><tr><td colSpan={span}>{children}</td></tr></tbody>
        );
    }
}

export class TRow extends PureComponent {
    static contextType = TableContext;

    render() {
        return (
            <tr {...this.props}>

            </tr>
        );
    }
}

export class Column extends PureComponent {
    static contextType = TableContext;
    state = {};

    componentDidMount() {
        this.cleanup = this.context.onSortFieldChanged((sortBy, isDesc) => { this.setState({ sortBy, isDesc }) });
    }

    onClick = (e) => {
        this.context.sortBy(this.props.sortBy);
    }

    componentWillUnmount() {
        this.cleanup();
    }

    render() {
        var { className, style, sortBy: curField, children } = this.props;
        var { sortBy, isDesc } = this.state;

        if (!className) {
            className = "";
        }

        if (sortBy) {
            className += " sortable";
        }

        return (
            <th className={className} style={style} onClick={this.onClick}>
                {children} {curField ? (curField === sortBy ? (<i className={"fa fa-sort-" + (isDesc ? "desc" : "asc")}></i>) : <i className="fa fa-sort"></i>) : null}
            </th>
        );
    }
}

export class TD extends PureComponent {
    static contextType = TableContext;

    render() {
        return (
            <td {...this.props}>

            </td>
        );
    }
}