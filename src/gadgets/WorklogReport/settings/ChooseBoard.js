import React, { useRef, useEffect } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { connect } from '../datastore';
import { setValue } from './actions';
import { Checkbox, RadioButton } from '../../../controls';
import { useState } from 'react';
import './ChooseBoard.scss';

function ChooseBoard({ sprintBoards, selSprints, setValue, onChange }) {
    const op = useRef(null);
    const showOP = (e) => op.current.toggle(e);

    const boardSelected = (selected, id, name) => setValue('selSprints', { ...selSprints, [id]: { range: 0, custom: [], ...selSprints[id], selected, name } });

    return (<>
        <span className="link" title="Click to choose list of sprints" onClick={showOP}>Choose sprint</span>
        <OverlayPanel ref={op} showCloseIcon id="overlay_panel" style={{ width: '450px' }} onHide={onChange} className="op-sprint-list">
            <div className="board-list">
                <table>
                    <thead>
                        <tr>
                            {sprintBoards.map(g => <th key={g.id}>
                                <Checkbox label={g.name} field={g.id} args={g.name} checked={selSprints[g.id]?.selected} onChange={boardSelected} />
                            </th>)}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {sprintBoards.map(g => <td key={g.id} className="board-col">
                                <ChooseSprintRange board={g} selSprints={selSprints} setValue={setValue} disabled={!selSprints[g.id]?.selected} />
                            </td>)}
                        </tr>
                    </tbody>
                </table>
            </div>
        </OverlayPanel>
    </>);
}

export default connect(ChooseBoard,
    ({ selSprints, sprintBoards }) =>
        ({ selSprints, sprintBoards }),
    { setValue });

function ChooseSprintRange({ board, selSprints, disabled, setValue }) {
    const [custom, setCustom] = useState(selSprints[board.id]?.range === -1);
    const setRange = (range) => {
        if (range < 0) {
            setCustom(true);
        }
        setCustomSelection(null, null, range);
    };

    const setCustomSelection = (selected, sprintId, range) => {
        const selBoard = { ...selSprints[board.id], range };

        if (sprintId > 0) {
            selBoard.custom = { ...selBoard.custom, [sprintId]: selected };
            if (!selected) {
                delete selBoard.custom[sprintId];
            }
        }

        setValue('selSprints', { ...selSprints, [board.id]: selBoard });
    };

    if (!custom) {
        return (<div className="sprint-range">
            <div><RadioButton label="Last sprint" defaultValue={0} value={selSprints[board.id]?.range} onChange={setRange} disabled={disabled} /></div>
            <div><RadioButton label="Last closed sprint" defaultValue={1} value={selSprints[board.id]?.range} onChange={setRange} disabled={disabled} /></div>
            <div><RadioButton label="Last 2 sprints" defaultValue={2} value={selSprints[board.id]?.range} onChange={setRange} disabled={disabled} /></div>
            <div><RadioButton label="Last 3 sprints" defaultValue={3} value={selSprints[board.id]?.range} onChange={setRange} disabled={disabled} /></div>
            <div><RadioButton label="Last 4 sprints" defaultValue={4} value={selSprints[board.id]?.range} onChange={setRange} disabled={disabled} /></div>
            <div><RadioButton label="Last 5 sprints" defaultValue={5} value={selSprints[board.id]?.range} onChange={setRange} disabled={disabled} /></div>
            <div><RadioButton label="Custom" defaultValue={-1} value={selSprints[board.id]?.range} onChange={setRange} disabled={disabled} /></div>
        </div>);
    } else {
        return (<div className="sprint-custom-cntr">
            <ChooseSprints boardId={board.id} selSprints={selSprints} onChange={setCustomSelection} disabled={disabled} />
            <div><span className="link" onClick={() => setCustom(false)}> Back</span></div>
        </div>);
    }
}

const ChooseSprints = connect(function ({ boardId, selSprints, getRapidSprintList, onChange, disabled }) {
    const [sprints, setSprints] = useState([]);

    useEffect(() => {
        (async function () {
            const data = await getRapidSprintList([boardId]);
            setSprints(data);
        })();
    }, [boardId, getRapidSprintList]);

    const customSprints = selSprints[boardId]?.custom || {};

    return (<div className="sprints-custom">
        {sprints.map((s, i) => <div key={i}>
            <Checkbox label={s.name}
                checked={!!customSprints[s.id]} field={s.id} args={-1}
                onChange={onChange} disabled={disabled} />
        </div>)}
    </div>);
}, null, null, ['JiraService', ({ $jira: { getRapidSprintList } }) => ({ getRapidSprintList })]);