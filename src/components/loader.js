
const loading = (message) => (
    <div style={{ position: "fixed", top: "0px", left: "0px", height: "100%", minHeight: "600px", width: "100%", minWidth: "700px", zIndex: 3000, backgroundColor: "#f1f5f9" }}>
        <div className="center-block" style={{ width: "200px", marginTop: "150px" }}>
            <h4 className="animated fadeIn text-center">
                <i className="fa fa-refresh fa-spin" style={{ fontSize: "150px", fontWeight: "bold" }}></i>
                <br /><br />
                {message}
            </h4>
        </div>
    </div>);

export default loading;