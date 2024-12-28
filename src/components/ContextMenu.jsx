import React, { PureComponent } from 'react';
import { Menu } from 'primereact/menu';
import { ContextMenu as CMenu } from 'primereact/contextmenu';

let contextHandler = () => { /* Nothing to do */ };
export function showContextMenu(event, model) {
    if (event.preventDefault) {
        event.preventDefault();
    }
    contextHandler(event, model);
}

export function hideContextMenu() {
    contextHandler();
}

export class ContextMenu extends PureComponent {
    state = { contextItems: [] };

    componentDidMount() {
        contextHandler = (event, contextItems) => {
            if (!event) {
                this.menu.hide({});
                this.contextMenu.hide({});
                return;
            }
            const isContextMenu = event.type === "contextmenu";

            if (!isContextMenu) {
                contextItems = contextItems.filter(c => !c.disabled || !c.items || c.items.length === 0);
            }

            if (!this.state.contextItems?.length || this.state.contextItems !== contextItems) {
                this.setState({ contextItems });
            }

            if (isContextMenu) {
                this.menu.hide({});
                this.contextMenu.show(event);
            }
            else {
                this.contextMenu.hide({});
                this.menu.toggle(event);
            }
        };
    }

    setMenuRef = el => this.menu = el;
    setContextMenuRef = el => this.contextMenu = el;

    render() {
        return <>
            <Menu appendTo={document.body} model={this.state.contextItems} popup={true} ref={this.setMenuRef} />
            <CMenu appendTo={document.body} model={this.state.contextItems} popup={true} ref={this.setContextMenuRef} />
        </>;
    }
}