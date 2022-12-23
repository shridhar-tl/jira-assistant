import React, { useState } from "react";
import { AppContextProvider } from "../../common/context";
import getLoader from '../../components/loader';
import { CustomDialog } from "../../dialogs";
import { withRouter } from "../../pollyfills";
import Renderer from "./Renderer";

function RootContext({ location, navigate, $session, switchUser, ...otherProps }) {
    const [contextProps] = useState({
        switchUser: (userId) => {
            let url = location.pathname.substring(2);
            url = url.substring(url.indexOf("/"));
            url = `/${userId}${url}`;
            switchUser(url);
        },
        navigate: (url, userbased) => {
            navigate(userbased ? `/${$session.userId}${url}` : url);
        }
    });

    return (<AppContextProvider value={contextProps}>
        <React.Suspense fallback={getLoader()}>
            <Renderer contextProps={contextProps} {...otherProps} />
            <CustomDialog />
        </React.Suspense>
    </AppContextProvider>);
}

export default withRouter(RootContext);