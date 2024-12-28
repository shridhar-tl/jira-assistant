const containerStyle = { position: "fixed", top: "0px", left: "0px", height: "100%", minHeight: "600px", width: "100%", minWidth: "700px", zIndex: 3000, backgroundColor: "#f1f5f9" };
const subContainerStyle = { width: "200px", marginTop: "150px", display: 'block', marginRight: 'auto', marginLeft: 'auto' };
const spinnerStyle = { fontSize: "150px", fontWeight: "bold" };

const loading = (message) => (
    <div style={containerStyle}>
        <div style={subContainerStyle}>
            <h4 className="animated fadeIn text-center">
                <i className="fa fa-refresh fa-spin" style={spinnerStyle}></i>
                <br /><br />
                {message}
            </h4>
        </div>
    </div>);

export default loading;