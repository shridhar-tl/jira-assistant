import React from "react";
import { Route, Routes } from "react-router-dom";

// Layout
const DefaultLayout = React.lazy(() => import('../../layouts/DefaultLayout/DefaultLayout'));

// Pages
const IntegrateExtn = React.lazy(() => import('../../views/pages/integrate/Integrate'));
const BasicAuth = React.lazy(() => import('../../views/pages/authenticate/BasicAuth'));
const OptionsPage = React.lazy(() => import('../../views/settings/global/GlobalSettings'));

export default function Renderer({ authInfo: { userId } }) {
    return (<Routes>
        <Route exact path="/integrate" name="Integrate Page" element={<IntegrateExtn />} />

        <Route exact path="/integrate/basic" name="Basic Auth Page" element={<BasicAuth />}>
            <Route exact path=":store" name="Basic Auth Page" element={<BasicAuth />} />
        </Route>

        <Route exact path="/options" name="Options Page" element={<OptionsPage />} />

        {userId && <Route path="/:userId/*" name="Home" element={<DefaultLayout key={userId} />} />}
    </Routes>);
}