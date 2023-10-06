import { TextBox } from "react-controls/controls";
import { ScrollableTable, TBody, THead } from "../../../../components/ScrollableTable";
import { RadioButton } from "../../../../controls";

function VelocityPicker({ velocity = {}, velocityInfo = {} }) {
    const { averageComitted, averageCompleted, median } = velocityInfo || {};

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
                <td className="pl-4">{averageCompleted}</td>
            </tr>
            <tr>
                <td><RadioButton checked={velocity.selected === 'T'} /></td>
                <td>Total average</td>
                <td className="ps-4">{averageComitted}</td>
            </tr>
            <tr>
                <td><RadioButton checked={velocity.selected === 'M'} /></td>
                <td>Median</td>
                <td className="ps-4">{median || averageComitted}</td>
            </tr>
            <tr>
                <td><RadioButton checked={velocity.selected === 'U'} /></td>
                <td>Custom</td>
                <td><TextBox className="w-100" disabled={velocity.selected !== 'U'} /></td>
            </tr>
        </TBody>
    </ScrollableTable>);
}

export default VelocityPicker;