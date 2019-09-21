import React, { PureComponent, createContext } from 'react';
import "./ScrollableTable.scss";
import $ from "jquery";
import { EventEmitter } from 'events';
import classNames from "classnames";

const TableContext = createContext({});

const tableScrollingEvent = "tableScrolling";
const sortChangedEvent = "sortChanged";
const dataChangedEvent = "dataChanged";

export class ScrollableTable extends PureComponent {
    constructor(props) {
        super(props);
        this.eventEmitter = new EventEmitter();
        this.eventEmitter.setMaxListeners(40);

        this.actualDataset = props.dataset;
        this.state = { dataset: props.dataset };
    }

    UNSAFE_componentWillReceiveProps(newProps) {
        if (newProps.dataset !== this.actualDataset) {
            this.actualDataset = newProps.dataset;
            this.setState({ dataset: newProps.dataset });
            this.eventEmitter.emit(dataChangedEvent, newProps.dataset);
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
                    dataset = dataset.sortBy(sortBy, isDesc);

                    this.setState({ dataset, sortBy, isDesc });
                    this.eventEmitter.emit(sortChangedEvent, sortBy, isDesc);
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
        onScroll: (callback) => {
            this.eventEmitter.on(tableScrollingEvent, callback);
            return () => this.eventEmitter.off(tableScrollingEvent, callback);
        }
    };

    tableScrolled = (e) => {
        this.eventEmitter.emit(tableScrollingEvent, e.currentTarget.scrollTop, e);
    }

    render() {
        const { className, style, children, exportable, exportSheetName } = this.props;

        return (
            <div className={classNames("scroll-table-container", className)}
                ref={el => this.container = el} onScroll={this.tableScrolled}>
                <TableContext.Provider value={this.sharedProps}>
                    <table ref={el => this.table = el}
                        export-sheet-name={exportSheetName}
                        className={classNames("scroll-table table-bordered", className, exportable !== false ? "exportable" : null)}
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
    state = { showOverlay: false };

    componentDidMount() {
        this.cleanup = this.context.onScroll((scrollTop) => {
            this.scrollTop = parseInt(scrollTop) - 1;

            if (scrollTop > 0) {
                if (!this.state.showOverlay) {
                    this.setState({ showOverlay: true });
                }

                if (this.overlay) {
                    this.overlay.style.top = `${this.scrollTop}px`;
                }
            }
            else {
                this.setState({ showOverlay: false });
            }
        });
    }

    setOverLay = (ref) => this.overlay = ref
    setHeaderEl = (ref) => this.headerEl = ref

    componentWillUnmount() {
        this.cleanup();
    }

    componentDidUpdate() {
        this.setOverLayStyle();
    }

    setOverLayStyle() {
        if (!this.state.showOverlay) { return; }

        const actualTH = $(this.headerEl).find("th");
        const overlayTH = $(this.overlay).find("th");

        actualTH.each((i, ath) => {
            const $ath = $(ath);
            const $oth = $(overlayTH[i]);
            $oth.width($ath.width());
        });
    }

    render() {
        const { className = "", style, children } = this.props;
        const { showOverlay } = this.state;

        const overlayStyle = { ...style, top: this.scrollTop };

        return (<>
            {showOverlay && <thead ref={this.setOverLay} no-export="true" className={`${className} scroll-overlay`} style={overlayStyle}>
                {children}
            </thead>}
            <thead ref={this.setHeaderEl} className={className} style={style}>
                {children}
            </thead>
        </>
        );
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
    }

    componentWillUnmount() {
        this.cleanup();
    }

    render() {
        const { sortBy, isDesc } = this.state;
        const { style, sortBy: curField, children, noExport, rowSpan, colSpan } = this.props;
        let { className } = this.props;

        if (!className) {
            className = "";
        }

        if (sortBy) {
            className += " sortable";
        }

        return (
            <th className={className} style={style} onClick={this.onClick} no-export={noExport ? "true" : null} rowSpan={rowSpan} colSpan={colSpan}>
                {children} {curField ? (curField === sortBy ? (<i className={`fa fa-sort-${isDesc ? "desc" : "asc"}`}></i>) : <i className="fa fa-sort"></i>) : null}
            </th>
        );
    }
}
