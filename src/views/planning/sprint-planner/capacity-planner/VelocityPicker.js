import { ScrollableTable, TBody, THead } from "../../../../components/ScrollableTable";
import { RadioButton } from "../../../../controls";

function VelocityPicker({ velocity = {} }) {
    return (<ScrollableTable>
        <caption>Pick Velocity</caption>
        <THead>
            <tr>
                <th>#</th>
                <th>Type</th>
                <th>Value</th>
            </tr>
        </THead>
        <TBody>
            <tr>
                <td><RadioButton checked={velocity.selected === 'C'} /></td>
                <td>Completed average</td>
                <td></td>
            </tr>
            <tr>
                <td><RadioButton checked={velocity.selected === 'T'} /></td>
                <td>Total average</td>
                <td></td>
            </tr>
            <tr>
                <td><RadioButton checked={velocity.selected === 'M'} /></td>
                <td>Median</td>
                <td></td>
            </tr>
            <tr>
                <td><RadioButton checked={velocity.selected === 'U'} /></td>
                <td>Custom</td>
                <td></td>
            </tr>
        </TBody>
    </ScrollableTable>);
}

export default VelocityPicker;