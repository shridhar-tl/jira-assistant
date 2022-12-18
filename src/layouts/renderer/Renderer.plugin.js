import React from "react";
import { Route, Routes } from "react-router-dom";

// Layout
const DefaultLayout = React.lazy(() => import('../../layouts/DefaultLayout/DefaultLayout'));

// Pages
const OptionsPage = React.lazy(() => import('../../views/settings/global/GlobalSettings'));

const Poker = React.lazy(() => import('../../views/poker/Poker'));

export default function Renderer({ userId }) {
    const layout = (<DefaultLayout key={userId} />);
    return (<Routes>
        <Route exact path="/options" name="Options Page" element={<OptionsPage />} />

        <Route path="/poker/*" name="Planning Poker" element={<Poker hasExtensionSupport={false} />} />

        <Route path="/*" name="Home" element={layout} />
        <Route path="/:userId/*" name="Home" element={layout} />
    </Routes>);
}