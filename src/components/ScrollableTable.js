import React, { PureComponent, createContext } from 'react';
import "./ScrollableTable.scss";
import $ from "jquery";
import { EventEmitter } from 'events';

var TableContext = createContext({});

const tableScrollingEvent = "tableScrolling";
const sortChangedEvent = "sortChanged";

export class ScrollableTable extends PureComponent {
    constructor(props) {
        super(props);
        this.eventEmitter = new EventEmitter();
        this.eventEmitter.setMaxListeners(20);
        this.state = { dataset: props.dataset };
    }

    UNSAFE_componentWillReceiveProps(newProps) {
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
                this.eventEmitter.emit(sortChangedEvent, sortBy, isDesc);
            }
            else {
                return this.state.sortBy;
            }
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
        return (
            <div className="scroll-table-container" ref={el => this.container = el} onScroll={this.tableScrolled}>
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
    state = { showOverlay: false };

    componentDidMount() {
        this.cleanup = this.context.onScroll((scrollTop) => {
            this.scrollTop = scrollTop;
            if (scrollTop > 0) {
                if (!this.state.showOverlay) {
                    this.setState({ showOverlay: true });
                }

                if (this.overlay) {
                    this.overlay.style.top = this.scrollTop + "px";
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
        var { className = "", style, children } = this.props;
        const { showOverlay } = this.state;

        const overlayStyle = { ...style, top: this.scrollTop };

        return (<>
            {showOverlay && <thead ref={this.setOverLay} className={className + " scroll-overlay"} style={overlayStyle}>
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