import React, { PureComponent, createContext } from 'react';
import classNames from "classnames";
import { EventEmitter } from 'events';
import "./ScrollableTable.scss";

const TableContext = createContext({});

const sortChangedEvent = "sortChanged";
const dataChangedEvent = "dataChanged";

export class ScrollableTable extends PureComponent {
    constructor(props) {
        super(props);
        this.eventEmitter = new EventEmitter();
        this.eventEmitter.setMaxListeners(400);

        this.actualDataset = props.dataset;
        this.state = { dataset: props.dataset, sortBy: props.sortBy, isDesc: props.isDesc };
    }

    UNSAFE_componentWillReceiveProps(newProps) {
        const { dataset, sortBy, isDesc } = newProps;
        if (dataset !== this.actualDataset) {
            this.actualDataset = dataset;
            this.setState({ dataset, sortBy, isDesc });
            this.eventEmitter.emit(dataChangedEvent, newProps.dataset);
        }

        if (sortBy !== this.state.sortBy || isDesc !== this.state.isDesc) {
            this.setState({ dataset, sortBy, isDesc });
            this.eventEmitter.emit(sortChangedEvent, sortBy, isDesc);
        }
    }

    sharedProps = {
        getData: () => this.state.dataset,
        sortBy: (sortBy) => {
            let { isDesc } = this.state;

            if (sortBy === this.state.sortBy) { isDesc = !isDesc; }
            else { isDesc = false; }

            if (sortBy) {
                let { dataset } = this.state;

                if (dataset) {
                    let sortApplied = false;

                    if (this.props.onSort) {
                        sortApplied = this.props.onSort(sortBy, isDesc);
                    }

                    if (!sortApplied) {
                        dataset = dataset.sortBy(sortBy, isDesc);

                        this.setState({ dataset, sortBy, isDesc });
                        this.eventEmitter.emit(sortChangedEvent, sortBy, isDesc);
                    }
                }
            }
            else {
                return this.state.sortBy;
            }
        },
        getSortedField: () => {
            const { sortBy, isDesc } = this.state;
            return { sortBy, isDesc };
        },
        onDataChanged: (callback) => {
            this.eventEmitter.on(dataChangedEvent, callback);
            return () => this.eventEmitter.off(dataChangedEvent, callback);
        },
        onSortFieldChanged: (callback) => {
            this.eventEmitter.on(sortChangedEvent, callback);
            return () => this.eventEmitter.off(sortChangedEvent, callback);
        },
        getScrollTop: () => (this.container?.scrollTop || 0)
    };

    setContainer = el => this.container = el;

    render() {
        const { className, style, children, exportable, exportSheetName, height, containerStyle } = this.props;

        return (
            <div className={classNames("scroll-table-container", className)} style={containerStyle ? containerStyle : { height }}
                ref={this.setContainer}>
                <TableContext.Provider value={this.sharedProps}>
                    <table ref={el => this.table = el}
                        export-sheet-name={exportSheetName}
                        className={classNames("scroll-table", className, exportable !== false ? "exportable" : null)}
                        style={style}>
                        {children}
                    </table>
                </TableContext.Provider>
            </div>
        );
    }
}

export class THead extends PureComponent {
    static contextType = TableContext;
    state = {};

    setRef = (el) => this.el = el;

    componentDidMount() {
        this.componentDidUpdate();
    }

    componentDidUpdate() {
        const rows = this.el.querySelectorAll('tr:not(:first-child)');
        rows.forEach((row, i) => {
            const cells = row.querySelectorAll('th');
            this.setScrollTop(cells, 31 * (i + 1));
        });
    }

    setScrollTop(cells, defTop) {
        const scrollTop = this.context.getScrollTop();
        cells.forEach(c => {
            const top = c.offsetTop && scrollTop && c.offsetTop > scrollTop ? c.offsetTop - scrollTop : c.offsetTop;
            c.style.top = `${(top || defTop)}px`;
        });
    }

    render() {
        const { className, style, children } = this.props;

        return (<thead ref={this.setRef} className={className} style={style} exportignore={this.props.exportIgnore || undefined}>
            {children}
        </thead>);
    }
}

export class TBody extends PureComponent {
    static contextType = TableContext;

    componentDidMount() {
        this.cleanup = this.context.onSortFieldChanged((sortBy, isDesc) => { this.setState({ sortBy, isDesc }); });
    }

    componentWillUnmount() {
        this.cleanup();
    }

    render() {
        const { children, className, style } = this.props;
        const data = this.context.getData();
        let toRender = null;

        if (data && data.length === 0) {
            return null;
        }

        if (typeof children === "function") {
            toRender = data && data.length > 0 && data.map(children);
        } else {
            toRender = children;
        }

        return (
            <tbody className={className} style={style}>{toRender}</tbody>
        );
    }
}

export class NoDataRow extends PureComponent {
    static contextType = TableContext;
    state = { hasRows: false };

    componentDidMount() {
        const data = this.context.getData();
        this.setState({ hasRows: !!(data && data.length) });

        this.cleanup = this.context.onDataChanged(d => this.setState({ hasRows: !!(d && d.length) }));
    }

    componentWillUnmount() {
        this.cleanup();
    }

    render() {
        if (this.state.hasRows) {
            return null;
        }

        const { children, span } = this.props;

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
        this.setState(this.context.getSortedField());
        this.cleanup = this.context.onSortFieldChanged((sortBy, isDesc) => { this.setState({ sortBy, isDesc }); });
    }

    onClick = (e) => {
        this.context.sortBy(this.props.sortBy);
    };

    componentWillUnmount() {
        this.cleanup();
    }

    render() {
        const { sortBy, isDesc } = this.state;
        const { style, sortBy: curField, children, noExport, rowSpan, colSpan, dragConnector } = this.props;
        let { className } = this.props;

        if (!className) {
            className = "";
        }

        if (curField) {
            className += " sortable";
        }

        return (
            <th ref={dragConnector} className={className} style={style} onClick={this.onClick} no-export={noExport ? "true" : null} rowSpan={rowSpan} colSpan={colSpan}>
                {children} {curField ? (curField === sortBy ? (<i className={`fa fa-sort-${isDesc ? "desc" : "asc"}`}></i>) : <i className="fa fa-sort"></i>) : null}
            </th>
        );
    }
}
