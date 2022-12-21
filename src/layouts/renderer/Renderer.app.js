import React from "react";
import { Route, Routes } from "react-router-dom";

// Layout
const DefaultLayout = React.lazy(() => import('../../layouts/DefaultLayout/DefaultLayout'));

// Pages
const IntegrateWeb = true && true && React.lazy(() => import('../../views/pages/authenticate/ChooseAuthType'));
const BasicAuth = true && React.lazy(() => import('../../views/pages/authenticate/BasicAuth'));
const OptionsPage = React.lazy(() => import('../../views/settings/global/GlobalSettings'));

const Poker = true && React.lazy(() => import('../../views/poker/Poker'));

export default function Renderer({ authInfo: { userId }, authTypeChosen }) {
    return (<Routes>
        <Route exact path="/integrate" name="Authenticate Page" element={<IntegrateWeb
            onAuthTypeChosen={authTypeChosen} />} />

        <Route exact path="/integrate/basic" name="Basic Auth Page"
            element={<BasicAuth />}>
            <Route exact path=":store" name="Basic Auth Page"
                element={<BasicAuth />} />
        </Route>

        <Route exact path="/options" name="Options Page" element={<OptionsPage />} />

        <Route path="/poker/*" name="Planning Poker" element={<Poker hasExtensionSupport={true} />} />

        {!!userId && <Route path="/:userId/*" name="Home" element={<DefaultLayout key={userId} />} />}
    </Routes>);
}