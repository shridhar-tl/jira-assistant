import React from "react";
import { Route, Routes } from "react-router-dom";

// Layout
const DefaultLayout = React.lazy(() => import('../../layouts/DefaultLayout/DefaultLayout'));

// Pages
const IntegrateExtn = React.lazy(() => import('../../views/pages/integrate/Integrate'));
const ChooseAuthType = React.lazy(() => import('../../views/pages/authenticate/ChooseAuthType'));
const BasicAuth = React.lazy(() => import('../../views/pages/authenticate/BasicAuth'));
const OptionsPage = React.lazy(() => import('../../views/settings/global/GlobalSettings'));

const Poker = React.lazy(() => import('../../views/poker/Poker'));

export default function Renderer({
    isExtnValid, extnUnavailable, needIntegration, authType,
    userId, authTypeChosen }) {
    return (<Routes>
        <Route exact path="/integrate" name="Authenticate Page" element={<ChooseAuthType
            isExtnValid={isExtnValid} extnUnavailable={extnUnavailable}
            needIntegration={needIntegration} onAuthTypeChosen={authTypeChosen} />} />

        <Route exact path={"/integrate/extn"} name="Integrate Page"
            element={<IntegrateExtn setAuthType={authTypeChosen} />} />

        <Route exact path="/integrate/basic" name="Basic Auth Page"
            element={<BasicAuth setAuthType={authTypeChosen} />}>
            <Route exact path=":store" name="Basic Auth Page"
                element={<BasicAuth setAuthType={authTypeChosen} />} />
        </Route>

        <Route exact path="/options" name="Options Page" element={<OptionsPage />} />

        <Route path="/poker/*" name="Planning Poker" element={<Poker hasExtensionSupport={isExtnValid} />} />

        {!!authType && <Route path="/:userId/*" name="Home" element={<DefaultLayout key={userId} />} />}
    </Routes>);
}