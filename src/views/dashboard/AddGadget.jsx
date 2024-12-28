import React from 'react';
import { Button, Loader } from 'src/controls';
import { inject } from 'src/services';
import { GadgetList } from '../../gadgets';
import './AddGadget.scss';

function AddGadget({ show, onHide, ...other }) {
    const [gadgetList, setGadgetList] = React.useState();
    const shouldPull = show && !gadgetList;

    React.useEffect(() => {
        if (!shouldPull) { return; }

        getGadgetList().then(setGadgetList);
    }, [shouldPull, setGadgetList]);

    return (<div className={`add-gadget-container ${show ? 'open' : 'closed'}`}>
        <div className="gadget-block">
            <div className="header">
                <Button className="close-icon" icon="fa fa-times" onClick={onHide} />
                <h2 className="title">Add a Gadget</h2>
            </div>
            <div className="gadgets-list">
                <GadgetListComponent
                    gadgets={gadgetList}
                    {...other} />
            </div>
        </div>
    </div>);
}

function GadgetListComponent({ gadgets, ...other }) {
    if (!gadgets) {
        return (<Loader />);
    }

    return gadgets.map(g => <Gadget key={g.id} gadget={g} {...other} />);
}

function Gadget({ gadget: g, addedGadgets, addGadget, removeGadget }) {
    const added = addedGadgets.some(w => w.name === g.id);
    const { id } = g;

    const addItem = React.useCallback(() => addGadget(id), [id, addGadget]);
    const removeItem = React.useCallback(() => removeGadget(id), [id, removeGadget]);

    return (
        <div className="gadget-info">
            <div className="details">
                <span className="name">{g.name}</span>
                <span className="desc">{g.details}</span>
            </div>
            <div className="controls">
                {!added && <Button type="primary" icon="fa fa-plus" label="Add" disabled={g.isOld} onClick={addItem} />}
                {added && <Button type="danger" icon="fa fa-times" label="Remove" onClick={removeItem} />}
            </div>
        </div>
    );
}

export default AddGadget;

async function getGadgetList() {
    const { $report } = inject('ReportService');

    const reports = (await $report.getReportsList()).filter(r => r.reportType !== 'pivot');

    if (!reports?.length) {
        return GadgetList;
    }

    const list = reports.map(r => ({
        id: `${(r.advanced ? "AR" : (r.isNew ? "CR" : "SQ"))}:${r.id}:${r.queryName}`,
        icon: "fa fa-filter",
        name: r.queryName,
        isOld: !(r.isNew || r.advanced),
        details: (!r.advanced ?
            `${r.outputCount} columns displayed in table format${r.isNew
                ? ' with interactive option to sort and group based on columns.'
                : ' (deprecated, not allowed to add to dashboard)'}`
            : "<no details available>")
    }));

    return [...GadgetList, ...list];
}