import { FormTextBox, FormRadioButton } from "react-controls/controls/form";
import { ScrollableTable, TBody, THead } from "../../../../components/ScrollableTable";
import { Form } from "react-controls/controls/form";
import { usePlannerState } from "../store";

function VelocityPicker() {
    const velocity = usePlannerState(s => s.velocity);
    const velocityInfo = usePlannerState(s => s.velocityInfo);

    const { averageCommitted, averageCompleted, median } = velocityInfo || {};

    return (<Form value={velocity} onChange={setVelocitySelection}>
        <ScrollableTable height="auto">
            <caption>Pick Velocity</caption>
            <THead>
                <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th className="text-center">Value</th>
                </tr>
            </THead>
            <TBody>
                <tr>
                    <td><FormRadioButton field="selected" defaultValue="C" /></td>
                    <td>Completed average</td>
                    <td className="text-center">{averageCompleted}</td>
                </tr>
                <tr>
                    <td><FormRadioButton field="selected" defaultValue="T" /></td>
                    <td>Total average</td>
                    <td className="text-center">{averageCommitted}</td>
                </tr>
                <tr>
                    <td><FormRadioButton field="selected" defaultValue="M" /></td>
                    <td>Median</td>
                    <td className="text-center">{median}</td>
                </tr>
                <tr>
                    <td><FormRadioButton field="selected" defaultValue="U" /></td>
                    <td>Custom</td>
                    <td><FormTextBox field="custom" value={velocity.custom} className="w-100" disabled={velocity.selected !== 'U'} /></td>
                </tr>
            </TBody>
        </ScrollableTable>
    </Form>);
}

export default VelocityPicker;

function setVelocitySelection(velocity) {
    usePlannerState.setState({ velocity });
}