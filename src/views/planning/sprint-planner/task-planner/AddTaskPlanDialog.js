import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'react-controls/controls';
import Form from 'react-controls/controls/form/Form';
import * as array from 'react-controls/common/array';
import { getUserName } from 'src/common/utils';
import { connect } from '../store';
import { FormDatePicker, FormMultiSelect } from 'react-controls/controls/form';
import { saveEditedObject, deleteCurrentTask, cancelEdit } from './actions';

function AddTaskPlanDialog({ editedObject, resources }) {
    const [state, setState] = React.useState(editedObject.state);
    const users = React.useMemo(() => resources.map(r => ({ value: getUserName(r), label: r.displayName })), [resources]);
    const $this = React.useRef({});
    $this.current = { state };

    const updateResources = React.useCallback((value, field, set) => {
        if (!value || field !== 'resources') {
            return value;
        }

        const { resources } = $this.current.state;

        if (set) {
            const resourceMap = array.toObjectWithKey(resources, 'id');
            return value.map(id => resourceMap[id] || ({ id }));
        } else {
            return array.mapKeys(value, 'id');
        }
    }, []);

    const footer = (<>
        <Button text label="Cancel" onClick={cancelEdit} />
        <Button label="Update" onClick={saveEditedObject} args={state} />
        {editedObject.index >= 0 && <Button text severity="danger" label="Delete"
            className="float-start" onClick={deleteCurrentTask} args={state} />}
    </>);

    return (
        <Dialog header="Task Information" visible={true} style={{ width: '600px' }}
            onHide={cancelEdit} footer={footer}>
            <Form value={state} onChange={setState} middleware={updateResources}>
                <div className="px-3">
                    <div className="row">
                        <div className="col-6">
                            <label>Start Date</label>
                            <FormDatePicker field="startDate" />
                        </div>
                        <div className="col-6">
                            <label>End Date</label>
                            <FormDatePicker field="endDate" />
                        </div>
                        <div className="col-12">
                            <label>Resources</label>
                            <FormMultiSelect field="resources" dataset={users} />
                        </div>
                    </div>
                </div>
            </Form>
        </Dialog>
    );
}

export default connect(AddTaskPlanDialog, (state) => ({
    editedObject: state.editedProgressObject,
    resources: state.resources
}));
