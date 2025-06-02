import { Loader } from 'src/controls';

const containerStyle = { position: "fixed", top: "0px", left: "0px", height: "100%", minHeight: "600px", width: "100%", minWidth: "700px", zIndex: 3000, backgroundColor: "#f1f5f9" };
const subContainerStyle = { position: 'relative', width: "200px", marginTop: "150px", display: 'block', marginRight: 'auto', marginLeft: 'auto', backgroundColor: 'transparent' };

const loading = (message) => (
    <div style={containerStyle}>
        <div style={subContainerStyle}>
            <Loader size={150} />
            <h4 className="text-center">
                <br /><br />
                {message}
            </h4>
        </div>
    </div>);

export default loading;